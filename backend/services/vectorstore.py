"""
FAISS Vector Store — per-user index management.

Each user gets their own FAISS index stored at:
  uploads/<user_id>/faiss_index/index.faiss
  uploads/<user_id>/faiss_index/metadata.pkl

Embeddings are generated with sentence-transformers (all-MiniLM-L6-v2)
— free, local, no API key required.
"""

import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Optional

_embedding_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        print("⏳ Loading sentence-transformer (first time only)…")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model ready")
    return _embedding_model


def _index_dir(user_id: str) -> str:
    return os.path.join("uploads", user_id, "faiss_index")


def _load_index(user_id: str):
    """Load FAISS index + metadata list for a user. Returns (index, metadata) or (None, [])."""
    idx_dir = _index_dir(user_id)
    idx_file = os.path.join(idx_dir, "index.faiss")
    meta_file = os.path.join(idx_dir, "metadata.pkl")

    if not os.path.exists(idx_file):
        return None, []

    index = faiss.read_index(idx_file)
    with open(meta_file, "rb") as f:
        metadata = pickle.load(f)

    return index, metadata


def _save_index(user_id: str, index, metadata: list):
    """Persist FAISS index + metadata to disk."""
    idx_dir = _index_dir(user_id)
    os.makedirs(idx_dir, exist_ok=True)

    faiss.write_index(index, os.path.join(idx_dir, "index.faiss"))
    with open(os.path.join(idx_dir, "metadata.pkl"), "wb") as f:
        pickle.dump(metadata, f)


async def add_documents_to_index(user_id: str, doc_id: str, chunks: List[dict]):
    """Embed chunks and add them to the user's FAISS index."""
    if not chunks:
        return

    model = get_embedding_model()
    texts = [c["content"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)
    embeddings = np.array(embeddings, dtype=np.float32)

    index, metadata = _load_index(user_id)

    if index is None:
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    for chunk in chunks:
        metadata.append(
            {
                "doc_id": doc_id,
                "content": chunk["content"],
                "page": chunk["page"],
            }
        )

    _save_index(user_id, index, metadata)


async def search_similar_chunks(
    user_id: str,
    query: str,
    doc_ids: Optional[List[str]] = None,
    top_k: int = 5,
) -> List[dict]:
    """Retrieve top-k most relevant chunks from the user's FAISS index."""
    model = get_embedding_model()
    index, metadata = _load_index(user_id)

    if index is None or index.ntotal == 0:
        return []

    q_emb = model.encode([query])
    q_emb = np.array(q_emb, dtype=np.float32)

    # Search for more than needed so we can filter by doc_ids
    search_k = min(top_k * 5, index.ntotal)
    distances, indices = index.search(q_emb, search_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(metadata):
            continue
        chunk = metadata[idx]
        if doc_ids and chunk["doc_id"] not in doc_ids:
            continue
        results.append(
            {
                "content": chunk["content"],
                "doc_id": chunk["doc_id"],
                "page": chunk["page"],
                "score": float(dist),
            }
        )
        if len(results) >= top_k:
            break

    return results


async def remove_document_from_index(user_id: str, doc_id: str):
    """Remove all chunks belonging to a document and rebuild the FAISS index."""
    index, metadata = _load_index(user_id)
    if index is None:
        return

    remaining = [m for m in metadata if m["doc_id"] != doc_id]

    if not remaining:
        # Nothing left — delete index files
        import shutil
        idx_dir = _index_dir(user_id)
        if os.path.exists(idx_dir):
            shutil.rmtree(idx_dir)
        return

    # Rebuild index with remaining chunks
    model = get_embedding_model()
    texts = [m["content"] for m in remaining]
    embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)
    embeddings = np.array(embeddings, dtype=np.float32)

    new_index = faiss.IndexFlatL2(embeddings.shape[1])
    new_index.add(embeddings)

    _save_index(user_id, new_index, remaining)
