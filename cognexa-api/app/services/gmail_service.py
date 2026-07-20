import base64
import json
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger("uvicorn.error")

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH", "app/uploads/credentials.json")
TOKEN_PATH = os.getenv("GMAIL_TOKEN_PATH", "app/uploads/token.json")

_service = None


class GmailNotAuthorizedError(RuntimeError):
    pass


if os.path.exists(CREDENTIALS_PATH) and not os.path.exists(TOKEN_PATH) and not os.getenv("GMAIL_TOKEN_JSON"):
    # Half-configured: a client secret was uploaded but the one-time local
    # authorization step hasn't been run yet. Non-fatal -- just surfaced
    # loudly at startup so it isn't a silent surprise the first time
    # something tries to send an email.
    logger.warning(
        "%s found but %s is missing -- Gmail sending is not authorized yet. "
        "Run `python -m app.scripts.gmail_authorize` locally, then copy the generated "
        "token.json to %s on this server.",
        CREDENTIALS_PATH, TOKEN_PATH, TOKEN_PATH,
    )


def is_authorized() -> bool:
    return bool(os.getenv("GMAIL_TOKEN_JSON")) or os.path.exists(TOKEN_PATH)


def _load_credentials():
    """GMAIL_TOKEN_JSON (the full contents of token.json, pasted in as an
    env var) takes priority -- Render's filesystem is ephemeral, wiped on
    every redeploy, so a token.json copied there by hand wouldn't survive.
    An env var does. Falls back to a real file for local dev, where you ran
    the authorization script directly against this checkout."""
    from google.oauth2.credentials import Credentials

    token_json = os.getenv("GMAIL_TOKEN_JSON")
    if token_json:
        return Credentials.from_authorized_user_info(json.loads(token_json), SCOPES), None

    if not os.path.exists(TOKEN_PATH):
        raise GmailNotAuthorizedError(
            f"Gmail isn't authorized yet: neither GMAIL_TOKEN_JSON nor {TOKEN_PATH} is set. "
            "Run the Gmail authorization script locally first "
            "(python -m app.scripts.gmail_authorize), then either copy token.json's contents "
            "into the GMAIL_TOKEN_JSON env var (required on Render -- its filesystem doesn't "
            "persist across redeploys) or copy the file itself for local dev."
        )
    return Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES), TOKEN_PATH


def _get_service():
    """Loaded lazily (not at import/startup) so a missing token can never
    crash the whole app on boot -- it only raises when an email is actually
    about to be sent, right where the caller can catch and log it."""
    global _service
    if _service is not None:
        return _service

    from google.auth.transport.requests import Request as GoogleAuthRequest
    from googleapiclient.discovery import build

    creds, token_file_path = _load_credentials()

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleAuthRequest())
            # Only persist back to disk when we actually loaded from a file
            # (local dev). GMAIL_TOKEN_JSON is refreshed in memory each time
            # the process starts instead -- there's nowhere durable to write
            # a rotated value back to on Render, but the same refresh_token
            # keeps working across restarts regardless.
            if token_file_path:
                with open(token_file_path, "w", encoding="utf-8") as f:
                    f.write(creds.to_json())
        else:
            raise GmailNotAuthorizedError(
                "Gmail credentials exist but are invalid and can't be refreshed (no refresh "
                "token). Re-run the Gmail authorization script locally to generate a fresh "
                "token.json."
            )

    _service = build("gmail", "v1", credentials=creds)
    return _service


def send_html_email(to_email: str, subject: str, html: str) -> None:
    service = _get_service()

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    # No From header set: the gmail.send scope doesn't grant access to look
    # up the authenticated account's address (that needs a separate,
    # broader scope like gmail.readonly), and it's unnecessary anyway --
    # the Gmail API always sends as the authenticated account regardless of
    # what From is set to, so a GMAIL_SENDER_EMAIL override is cosmetic only.
    sender_override = os.getenv("GMAIL_SENDER_EMAIL")
    if sender_override:
        message["From"] = sender_override
    message["To"] = to_email
    message.attach(MIMEText(html, "html"))

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    service.users().messages().send(userId="me", body={"raw": raw}).execute()
