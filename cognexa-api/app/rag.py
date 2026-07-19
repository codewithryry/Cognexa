import chromadb
from sentence_transformers import SentenceTransformer
import os


VECTOR_PATH = "app/vector_db"

os.makedirs(VECTOR_PATH, exist_ok=True)


client = chromadb.PersistentClient(
    path=VECTOR_PATH
)


model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def user_collection_name(user_id):
    return f"user_{user_id}_docs"


def get_user_collection(user_id):
    """Every user gets their own Chroma collection, so a brand-new user (or a
    user whose collection was previously dropped) always starts from a clean,
    empty index with no other user's embeddings or metadata reachable from it."""
    return client.get_or_create_collection(name=user_collection_name(user_id))


def delete_user_collection(user_id):
    try:
        client.delete_collection(name=user_collection_name(user_id))
    except Exception:
        pass


def process_document(text, filename, user_id, document_id, chunk_size=500, chunk_overlap=0):

    chunks = []

    step = max(chunk_size - chunk_overlap, 1)

    for i in range(0, len(text), step):
        chunk = text[i:i + chunk_size]

        if chunk.strip():
            chunks.append(chunk)


    if not chunks:
        return {"chunks": 0}

    embeddings = model.encode(chunks).tolist()


    ids = [
        f"doc{document_id}_{i}"
        for i in range(len(chunks))
    ]


    collection = get_user_collection(user_id)

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids,
        metadatas=[
            {
                "filename": filename,
                "user_id": user_id,
                "document_id": document_id,
            }
            for _ in chunks
        ]
    )


    return {
        "chunks": len(chunks)
    }


def delete_document_chunks(user_id, document_id):
    collection = get_user_collection(user_id)
    collection.delete(where={"document_id": document_id})
