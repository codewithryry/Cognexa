import json
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
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
from app.database import Base, engine, get_db
from app.models import ChatMessage, Document, Settings, User
from app.rag import delete_document_chunks, process_document
from app.query import generate_answer_stream
from app.schemas import (
    ChatMessageOut,
    ClineSettingsIn,
    ClineSettingsOut,
    DbStatusOut,
    DocumentOut,
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

PLAN_LIMITS = {
    "community": {"max_documents": 25, "max_storage_bytes": 500 * 1024 * 1024},
    "pro": {"max_documents": None, "max_storage_bytes": None},
    "team": {"max_documents": None, "max_storage_bytes": None},
}


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

    return {
        "plan": current_user.plan,
        "max_documents": limits["max_documents"],
        "max_storage_bytes": limits["max_storage_bytes"],
        "document_count": document_count,
        "storage_bytes": storage_bytes,
    }


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limits = PLAN_LIMITS.get(current_user.plan or "community", PLAN_LIMITS["community"])
    document_count, storage_bytes = get_plan_usage(db, current_user.id)

    if limits["max_documents"] is not None and document_count >= limits["max_documents"]:
        raise HTTPException(
            status_code=402,
            detail=(
                f"Community plan limit reached ({limits['max_documents']} documents). "
                "Upgrade to Pro for unlimited documents."
            ),
        )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    contents = await file.read()

    if limits["max_storage_bytes"] is not None and (
        storage_bytes + len(contents) > limits["max_storage_bytes"]
    ):
        raise HTTPException(
            status_code=402,
            detail=(
                f"Community plan storage limit reached "
                f"({limits['max_storage_bytes'] // (1024 * 1024)} MB). "
                "Upgrade to Pro for more storage."
            ),
        )

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    text = ""
    file_type = None
    page_count = None
    filename_lower = file.filename.lower()

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
        return {
            "error": "Only PDF, DOCX, JPG and PNG files are supported"
        }

    settings = get_or_create_settings(db, current_user.id)

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
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    rag_result = process_document(
        text,
        file.filename,
        user_id=current_user.id,
        document_id=document.id,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    document.chunks = rag_result["chunks"]
    db.commit()

    return {
        "id": document.id,
        "filename": file.filename,
        "characters": len(text),
        "chunks_saved": rag_result["chunks"],
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


@app.post("/ask")
async def ask_question(
    question: str,
    document_ids: list[int] | None = Query(default=None),
    source: str = Query(default="local"),
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

    has_integration = bool(settings.cline_api_key)
    use_integration = (source == "integration" and has_integration) or (
        source == "auto" and has_integration
    )

    def event_stream():
        full_answer = []
        sources = []

        try:
            for event in generate_answer_stream(
                question,
                user_id=current_user.id,
                document_ids=document_ids,
                ollama_url=settings.ollama_url,
                llm_model=settings.llm_model,
                external_provider=settings.integration_provider if use_integration else None,
                external_api_key=settings.cline_api_key if use_integration else None,
                external_base_url=settings.integration_base_url if use_integration else None,
                external_model=settings.integration_model if use_integration else None,
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


@app.get("/integrations/cline", response_model=ClineSettingsOut)
def read_cline_integration(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)

    return {
        "connected": bool(settings.cline_api_key),
        "cline_api_key": settings.cline_api_key,
        "provider_name": settings.integration_provider or "Cline",
        "base_url": settings.integration_base_url,
        "model": settings.integration_model,
    }


@app.put("/integrations/cline", response_model=ClineSettingsOut)
def update_cline_integration(
    cline_in: ClineSettingsIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    settings.cline_api_key = cline_in.cline_api_key or None
    settings.integration_provider = cline_in.provider_name or "Cline"
    settings.integration_base_url = cline_in.base_url or None
    settings.integration_model = cline_in.model or None

    db.commit()
    db.refresh(settings)

    return {
        "connected": bool(settings.cline_api_key or settings.integration_base_url),
        "cline_api_key": settings.cline_api_key,
        "provider_name": settings.integration_provider or "Cline",
        "base_url": settings.integration_base_url,
        "model": settings.integration_model,
    }


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
