import hashlib
import io
import json
import os
from datetime import datetime, timezone

import requests
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from sqlalchemy import func

from app.crypto import decrypt_str, encrypt_str
from app.models import Document
from app.rag import delete_document_chunks, process_document

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]

TOKEN_URI = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

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


def _oauth_client_config():
    client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise RuntimeError(
            "GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and "
            "GOOGLE_OAUTH_REDIRECT_URI must all be set."
        )
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": TOKEN_URI,
            "redirect_uris": [redirect_uri],
        }
    }, redirect_uri


def build_oauth_flow():
    client_config, redirect_uri = _oauth_client_config()
    flow = Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=redirect_uri)
    return flow


def get_authorization_url(state):
    flow = build_oauth_flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return url


def exchange_code_for_credentials(code):
    flow = build_oauth_flow()
    flow.fetch_token(code=code)
    return flow.credentials


def fetch_account_email(credentials):
    response = requests.get(
        USERINFO_URL,
        headers={"Authorization": f"Bearer {credentials.token}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get("email")


def encode_connection_tokens(credentials):
    """Serializes a Credentials object into the encrypted string stored in
    connection.credential."""
    payload = {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
    }
    return encrypt_str(json.dumps(payload))


def _credentials_from_connection(connection):
    payload = json.loads(decrypt_str(connection.credential))
    client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
    expiry = datetime.fromisoformat(payload["expiry"]) if payload.get("expiry") else None
    return Credentials(
        token=payload["access_token"],
        refresh_token=payload.get("refresh_token"),
        token_uri=TOKEN_URI,
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
        expiry=expiry,
    )


def _refresh_if_needed(connection):
    """Loads the connection's stored OAuth credentials, refreshing them if
    expired. Returns (credentials, refreshed_credential) where
    refreshed_credential is the new encrypted token string to persist, or
    None if nothing changed."""
    credentials = _credentials_from_connection(connection)
    original_token = credentials.token

    if not credentials.valid and credentials.refresh_token:
        credentials.refresh(GoogleAuthRequest())

    refreshed_credential = None
    if credentials.token != original_token:
        refreshed_credential = encode_connection_tokens(credentials)

    return credentials, refreshed_credential


def build_drive_service_from_connection(connection):
    """Builds a Drive service from the connection's stored OAuth tokens,
    refreshing them if expired. Returns (service, refreshed_credential) — see
    _refresh_if_needed."""
    credentials, refreshed_credential = _refresh_if_needed(connection)
    service = build("drive", "v3", credentials=credentials, cache_discovery=False)
    return service, refreshed_credential


def get_picker_access_token(connection):
    """Returns (access_token, expires_in_seconds, refreshed_credential) for
    handing a short-lived, drive.readonly-scoped token to the browser-side
    Google Picker widget. refreshed_credential is the new encrypted token
    string to persist, or None if nothing changed."""
    credentials, refreshed_credential = _refresh_if_needed(connection)
    expires_in = 3600
    if credentials.expiry:
        expires_in = max(0, int((credentials.expiry - datetime.now(timezone.utc).replace(tzinfo=None)).total_seconds()))
    return credentials.token, expires_in, refreshed_credential


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


def iter_shared_with_me_files(service):
    """Files and folders explicitly shared with the authenticated account
    (as opposed to files living under their own My Drive root)."""
    page_token = None
    while True:
        response = (
            service.files()
            .list(
                q="sharedWithMe = true and trashed = false",
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )

        for f in response.get("files", []):
            if f["mimeType"] == FOLDER_MIME:
                yield from _iter_folder_files(service, f["id"], f"{f['name']}/")
            else:
                yield f["id"], f["name"], f["mimeType"], f["name"]

        page_token = response.get("nextPageToken")
        if not page_token:
            break


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
    """Pulls every file reachable from the connection's own OAuth-authenticated
    Google account (My Drive + anything shared with it), ingests any not
    already imported, and (if sync_deleted is set) removes documents whose
    source file is gone. Mutates and commits `connection` and any Document
    rows for connection.user_id."""
    config = json.loads(connection.config or "{}")
    sync_deleted = config.get("sync_deleted", True)
    folders = config.get("folders") or []

    errors = []
    remote_files = {}

    try:
        service, refreshed_credential = build_drive_service_from_connection(connection)
    except Exception as exc:
        connection.status = "error"
        connection.status_message = f"Failed to authenticate: {exc}"
        connection.last_synced_at = datetime.now(timezone.utc)
        db.commit()
        return {"added": 0, "removed": 0, "skipped": 0, "errors": [str(exc)]}

    if refreshed_credential:
        connection.credential = refreshed_credential

    if folders:
        for folder in folders:
            try:
                for file_id, name, mime_type, label in _iter_folder_files(service, folder["id"], f"{folder['name']}/"):
                    remote_files.setdefault(file_id, (name, mime_type, label))
            except Exception as exc:
                errors.append(f"Failed to list folder {folder['name']}: {exc}")
    else:
        try:
            for file_id, name, mime_type, label in iter_my_drive_files(service):
                remote_files.setdefault(file_id, (name, mime_type, label))
        except Exception as exc:
            errors.append(f"Failed to list My Drive: {exc}")

        try:
            for file_id, name, mime_type, label in iter_shared_with_me_files(service):
                remote_files.setdefault(file_id, (name, mime_type, label))
        except Exception as exc:
            errors.append(f"Failed to list files shared with this account: {exc}")

    existing_docs = (
        db.query(Document).filter(Document.data_source_id == connection.id).all()
    )
    existing_by_external = {d.external_id: d for d in existing_docs if d.external_id}

    added = 0
    skipped = 0
    visited_ids = set()

    total = len(remote_files)
    connection.status = "syncing"
    connection.status_message = f"Processing 0 of {total} files"
    db.commit()

    for processed, (file_id, (name, mime_type, label)) in enumerate(remote_files.items(), start=1):
        visited_ids.add(file_id)
        try:
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
        finally:
            connection.status_message = f"Processing {processed} of {total} files"
            db.commit()

    removed = 0
    if sync_deleted:
        for external_id, document in existing_by_external.items():
            if external_id not in visited_ids:
                if document.file_path and os.path.exists(document.file_path):
                    os.remove(document.file_path)
                delete_document_chunks(connection.user_id, document.id)
                db.delete(document)
                removed += 1

    connection.synced_size_bytes = (
        db.query(func.sum(Document.size_bytes))
        .filter(Document.data_source_id == connection.id)
        .scalar()
        or 0
    )

    connection.last_synced_at = datetime.now(timezone.utc)
    connection.status = "error" if errors and added == 0 and skipped == 0 and removed == 0 else "connected"
    summary = f"{added} added, {removed} removed, {skipped} skipped"
    if not folders:
        summary = f"Syncing entire Drive — {summary}"
    if errors:
        summary += f" — {len(errors)} error(s)"
    connection.status_message = summary
    db.commit()

    return {"added": added, "removed": removed, "skipped": skipped, "errors": errors}
