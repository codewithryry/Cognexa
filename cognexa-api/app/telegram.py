import logging
import os
import secrets
from datetime import datetime, timezone

import requests
from sqlalchemy.orm import Session

from app.crypto import decrypt_str
from app.models import ChatChannel, ChatMessage, ChatSession, Integration, Settings, TelegramChatLink, User
from app.query import generate_answer_stream

logger = logging.getLogger("uvicorn.error")

TELEGRAM_API_BASE = "https://api.telegram.org/bot{token}"

# Same signal main.py uses -- set automatically by Render, never locally.
IS_PRODUCTION = bool(os.getenv("RENDER"))


def generate_webhook_secret() -> str:
    return secrets.token_urlsafe(24)


def telegram_get_me(bot_token: str) -> dict:
    response = requests.get(
        f"{TELEGRAM_API_BASE.format(token=bot_token)}/getMe", timeout=10
    )
    payload = response.json()
    if not response.ok or not payload.get("ok"):
        raise ValueError(payload.get("description") or "Invalid Telegram bot token")
    return payload["result"]


def telegram_set_webhook(bot_token: str, webhook_url: str, secret: str) -> None:
    response = requests.post(
        f"{TELEGRAM_API_BASE.format(token=bot_token)}/setWebhook",
        json={"url": webhook_url, "secret_token": secret},
        timeout=10,
    )
    payload = response.json()
    if not response.ok or not payload.get("ok"):
        raise ValueError(payload.get("description") or "Failed to register Telegram webhook")


def telegram_get_webhook_info(bot_token: str) -> dict:
    response = requests.get(
        f"{TELEGRAM_API_BASE.format(token=bot_token)}/getWebhookInfo", timeout=10
    )
    payload = response.json()
    if not response.ok or not payload.get("ok"):
        raise ValueError(payload.get("description") or "Failed to fetch Telegram webhook info")
    return payload["result"]


def telegram_delete_webhook(bot_token: str) -> None:
    try:
        requests.post(
            f"{TELEGRAM_API_BASE.format(token=bot_token)}/deleteWebhook", timeout=10
        )
    except requests.RequestException:
        pass


def telegram_send_message(bot_token: str, chat_id: int, text: str) -> None:
    requests.post(
        f"{TELEGRAM_API_BASE.format(token=bot_token)}/sendMessage",
        json={"chat_id": chat_id, "text": text[:4096]},
        timeout=15,
    )


def _get_or_create_settings(db: Session, user_id: int) -> Settings:
    settings = db.query(Settings).filter(Settings.user_id == user_id).first()
    if not settings:
        settings = Settings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _get_or_create_chat_link(db: Session, channel: ChatChannel, telegram_chat: dict) -> TelegramChatLink:
    chat_id = telegram_chat["id"]
    link = (
        db.query(TelegramChatLink)
        .filter(
            TelegramChatLink.channel_id == channel.id,
            TelegramChatLink.telegram_chat_id == chat_id,
        )
        .first()
    )
    if link:
        return link

    link = TelegramChatLink(
        channel_id=channel.id,
        telegram_chat_id=chat_id,
        telegram_username=telegram_chat.get("username") or telegram_chat.get("first_name"),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def _get_or_create_session(db: Session, channel: ChatChannel, link: TelegramChatLink) -> ChatSession:
    if link.chat_session_id:
        session = db.query(ChatSession).filter(ChatSession.id == link.chat_session_id).first()
        if session:
            return session

    title = f"Telegram: {link.telegram_username or link.telegram_chat_id}"
    session = ChatSession(user_id=channel.user_id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)

    link.chat_session_id = session.id
    db.commit()

    return session


def _resolve_integrations(db: Session, user_id: int) -> list[Integration]:
    """All of the user's configured LLM integrations with an API key set,
    most-recently-added first -- the order attempts are tried in, so if the
    newest/primary one is down, older ones still connected act as a backup."""
    return (
        db.query(Integration)
        .filter(Integration.user_id == user_id, Integration.api_key.isnot(None))
        .order_by(Integration.created_at.desc())
        .all()
    )


def _run_generation(question, user_id, settings, integration, db):
    full_answer = []
    sources = []
    for event in generate_answer_stream(
        question,
        user_id=user_id,
        ollama_url=settings.ollama_url,
        llm_model=settings.llm_model,
        external_provider=integration.provider_name if integration else None,
        external_api_key=integration.api_key if integration else None,
        external_base_url=integration.base_url if integration else None,
        external_model=integration.model if integration else None,
        db=db,
    ):
        if event["type"] == "sources":
            sources = event["sources"]
        elif event["type"] == "token":
            full_answer.append(event["content"])
    return "".join(full_answer), sources


def handle_telegram_update(db: Session, channel: ChatChannel, update: dict, retrieval_gate, plan_priority_fn) -> None:
    """Answer one Telegram update using the channel owner's RAG pipeline, and
    reply on Telegram -- swallows its own errors so the webhook always 200s
    (an exception here should never surface as a Telegram delivery retry)."""
    message = update.get("message") or update.get("edited_message")
    if not message or "text" not in message:
        return

    bot_token = decrypt_str(channel.bot_token)
    chat = message["chat"]
    question = message["text"].strip()
    if not question:
        return

    try:
        link = _get_or_create_chat_link(db, channel, chat)
        is_first_message = link.chat_session_id is None
        session = _get_or_create_session(db, channel, link)
        settings = _get_or_create_settings(db, channel.user_id)

        user = db.query(User).filter(User.id == channel.user_id).first()
        if not user:
            return
        plan = user.plan or "community"

        # Try every integration the user has connected, most recent first;
        # if one is dead (bad key, provider outage, timeout), fall back to
        # the next. In production there's no local Ollama running, so a
        # local-model attempt (None) would just burn a connection timeout on
        # every failure -- only add it as a last resort in local dev, where
        # Ollama is realistically available.
        candidates = _resolve_integrations(db, channel.user_id)
        if not IS_PRODUCTION:
            candidates = candidates + [None]

        answer_text = None
        sources = []
        last_error = None
        with retrieval_gate(plan_priority_fn(plan)):
            for candidate in candidates:
                try:
                    answer_text, sources = _run_generation(question, channel.user_id, settings, candidate, db)
                    break
                except Exception as exc:
                    last_error = exc
                    label = candidate.provider_name if candidate else "local model"
                    logger.warning("Telegram: provider '%s' failed, trying next: %s", label, exc)
                    continue

        if answer_text is None:
            raise last_error or RuntimeError("No AI provider was able to answer.")

        answer_text = answer_text or "I couldn't find an answer to that."

        chat_message = ChatMessage(
            user_id=channel.user_id,
            session_id=session.id,
            question=question,
            answer=answer_text,
            sources=",".join(sources),
        )
        db.add(chat_message)
        if is_first_message:
            session.title = question[:60]
        session.updated_at = datetime.now(timezone.utc)
        db.commit()

        telegram_send_message(bot_token, chat["id"], answer_text)
    except Exception as exc:
        try:
            telegram_send_message(bot_token, chat["id"], f"Sorry, something went wrong: {exc}")
        except Exception:
            pass
