import json

import chromadb
import requests
from sentence_transformers import SentenceTransformer
import ollama


# Well-known, publicly documented API base URLs for each provider's own
# official endpoint. "style" picks which request/response shape to use below.
PROVIDER_CONFIG = {
    "Cline": {"base_url": "https://api.cline.bot/api/v1", "style": "openai"},
    "OpenAI": {"base_url": "https://api.openai.com/v1", "style": "openai"},
    "OpenRouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "style": "openai",
        "extra_headers": {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Cognexa",
        },
    },
    "Anthropic Claude": {"base_url": "https://api.anthropic.com/v1", "style": "anthropic"},
    "Cohere": {"base_url": "https://api.cohere.com", "style": "cohere"},
    "Google Gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "style": "gemini",
    },
}

SYSTEM_PROMPT = (
    "Answer only using the provided document context. The context may come from multiple "
    "documents, labeled by source. Combine relevant information across all of them into a "
    "single, complete answer instead of relying on just one document. Respond in plain text "
    "only — do not use markdown formatting such as asterisks, underscores, backticks, or "
    "hash headers."
)


def raise_for_status_verbose(response):
    if response.ok:
        return
    try:
        detail = response.json()
    except ValueError:
        detail = response.text
    raise requests.HTTPError(
        f"{response.status_code} {response.reason} from {response.url}: {detail}"
    )


def build_user_prompt(context, question):
    return f"""
Document Context:

{context}


Question:

{question}


Answer:
"""


def stream_openai_style(base_url, api_key, model, system_prompt, user_prompt, extra_headers=None):
    response = requests.post(
        f"{base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            **(extra_headers or {}),
        },
        json={
            "model": model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        stream=True,
        timeout=120,
    )
    raise_for_status_verbose(response)

    for line in response.iter_lines():
        if not line:
            continue
        line = line.decode("utf-8")
        if not line.startswith("data:"):
            continue
        payload = line[len("data:"):].strip()
        if payload == "[DONE]":
            break
        try:
            chunk = json.loads(payload)
        except json.JSONDecodeError:
            continue
        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
        if delta:
            yield delta


def stream_anthropic(base_url, api_key, model, system_prompt, user_prompt):
    response = requests.post(
        f"{base_url}/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1024,
            "stream": True,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        },
        stream=True,
        timeout=120,
    )
    raise_for_status_verbose(response)

    for line in response.iter_lines():
        if not line:
            continue
        line = line.decode("utf-8")
        if not line.startswith("data:"):
            continue
        payload = line[len("data:"):].strip()
        try:
            chunk = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if chunk.get("type") == "content_block_delta":
            delta = chunk.get("delta", {}).get("text")
            if delta:
                yield delta


def stream_cohere(base_url, api_key, model, system_prompt, user_prompt):
    response = requests.post(
        f"{base_url}/v2/chat",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=120,
    )
    raise_for_status_verbose(response)
    data = response.json()
    parts = data.get("message", {}).get("content", [])
    yield "".join(p.get("text", "") for p in parts if p.get("type") == "text")


def stream_gemini(base_url, api_key, model, system_prompt, user_prompt):
    response = requests.post(
        f"{base_url}/models/{model}:generateContent",
        params={"key": api_key},
        json={
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        },
        timeout=120,
    )
    raise_for_status_verbose(response)
    data = response.json()
    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts)
        yield text


def stream_external_provider(provider_name, api_key, base_url, model, system_prompt, user_prompt):
    config = PROVIDER_CONFIG.get(provider_name)
    if not config:
        raise ValueError(f"Unsupported provider: {provider_name}")

    resolved_base_url = base_url or config.get("base_url")
    style = config["style"]

    if style == "openai":
        yield from stream_openai_style(
            resolved_base_url,
            api_key,
            model,
            system_prompt,
            user_prompt,
            extra_headers=config.get("extra_headers"),
        )
    elif style == "anthropic":
        yield from stream_anthropic(resolved_base_url, api_key, model, system_prompt, user_prompt)
    elif style == "cohere":
        yield from stream_cohere(resolved_base_url, api_key, model, system_prompt, user_prompt)
    elif style == "gemini":
        yield from stream_gemini(resolved_base_url, api_key, model, system_prompt, user_prompt)
    else:
        raise ValueError(f"Unsupported provider style: {style}")


client = chromadb.PersistentClient(
    path="app/vector_db"
)

collection = client.get_collection(
    name="cognexa_docs"
)


model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def search_document(question, user_id, document_ids=None, limit=8, pool_size=24, per_doc_cap=2):

    query_embedding = model.encode(
        [question]
    ).tolist()

    where = {"user_id": user_id}

    if document_ids:
        where = {
            "$and": [
                {"user_id": user_id},
                {"document_id": {"$in": document_ids}},
            ]
        }

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=pool_size,
        where=where,
    )

    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    # Rank order from Chroma is purely by similarity, which can let one very
    # relevant document crowd out other relevant documents. Cap how many
    # chunks any single document contributes first so the final context pulls
    # from multiple sources, then backfill remaining slots by rank.
    selected_docs, selected_metas = [], []
    leftover_docs, leftover_metas = [], []
    counts = {}

    for doc, meta in zip(documents, metadatas):
        doc_id = meta.get("document_id") if meta else None
        if counts.get(doc_id, 0) < per_doc_cap:
            selected_docs.append(doc)
            selected_metas.append(meta)
            counts[doc_id] = counts.get(doc_id, 0) + 1
        else:
            leftover_docs.append(doc)
            leftover_metas.append(meta)

    i = 0
    while len(selected_docs) < limit and i < len(leftover_docs):
        selected_docs.append(leftover_docs[i])
        selected_metas.append(leftover_metas[i])
        i += 1

    return selected_docs[:limit], selected_metas[:limit]


def generate_answer(
    question,
    user_id,
    document_ids=None,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
):

    documents, metadatas = search_document(question, user_id, document_ids=document_ids)

    if not documents:
        return {
            "answer": "I couldn't find anything relevant in your knowledge base. Try uploading a document first.",
            "sources": [],
        }

    context_blocks = []
    for doc, meta in zip(documents, metadatas):
        source = meta.get("filename", "unknown") if meta else "unknown"
        context_blocks.append(f"[Source: {source}]\n{doc}")

    context = "\n\n".join(context_blocks)

    sources = sorted({
        meta.get("filename") for meta in metadatas if meta and meta.get("filename")
    })

    ollama_client = ollama.Client(host=ollama_url)

    response = ollama_client.chat(
        model=llm_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Answer only using the provided document context. The context may come from multiple documents, labeled by source. Combine relevant information across all of them into a single, complete answer instead of relying on just one document."
                ),
            },
            {
                "role": "user",
                "content": f"""
Document Context:

{context}


Question:

{question}


Answer:
"""
            }
        ]
    )

    return {
        "answer": response["message"]["content"],
        "sources": sources,
    }


def generate_answer_stream(
    question,
    user_id,
    document_ids=None,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
    external_provider=None,
    external_api_key=None,
    external_base_url=None,
    external_model=None,
):

    documents, metadatas = search_document(question, user_id, document_ids=document_ids)

    if not documents:
        yield {"type": "sources", "sources": []}
        yield {
            "type": "token",
            "content": "I couldn't find anything relevant in your knowledge base. Try uploading a document first.",
        }
        return

    context_blocks = []
    for doc, meta in zip(documents, metadatas):
        source = meta.get("filename", "unknown") if meta else "unknown"
        context_blocks.append(f"[Source: {source}]\n{doc}")

    context = "\n\n".join(context_blocks)

    sources = sorted({
        meta.get("filename") for meta in metadatas if meta and meta.get("filename")
    })

    yield {"type": "sources", "sources": sources}

    user_prompt = build_user_prompt(context, question)

    if external_provider:
        for delta in stream_external_provider(
            external_provider,
            external_api_key,
            external_base_url,
            external_model,
            SYSTEM_PROMPT,
            user_prompt,
        ):
            if delta:
                yield {"type": "token", "content": delta}
        return

    ollama_client = ollama.Client(host=ollama_url)

    stream = ollama_client.chat(
        model=llm_model,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            }
        ],
        stream=True,
    )

    for chunk in stream:
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield {"type": "token", "content": content}


if __name__ == "__main__":

    print("=" * 50)
    print("COGNEXA AI QUERY")
    print("=" * 50)


    question = input(
        "\nAsk question: "
    )


    result = generate_answer(question, user_id=1)


    print("\nAI Answer:\n")
    print(result["answer"])
    print("\nSources:", ", ".join(result["sources"]))
