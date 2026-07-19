import json

import httpx
import requests
import ollama

from app.rag import get_embedding_model, get_user_collection


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


def extract_provider_error_message(payload):
    """Digs the most specific human-readable message out of a provider error
    body. OpenRouter nests the upstream provider's own error as a JSON string
    under error.metadata.raw, which is usually more useful than its own
    generic "Provider returned error" wrapper message."""
    if not isinstance(payload, dict):
        return None

    error = payload.get("error")
    if not isinstance(error, dict):
        return None

    raw = error.get("metadata", {}).get("raw") if isinstance(error.get("metadata"), dict) else None
    if isinstance(raw, str):
        try:
            raw_parsed = json.loads(raw)
            nested_message = raw_parsed.get("error", {}).get("message")
            if nested_message:
                return nested_message
        except (json.JSONDecodeError, AttributeError):
            pass

    return error.get("message")


def raise_for_status_verbose(response):
    if response.ok:
        return

    try:
        payload = response.json()
    except ValueError:
        payload = None

    message = extract_provider_error_message(payload)

    if response.status_code == 402:
        friendly = message or "The AI provider rejected the request for insufficient credits/quota."
        raise requests.HTTPError(f"This AI provider is out of credits: {friendly}")

    if message:
        raise requests.HTTPError(f"{response.status_code} {response.reason}: {message}")

    detail = payload if payload is not None else response.text
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


def search_document(question, user_id, document_ids=None, limit=8, pool_size=24, per_doc_cap=2):

    collection = get_user_collection(user_id)

    query_embedding = get_embedding_model().encode(
        [question]
    ).tolist()

    if not document_ids:
        # Discover every document the user has instead of relying on a single
        # global similarity query, which lets one large/dominant document's
        # chunks crowd the whole result pool and starve the others out before
        # the per-document cap below ever gets a chance to run.
        existing = collection.get(include=["metadatas"])
        document_ids = sorted({
            meta.get("document_id")
            for meta in (existing.get("metadatas") or [])
            if meta and meta.get("document_id") is not None
        })

    # Candidate chunks grouped per document (each list already ordered by
    # similarity rank), so we can distribute the final `limit` fairly across
    # documents instead of a flat similarity-ranked list that lets earlier or
    # more-similar documents crowd out the rest before a slice-to-limit.
    per_doc_candidates = []

    if len(document_ids) > 1:
        # Query each document separately so every document contributes to the
        # candidate pool regardless of how its chunks rank against the others.
        per_doc_pool = max(per_doc_cap, pool_size // max(len(document_ids), 1))
        for doc_id in document_ids:
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=per_doc_pool,
                where={"document_id": doc_id},
            )
            docs = results["documents"][0] if results["documents"] else []
            metas = results["metadatas"][0] if results["metadatas"] else []
            per_doc_candidates.append(list(zip(docs, metas)))
    else:
        where = None
        if document_ids:
            where = {"document_id": {"$in": document_ids}}
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=pool_size,
            where=where,
        )
        docs = results["documents"][0] if results["documents"] else []
        metas = results["metadatas"][0] if results["metadatas"] else []
        grouped = {}
        for doc, meta in zip(docs, metas):
            doc_id = meta.get("document_id") if meta else None
            grouped.setdefault(doc_id, []).append((doc, meta))
        per_doc_candidates = list(grouped.values())

    # Round-robin one chunk per document per round (up to per_doc_cap rounds)
    # so every document gets a turn before any one document's remaining
    # chunks are considered, and truncation to `limit` can't wipe out an
    # entire document just because it was queried/ranked later.
    selected_docs, selected_metas = [], []

    for round_idx in range(per_doc_cap):
        if len(selected_docs) >= limit:
            break
        for candidates in per_doc_candidates:
            if len(selected_docs) >= limit:
                break
            if round_idx < len(candidates):
                doc, meta = candidates[round_idx]
                selected_docs.append(doc)
                selected_metas.append(meta)

    if len(selected_docs) < limit:
        for candidates in per_doc_candidates:
            for doc, meta in candidates[per_doc_cap:]:
                if len(selected_docs) >= limit:
                    break
                selected_docs.append(doc)
                selected_metas.append(meta)
            if len(selected_docs) >= limit:
                break

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

    try:
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
    except httpx.ConnectError:
        yield {
            "type": "token",
            "content": (
                "Local AI (Ollama) isn't running, so this question couldn't be answered. "
                "Start Ollama on this machine, or add a provider under Settings > Integrations "
                "and select it from the provider menu."
            ),
        }


REPORT_SYSTEM_PROMPT = (
    "You are a report-writing assistant. You will be given a transcript of a "
    "Q&A conversation where each answer was grounded in the user's own documents, "
    "labeled by source. Turn the transcript into a well-structured report with these "
    "sections: Summary, Key Findings (as bullet points). Only use information present "
    "in the transcript — do not invent anything. Do NOT include a Sources or "
    "References section — the source list is displayed separately by the app, so "
    "adding your own would duplicate it. Respond in plain text only — do not use "
    "markdown formatting such as asterisks, underscores, backticks, or hash headers."
)


def build_report_prompt(qa_pairs):
    transcript_blocks = []
    for pair in qa_pairs:
        sources = ", ".join(pair.get("sources") or []) or "none"
        transcript_blocks.append(
            f"Q: {pair['question']}\nA: {pair['answer']}\nSources: {sources}"
        )
    transcript = "\n\n".join(transcript_blocks)

    return f"""
Conversation Transcript:

{transcript}


Report:
"""


def generate_report(
    qa_pairs,
    ollama_url="http://localhost:11434",
    llm_model="llama3.2",
    external_provider=None,
    external_api_key=None,
    external_base_url=None,
    external_model=None,
):
    if not qa_pairs:
        return {"report": "There's no conversation yet to summarize into a report.", "sources": []}

    all_sources = sorted({s for pair in qa_pairs for s in (pair.get("sources") or [])})
    user_prompt = build_report_prompt(qa_pairs)

    if external_provider:
        report_text = "".join(
            delta
            for delta in stream_external_provider(
                external_provider,
                external_api_key,
                external_base_url,
                external_model,
                REPORT_SYSTEM_PROMPT,
                user_prompt,
            )
            if delta
        )
        return {"report": report_text, "sources": all_sources}

    ollama_client = ollama.Client(host=ollama_url)

    try:
        response = ollama_client.chat(
            model=llm_model,
            messages=[
                {"role": "system", "content": REPORT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        return {"report": response["message"]["content"], "sources": all_sources}
    except httpx.ConnectError:
        return {
            "report": (
                "Local AI (Ollama) isn't running, so the report couldn't be generated. "
                "Start Ollama on this machine, or add a provider under Settings > Integrations "
                "and select it from the provider menu."
            ),
            "sources": all_sources,
        }


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
