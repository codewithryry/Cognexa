import chromadb
from sentence_transformers import SentenceTransformer
import os


VECTOR_PATH = "app/vector_db"

os.makedirs(VECTOR_PATH, exist_ok=True)


client = chromadb.PersistentClient(
    path=VECTOR_PATH
)

collection = client.get_or_create_collection(
    name="cognexa_docs"
)


model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


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
        f"user{user_id}_doc{document_id}_{i}"
        for i in range(len(chunks))
    ]


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


def delete_document_chunks(document_id):
    collection.delete(where={"document_id": document_id})
