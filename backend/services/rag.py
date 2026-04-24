"""
RAG pipeline — Retrieval-Augmented Generation.

Flow:
  1. Embed user query
  2. Retrieve top-k relevant chunks from FAISS
  3. Build structured prompt (context + history + question)
  4. Call Gemini LLM
  5. Return answer + source citations
"""

from services.vectorstore import search_similar_chunks
from services.llm import generate_response
from database import get_db
from bson import ObjectId
from typing import List, Optional

SYSTEM_PROMPT = """You are a highly capable AI Knowledge Assistant. Your goal is to provide accurate, concise, and helpful answers based ONLY on the provided document context.

### RESPONSE GUIDELINES:
1. **Source Filtering**: If the provided context contains noise (like long lists of numbers, line counts, or headers/footers), ignore it and focus only on the actual information.
2. **Accuracy**: Only answer based on the provided documents. If the answer is not present, say: "I'm sorry, but I couldn't find information about that in your documents."
3. **Formatting**: Use Markdown to structure your answer (bolding, bullet points, headers).
4. **Citations**: Do NOT repeat the raw source labels like "[Source 1: ...]" in your text. Instead, refer to documents by name or page naturally (e.g., "According to the PDF on page 5..."). 
5. **No Context Dumping**: Never output the raw text of the context chunks. Provide a synthesized answer.
6. **Tone**: Be professional, clear, and direct.
"""


async def get_rag_response(
    user_id: str,
    message: str,
    document_ids: Optional[List[str]] = None,
    chat_history: list = [],
) -> dict:
    db = get_db()

    # 1. Retrieve relevant chunks
    chunks = await search_similar_chunks(user_id, message, document_ids, top_k=5)

    if not chunks:
        return {
            "answer": (
                "📂 **No documents found.** You haven't uploaded any documents yet, "
                "or no relevant information was found for your query.\n\n"
                "Please go to **Documents** and upload a PDF to get started!"
            ),
            "sources": [],
        }

    # 2. Fetch document names for source attribution
    doc_id_set = list(set(c["doc_id"] for c in chunks))
    docs = await db.documents.find(
        {"_id": {"$in": [ObjectId(d) for d in doc_id_set]}}
    ).to_list(length=20)
    doc_names = {str(d["_id"]): d["original_name"] for d in docs}

    # 3. Build context block
    context_parts = []
    for i, chunk in enumerate(chunks):
        doc_name = doc_names.get(chunk["doc_id"], "Unknown Document")
        context_parts.append(
            f"<context_chunk source='{doc_name}' page='{chunk['page']}'>\n{chunk['content']}\n</context_chunk>"
        )
    context = "\n\n---\n\n".join(context_parts)

    # 4. Build chat history context (last 4 exchanges)
    history_str = ""
    if chat_history:
        history_lines = []
        for h in chat_history[-4:]:
            history_lines.append(f"User: {h['message']}\nAssistant: {h['response']}")
        history_str = "\n\n".join(history_lines)

    # 5. Compose full prompt
    prompt = f"""{SYSTEM_PROMPT}

### PREVIOUS CONVERSATION:
{history_str if history_str else "No previous history."}

### DOCUMENT CONTEXT:
{context}

### USER QUESTION:
{message}

Please provide a clean, synthesized answer based on the context above:"""

    # 6. Call LLM
    answer = await generate_response(prompt)

    # 7. Build deduplicated source list
    sources = []
    seen_keys = set()
    for chunk in chunks:
        key = (chunk["doc_id"], chunk["page"])
        if key not in seen_keys:
            seen_keys.add(key)
            sources.append(
                {
                    "document_name": doc_names.get(chunk["doc_id"], "Unknown"),
                    "page": chunk["page"],
                    "chunk": chunk["content"][:250] + ("…" if len(chunk["content"]) > 250 else ""),
                }
            )

    return {"answer": answer, "sources": sources}
