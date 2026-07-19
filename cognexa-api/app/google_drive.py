import hashlib
import io
import json
import os
import re
from datetime import datetime, timezone

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.models import Document
from app.rag import delete_document_chunks, process_document

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".jpg", ".jpeg", ".png")

FOLDER_MIME = "application/vnd.google-apps.folder"

# Native Google Docs types have no raw binary to download — they must be
# exported into one of the file types the RAG pipeline already knows how to
# read (extract_document_text supports PDF, DOCX, JPG, PNG).
GOOGLE_EXPORT_MIME_MAP = {
    "application/vnd.google-apps.document": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.spreadsheet": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.presentation": ("application/pdf", ".pdf"),
}

FOLDER_URL_PATTERNS = [
    re.compile(r"/folders/([a-zA-Z0-9_-]+)"),
    re.compile(r"[?&]id=([a-zA-Z0-9_-]+)"),
]


def extract_folder_id(url):
    url = (url or "").strip()
    for pattern in FOLDER_URL_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    if re.fullmatch(r"[a-zA-Z0-9_-]+", url):
        return url
    return None


def build_drive_service(service_account_json, subject_email):
    """Domain-wide delegation: the service account impersonates subject_email
    so it can read that specific user's Drive without their own OAuth login."""
    info = json.loads(service_account_json)
    credentials = service_account.Credentials.from_service_account_info(
        info, scopes=SCOPES
    ).with_subject(subject_email)
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def _iter_folder_files(service, folder_id, path_prefix=""):
    page_token = None
    while True:
        response = (
            service.files()
            .list(
                q=f"'{folder_id}' in parents and trashed = false",
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )

        for f in response.get("files", []):
            label = f"{path_prefix}{f['name']}"
            if f["mimeType"] == FOLDER_MIME:
                yield from _iter_folder_files(service, f["id"], f"{label}/")
            else:
                yield f["id"], f["name"], f["mimeType"], label

        page_token = response.get("nextPageToken")
        if not page_token:
            break


def iter_my_drive_files(service):
    yield from _iter_folder_files(service, "root")


def iter_shared_folder_files(service, folder_id):
    yield from _iter_folder_files(service, folder_id)


def download_file_bytes(service, file_id, mime_type, name):
    """Returns (bytes, filename), or (None, None) if the file type isn't one
    the RAG pipeline can ingest."""
    export_target = GOOGLE_EXPORT_MIME_MAP.get(mime_type)

    if export_target:
        export_mime, ext = export_target
        request = service.files().export_media(fileId=file_id, mimeType=export_mime)
        out_name = name if name.lower().endswith(ext) else f"{name}{ext}"
    else:
        ext = os.path.splitext(name)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            return None, None
        request = service.files().get_media(fileId=file_id)
        out_name = name

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    return buffer.getvalue(), out_name


def sync_connection(db, connection, extract_text_fn, upload_folder, chunk_size=500, chunk_overlap=0):
    """Pulls every file reachable from the connection's configured My Drive
    users and shared folders, ingests any not already imported, and (if
    sync_deleted is set) removes documents whose source file is gone. Mutates
    and commits `connection` and any Document rows for connection.user_id."""
    config = json.loads(connection.config or "{}")
    admin_email = config.get("primary_admin_email")
    my_drive_emails = list(
        dict.fromkeys([admin_email] + (config.get("my_drive_emails") or []))
    )
    my_drive_emails = [e for e in my_drive_emails if e]
    shared_folder_urls = config.get("shared_folder_urls") or []
    sync_deleted = config.get("sync_deleted", True)

    errors = []
    remote_files = {}

    def service_for(email):
        try:
            return build_drive_service(connection.credential, email)
        except Exception as exc:
            errors.append(f"Failed to authenticate as {email}: {exc}")
            return None

    for email in my_drive_emails:
        service = service_for(email)
        if not service:
            continue
        try:
            for file_id, name, mime_type, label in iter_my_drive_files(service):
                remote_files.setdefault(file_id, (name, mime_type, service, label))
        except Exception as exc:
            errors.append(f"Failed to list {email}'s Drive: {exc}")

    if shared_folder_urls:
        service = service_for(admin_email) if admin_email else None
        for url in shared_folder_urls:
            folder_id = extract_folder_id(url)
            if not folder_id:
                errors.append(f"Couldn't parse a folder ID from: {url}")
                continue
            if not service:
                errors.append(f"No admin account available to read shared folder: {url}")
                continue
            try:
                for file_id, name, mime_type, label in iter_shared_folder_files(service, folder_id):
                    remote_files.setdefault(file_id, (name, mime_type, service, label))
            except Exception as exc:
                errors.append(f"Failed to list shared folder {url}: {exc}")

    existing_docs = (
        db.query(Document).filter(Document.data_source_id == connection.id).all()
    )
    existing_by_external = {d.external_id: d for d in existing_docs if d.external_id}

    added = 0
    skipped = 0
    visited_ids = set()

    for file_id, (name, mime_type, service, label) in remote_files.items():
        visited_ids.add(file_id)
        if file_id in existing_by_external:
            skipped += 1
            continue

        try:
            content, filename = download_file_bytes(service, file_id, mime_type, name)
        except Exception as exc:
            errors.append(f"Failed to download {label}: {exc}")
            continue

        if content is None:
            skipped += 1
            continue

        content_hash = hashlib.sha256(content).hexdigest()
        duplicate = (
            db.query(Document)
            .filter(Document.user_id == connection.user_id, Document.content_hash == content_hash)
            .first()
        )
        if duplicate:
            skipped += 1
            continue

        safe_name = f"gdrive_{file_id}_{filename}"
        file_path = os.path.join(upload_folder, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)

        text, file_type, page_count = extract_text_fn(file_path, filename)
        if file_type is None:
            os.remove(file_path)
            skipped += 1
            continue

        document = Document(
            user_id=connection.user_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            chunks=0,
            preview=text[:1000] if text.strip() else "Image uploaded (no text detected).",
            size_bytes=os.path.getsize(file_path),
            page_count=page_count,
            content_hash=content_hash,
            source_type="google_drive",
            data_source_id=connection.id,
            external_id=file_id,
        )
        db.add(document)
        db.flush()

        result = process_document(
            text,
            filename,
            user_id=connection.user_id,
            document_id=document.id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        document.chunks = result["chunks"]
        added += 1

    removed = 0
    if sync_deleted:
        for external_id, document in existing_by_external.items():
            if external_id not in visited_ids:
                if document.file_path and os.path.exists(document.file_path):
                    os.remove(document.file_path)
                delete_document_chunks(connection.user_id, document.id)
                db.delete(document)
                removed += 1

    connection.last_synced_at = datetime.now(timezone.utc)
    connection.status = "error" if errors and added == 0 and skipped == 0 and removed == 0 else "connected"
    summary = f"{added} added, {removed} removed, {skipped} skipped"
    if errors:
        summary += f" — {len(errors)} error(s)"
    connection.status_message = summary
    db.commit()

    return {"added": added, "removed": removed, "skipped": skipped, "errors": errors}
