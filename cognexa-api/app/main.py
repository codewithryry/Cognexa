import hashlib
import io
import json
import re
import zipfile
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
import os
from pypdf import PdfReader
from docx import Document as DocxDocument
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import Base, SessionLocal, engine, get_db
from app.models import ChatMessage, Document, Integration, Settings, User
from app.rag import delete_document_chunks, process_document
from app.query import generate_answer_stream
from app.scheduler import PriorityWorkerPool, PrioritySlotGate, plan_priority
from app.schemas import (
    ChatMessageOut,
    DbStatusOut,
    DocumentOut,
    IntegrationIn,
    IntegrationOut,
    PlanOut,
    SettingsIn,
    SettingsOut,
    StatsOut,
    SubscribeIn,
    TokenOut,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
)

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")


def extract_image_text(file_path):
    try:
        import pytesseract
        from PIL import Image

        return pytesseract.image_to_string(Image.open(file_path)).strip()
    except Exception:
        return ""


def extract_document_text(file_path, filename):
    """Returns (text, file_type, page_count) for a file already on disk, or
    (None, None, None) if the extension isn't supported."""
    text = ""
    file_type = None
    page_count = None
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        file_type = "pdf"
        reader = PdfReader(file_path)
        page_count = len(reader.pages)

        for page in reader.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text + "\n"

    elif filename_lower.endswith(".docx"):
        file_type = "docx"
        doc = DocxDocument(file_path)

        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

    elif filename_lower.endswith(IMAGE_EXTENSIONS):
        file_type = "image"
        text = extract_image_text(file_path)

    else:
        return None, None, None

    return text, file_type, page_count


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cognexa API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "app/uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Priority scheduling backing the plan pricing claims: paid plans' document
# indexing jobs and chat generations are served ahead of Community's when
# multiple are in flight at once. See app/scheduler.py.
INDEX_POOL = PriorityWorkerPool(num_workers=3)
RETRIEVAL_GATE = PrioritySlotGate(capacity=2)


def index_document_job(document_id, text, filename, user_id, chunk_size, chunk_overlap):
    db = SessionLocal()
    try:
        result = process_document(
            text,
            filename,
            user_id=user_id,
            document_id=document_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.chunks = result["chunks"]
            db.commit()
    finally:
        db.close()

PLAN_LIMITS = {
    "community": {"max_documents": 25, "max_storage_bytes": 15 * 1024 * 1024},
    "pro": {"max_documents": 100, "max_storage_bytes": 10 * 1024 * 1024 * 1024},
    "team": {"max_documents": None, "max_storage_bytes": None},
}

PLAN_DISPLAY_NAMES = {
    "community": "Community",
    "pro": "Pro",
    "team": "Unlimited",
}

OPENROUTER_FREE_MODELS = {
    "openai/gpt-oss-20b:free",
    "google/gemma-4-26b-a4b-it:free",
    "cohere/north-mini-code:free",
    "tencent/hy3:free",
}

INTEGRATION_LIMITS = {
    "community": 1,
    "pro": 3,
    "team": None,
}

# Only the Community plan meters AI-provider usage; Pro/Unlimited use their own
# API usage/keys and are never capped here.
COMMUNITY_MONTHLY_AI_CREDITS = 50
CREDIT_PERIOD = timedelta(days=30)


def get_remaining_community_credits(user, db) -> int:
    now = datetime.utcnow()
    period_start = user.ai_credits_period_start

    if period_start is None or now - period_start >= CREDIT_PERIOD:
        user.ai_credits_used = 0
        user.ai_credits_period_start = now
        db.commit()

    return max(0, COMMUNITY_MONTHLY_AI_CREDITS - (user.ai_credits_used or 0))


def consume_community_credit(user, db):
    user.ai_credits_used = (user.ai_credits_used or 0) + 1
    db.commit()


def is_allowed_community_integration(provider_name, model, base_url):
    return (
        provider_name == "OpenRouter"
        and model in OPENROUTER_FREE_MODELS
        and not base_url
    )


def get_plan_usage(db: Session, user_id: int):
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    document_count = len(documents)
    storage_bytes = sum(doc.size_bytes or 0 for doc in documents)
    return document_count, storage_bytes


def get_or_create_settings(db: Session, user_id: int) -> Settings:
    settings = db.query(Settings).filter(Settings.user_id == user_id).first()

    if not settings:
        settings = Settings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@app.get("/")
def home():
    return {
        "message": "Cognexa API Running"
    }


@app.get("/health")
def health():
    return {
        "status": "online",
        "message": "Backend connected successfully"
    }


@app.get("/health/db", response_model=DbStatusOut)
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"connected": True, "message": "Database connected successfully"}
    except Exception as e:
        return {"connected": False, "message": str(e)}


@app.post("/auth/register", response_model=TokenOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_in.name,
        email=user_in.email,
        password=hash_password(user_in.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    return {"access_token": token, "user": user}


@app.post("/auth/login", response_model=TokenOut)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id)})

    return {"access_token": token, "user": user}


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.patch("/auth/me", response_model=UserOut)
def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = user_in.name

    if user_in.password:
        current_user.password = hash_password(user_in.password)

    db.commit()
    db.refresh(current_user)

    return current_user


@app.get("/billing/plan", response_model=PlanOut)
def get_billing_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = current_user.plan or "community"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["community"])
    document_count, storage_bytes = get_plan_usage(db, current_user.id)

    return {
        "plan": plan,
        "max_documents": limits["max_documents"],
        "max_storage_bytes": limits["max_storage_bytes"],
        "document_count": document_count,
        "storage_bytes": storage_bytes,
        "max_ai_credits": COMMUNITY_MONTHLY_AI_CREDITS if plan == "community" else None,
        "ai_credits_remaining": (
            get_remaining_community_credits(current_user, db) if plan == "community" else None
        ),
    }


@app.post("/billing/subscribe", response_model=PlanOut)
def subscribe_plan(
    subscribe_in: SubscribeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if subscribe_in.plan not in PLAN_LIMITS:
        raise HTTPException(status_code=400, detail="Unknown plan")

    # Demo checkout — no real payment processor wired up. Any submitted card
    # details are accepted and discarded; the plan is applied immediately.
    current_user.plan = subscribe_in.plan
    db.commit()
    db.refresh(current_user)

    limits = PLAN_LIMITS[subscribe_in.plan]
    document_count, storage_bytes = get_plan_usage(db, current_user.id)
    plan = current_user.plan

    return {
        "plan": plan,
        "max_documents": limits["max_documents"],
        "max_storage_bytes": limits["max_storage_bytes"],
        "document_count": document_count,
        "storage_bytes": storage_bytes,
        "max_ai_credits": COMMUNITY_MONTHLY_AI_CREDITS if plan == "community" else None,
        "ai_credits_remaining": (
            get_remaining_community_credits(current_user, db) if plan == "community" else None
        ),
    }


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = current_user.plan or "community"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["community"])
    plan_display_name = PLAN_DISPLAY_NAMES.get(plan, plan.capitalize())
    document_count, storage_bytes = get_plan_usage(db, current_user.id)
    upgrade_hint = "Upgrade your plan for unlimited documents." if plan != "team" else ""

    if limits["max_documents"] is not None and document_count >= limits["max_documents"]:
        raise HTTPException(
            status_code=402,
            detail=(
                f"{plan_display_name} plan limit reached ({limits['max_documents']} documents). "
                f"{upgrade_hint}"
            ),
        )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    contents = await file.read()
    settings = get_or_create_settings(db, current_user.id)

    if limits["max_storage_bytes"] is not None and (
        storage_bytes + len(contents) > limits["max_storage_bytes"]
    ):
        storage_upgrade_hint = "Upgrade your plan for more storage." if plan != "team" else ""
        raise HTTPException(
            status_code=402,
            detail=(
                f"{plan_display_name} plan storage limit reached "
                f"({limits['max_storage_bytes'] // (1024 * 1024)} MB). "
                f"{storage_upgrade_hint}"
            ),
        )

    content_hash = hashlib.sha256(contents).hexdigest()

    if settings.duplicate_detection:
        existing = (
            db.query(Document)
            .filter(Document.user_id == current_user.id, Document.content_hash == content_hash)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f'This file is identical to the already-uploaded "{existing.filename}".',
            )

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    text, file_type, page_count = extract_document_text(file_path, file.filename)
    if file_type is None:
        return {
            "error": "Only PDF, DOCX, JPG and PNG files are supported"
        }

    preview_text = text[:1000] if text.strip() else "Image uploaded (no text detected)."

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        chunks=0,
        preview=preview_text,
        size_bytes=os.path.getsize(file_path),
        page_count=page_count,
        content_hash=content_hash,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    INDEX_POOL.submit(
        plan_priority(plan),
        index_document_job,
        document.id,
        text,
        file.filename,
        current_user.id,
        settings.chunk_size,
        settings.chunk_overlap,
    )

    return {
        "id": document.id,
        "filename": file.filename,
        "characters": len(text),
        "chunks_saved": 0,
        "processing": True,
        "preview": preview_text
    }


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@app.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document or not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(document.file_path, filename=document.filename)


@app.post("/documents/{document_id}/reindex")
def reindex_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=404,
            detail="The original file is no longer available, so it can't be re-indexed.",
        )

    text, file_type, _ = extract_document_text(document.file_path, document.filename)
    if file_type is None:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    settings = get_or_create_settings(db, current_user.id)
    plan = current_user.plan or "community"

    delete_document_chunks(document.id)
    document.chunks = 0
    db.commit()

    INDEX_POOL.submit(
        plan_priority(plan),
        index_document_job,
        document.id,
        text,
        document.filename,
        current_user.id,
        settings.chunk_size,
        settings.chunk_overlap,
    )

    return {"queued": True}


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)

    delete_document_chunks(document.id)

    db.delete(document)
    db.commit()

    return {"deleted": document_id}


@app.delete("/documents")
def delete_all_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()

    for document in documents:
        if document.file_path and os.path.exists(document.file_path):
            os.remove(document.file_path)
        delete_document_chunks(document.id)
        db.delete(document)

    db.commit()

    return {"deleted": len(documents)}


DOCUMENT_LISTING_PATTERN = re.compile(
    r"\b(list|what|which|how many)\b.*\b(document|documents|file|files|upload|uploads|knowledge base)\b",
    re.IGNORECASE,
)


def is_document_listing_question(question: str) -> bool:
    return bool(DOCUMENT_LISTING_PATTERN.search(question))


@app.post("/ask")
async def ask_question(
    question: str,
    document_ids: list[int] | None = Query(default=None),
    source: str = Query(default="local"),
    integration_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)

    if document_ids:
        owned_count = (
            db.query(Document)
            .filter(Document.id.in_(document_ids), Document.user_id == current_user.id)
            .count()
        )
        if owned_count != len(document_ids):
            raise HTTPException(status_code=404, detail="One or more documents not found")

    plan = current_user.plan or "community"

    def resolve_integration(integration):
        if not integration or not integration.api_key:
            return None
        if plan == "community" and not is_allowed_community_integration(
            integration.provider_name, integration.model, integration.base_url
        ):
            return None
        return integration

    selected_integration = None
    if source == "integration" and integration_id is not None:
        requested_integration = (
            db.query(Integration)
            .filter(Integration.id == integration_id, Integration.user_id == current_user.id)
            .first()
        )
        if not requested_integration:
            raise HTTPException(status_code=404, detail="Integration not found.")
        selected_integration = resolve_integration(requested_integration)
        if not selected_integration:
            if not requested_integration.api_key:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"The {requested_integration.provider_name} integration has no API key "
                        "saved. Fix it under Settings > Integrations."
                    ),
                )
            raise HTTPException(
                status_code=402,
                detail=(
                    f"The {requested_integration.provider_name} integration "
                    f"({requested_integration.model or 'no model'}) isn't allowed on the "
                    "Community plan. Pick one of the free OpenRouter models under "
                    "Settings > Integrations, or upgrade your plan."
                ),
            )
    elif source == "auto":
        auto_integration = (
            db.query(Integration)
            .filter(Integration.user_id == current_user.id)
            .order_by(Integration.created_at.desc())
            .first()
        )
        selected_integration = resolve_integration(auto_integration)
        if (
            auto_integration
            and not selected_integration
            and auto_integration.api_key
            and plan == "community"
        ):
            raise HTTPException(
                status_code=402,
                detail=(
                    f"Your saved {auto_integration.provider_name} integration "
                    f"({auto_integration.model or 'no model'}) isn't allowed on the "
                    "Community plan. Pick one of the free OpenRouter models under "
                    "Settings > Integrations, or upgrade your plan."
                ),
            )

    # Community's OpenRouter integration is metered — once the monthly credit
    # allowance is used up, silently fall back to the local model instead of
    # calling OpenRouter. Pro/Unlimited use their own API usage and are never
    # capped here.
    if selected_integration and plan == "community":
        if get_remaining_community_credits(current_user, db) <= 0:
            selected_integration = None

    def event_stream():
        full_answer = []
        sources = []

        try:
            # "List/what/how many documents..." is a metadata question, not a
            # content question — answering it via embedding similarity search
            # is unreliable (it only surfaces documents whose chunks happen to
            # rank high for that phrasing, which skews by document type/length
            # and can drop documents from the answer entirely). The document
            # list already exists in the database, so answer it directly.
            if not document_ids and is_document_listing_question(question):
                owned_documents = (
                    db.query(Document)
                    .filter(Document.user_id == current_user.id)
                    .order_by(Document.created_at.asc())
                    .all()
                )
                sources = sorted({doc.filename for doc in owned_documents})

                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

                if not owned_documents:
                    answer_text = "You haven't uploaded any documents yet."
                else:
                    answer_text = "You've uploaded:\n" + "\n".join(
                        f"- {doc.filename}" for doc in owned_documents
                    )

                full_answer.append(answer_text)
                yield f"data: {json.dumps({'type': 'token', 'content': answer_text})}\n\n"

                message = ChatMessage(
                    user_id=current_user.id,
                    question=question,
                    answer="".join(full_answer),
                    sources=",".join(sources),
                )
                db.add(message)
                db.commit()

                yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"
                return

            if selected_integration and plan == "community":
                consume_community_credit(current_user, db)

            with RETRIEVAL_GATE(plan_priority(plan)):
                for event in generate_answer_stream(
                    question,
                    user_id=current_user.id,
                    document_ids=document_ids,
                    ollama_url=settings.ollama_url,
                    llm_model=settings.llm_model,
                    external_provider=selected_integration.provider_name if selected_integration else None,
                    external_api_key=selected_integration.api_key if selected_integration else None,
                    external_base_url=selected_integration.base_url if selected_integration else None,
                    external_model=selected_integration.model if selected_integration else None,
                ):
                    if event["type"] == "sources":
                        sources = event["sources"]
                    elif event["type"] == "token":
                        full_answer.append(event["content"])

                    yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        message = ChatMessage(
            user_id=current_user.id,
            question=question,
            answer="".join(full_answer),
            sources=",".join(sources),
        )
        db.add(message)
        db.commit()

        yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/chat/history", response_model=list[ChatMessageOut])
def chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@app.delete("/chat/history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()

    return {"cleared": True}


@app.get("/settings", response_model=SettingsOut)
def read_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_or_create_settings(db, current_user.id)


@app.put("/settings", response_model=SettingsOut)
def update_settings(
    settings_in: SettingsIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)

    for field, value in settings_in.model_dump().items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    return settings


def integration_to_out(integration: Integration) -> dict:
    return {
        "id": integration.id,
        "provider_name": integration.provider_name,
        "base_url": integration.base_url,
        "model": integration.model,
        "connected": bool(integration.api_key or integration.base_url),
        "created_at": integration.created_at,
    }


@app.get("/integrations", response_model=list[IntegrationOut])
def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    integrations = (
        db.query(Integration)
        .filter(Integration.user_id == current_user.id)
        .order_by(Integration.created_at.asc())
        .all()
    )
    return [integration_to_out(i) for i in integrations]


@app.post("/integrations", response_model=IntegrationOut)
def create_integration(
    integration_in: IntegrationIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = current_user.plan or "community"

    if plan == "community" and not is_allowed_community_integration(
        integration_in.provider_name, integration_in.model, integration_in.base_url
    ):
        raise HTTPException(
            status_code=402,
            detail=(
                "The Community plan can only connect OpenRouter's free models. "
                "Upgrade your plan to use any provider and model."
            ),
        )

    existing_count = (
        db.query(Integration).filter(Integration.user_id == current_user.id).count()
    )
    max_integrations = INTEGRATION_LIMITS.get(plan, INTEGRATION_LIMITS["community"])
    if max_integrations is not None and existing_count >= max_integrations:
        raise HTTPException(
            status_code=402,
            detail=(
                f"{PLAN_DISPLAY_NAMES.get(plan, plan.capitalize())} plan allows up to "
                f"{max_integrations} saved integration(s). Remove one or upgrade your plan."
            ),
        )

    integration = Integration(
        user_id=current_user.id,
        provider_name=integration_in.provider_name,
        api_key=integration_in.api_key or None,
        base_url=integration_in.base_url or None,
        model=integration_in.model or None,
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    return integration_to_out(integration)


@app.delete("/integrations/{integration_id}")
def delete_integration(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    integration = (
        db.query(Integration)
        .filter(Integration.id == integration_id, Integration.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    db.delete(integration)
    db.commit()

    return {"deleted": integration_id}


@app.get("/stats", response_model=StatsOut)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()

    total_documents = len(documents)
    total_chunks = sum(doc.chunks or 0 for doc in documents)

    storage_bytes = 0
    for doc in documents:
        if doc.file_path and os.path.exists(doc.file_path):
            storage_bytes += os.path.getsize(doc.file_path)

    today = datetime.now(timezone.utc).date()
    questions_today = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .all()
    )
    questions_today = sum(
        1
        for msg in questions_today
        if msg.created_at and msg.created_at.date() == today
    )

    return {
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "questions_today": questions_today,
        "storage_bytes": storage_bytes,
    }


@app.get("/data/export")
def export_knowledge_base(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.asc())
        .all()
    )

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        manifest = []
        for document in documents:
            manifest.append({
                "id": document.id,
                "filename": document.filename,
                "file_type": document.file_type,
                "chunks": document.chunks,
                "size_bytes": document.size_bytes,
                "page_count": document.page_count,
                "created_at": document.created_at.isoformat() if document.created_at else None,
            })
            if document.file_path and os.path.exists(document.file_path):
                zf.write(document.file_path, arcname=f"documents/{document.filename}")

        zf.writestr("manifest.json", json.dumps(manifest, indent=2))

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=cognexa_knowledge_base.zip"},
    )


@app.get("/data/backup")
def backup_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    chat_messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).all()
    integrations = db.query(Integration).filter(Integration.user_id == current_user.id).all()

    def iso(value):
        return value.isoformat() if value else None

    backup = {
        "backup_version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "plan": current_user.plan,
        },
        "settings": {
            "ollama_url": settings.ollama_url,
            "llm_model": settings.llm_model,
            "embedding_model": settings.embedding_model,
            "chunk_size": settings.chunk_size,
            "chunk_overlap": settings.chunk_overlap,
            "theme": settings.theme,
            "email_notifications": settings.email_notifications,
            "notify_indexing_finished": settings.notify_indexing_finished,
            "notify_failed_uploads": settings.notify_failed_uploads,
            "notify_ai_errors": settings.notify_ai_errors,
            "notify_weekly_report": settings.notify_weekly_report,
        },
        # Document metadata only -- file content is not included here, use
        # "Export Knowledge Base" for the actual files.
        "documents": [
            {
                "filename": d.filename,
                "file_type": d.file_type,
                "chunks": d.chunks,
                "preview": d.preview,
                "size_bytes": d.size_bytes,
                "page_count": d.page_count,
                "created_at": iso(d.created_at),
            }
            for d in documents
        ],
        "chat_messages": [
            {
                "question": m.question,
                "answer": m.answer,
                "sources": m.sources,
                "created_at": iso(m.created_at),
            }
            for m in chat_messages
        ],
        # API keys are never included in a backup for security -- restoring an
        # integration re-creates the provider/model entry but you'll need to
        # re-enter its key afterward.
        "integrations": [
            {
                "provider_name": i.provider_name,
                "base_url": i.base_url,
                "model": i.model,
            }
            for i in integrations
        ],
    }

    return Response(
        content=json.dumps(backup, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=cognexa_backup.json"},
    )


@app.post("/data/restore")
async def restore_account(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        backup = json.loads(await file.read())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="That file isn't a valid backup export.")

    if not isinstance(backup, dict) or "settings" not in backup:
        raise HTTPException(status_code=400, detail="That file isn't a valid Cognexa backup.")

    # Restoring replaces current settings, chat history, and integrations with
    # the backup's. Documents are not restored here -- the backup only stores
    # document metadata, not file content, so there's nothing to re-index.
    settings = get_or_create_settings(db, current_user.id)
    for field, value in (backup.get("settings") or {}).items():
        if hasattr(settings, field):
            setattr(settings, field, value)

    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    for m in backup.get("chat_messages") or []:
        db.add(ChatMessage(
            user_id=current_user.id,
            question=m.get("question", ""),
            answer=m.get("answer", ""),
            sources=m.get("sources"),
        ))

    plan = current_user.plan or "community"
    max_integrations = INTEGRATION_LIMITS.get(plan, INTEGRATION_LIMITS["community"])
    db.query(Integration).filter(Integration.user_id == current_user.id).delete()
    restored_integrations = 0
    for i in backup.get("integrations") or []:
        if max_integrations is not None and restored_integrations >= max_integrations:
            break
        if plan == "community" and not is_allowed_community_integration(
            i.get("provider_name"), i.get("model"), i.get("base_url")
        ):
            continue
        db.add(Integration(
            user_id=current_user.id,
            provider_name=i.get("provider_name", "Cline"),
            base_url=i.get("base_url"),
            model=i.get("model"),
        ))
        restored_integrations += 1

    db.commit()

    return {
        "restored_chat_messages": len(backup.get("chat_messages") or []),
        "restored_integrations": restored_integrations,
    }


@app.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    for document in documents:
        if document.file_path and os.path.exists(document.file_path):
            os.remove(document.file_path)
        delete_document_chunks(document.id)
        db.delete(document)

    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.query(Integration).filter(Integration.user_id == current_user.id).delete()
    db.query(Settings).filter(Settings.user_id == current_user.id).delete()

    db.delete(current_user)
    db.commit()

    return {"deleted": True}
