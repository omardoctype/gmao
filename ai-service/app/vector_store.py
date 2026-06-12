from __future__ import annotations

import logging
from time import perf_counter
from typing import Dict, List

import chromadb
from sentence_transformers import SentenceTransformer

from app.document_loader import DocumentChunk


logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, chroma_path: str, collection_name: str, embedding_model: str) -> None:
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self.embedder = SentenceTransformer(embedding_model)

    def upsert_chunks(self, chunks: List[DocumentChunk], batch_size: int = 32) -> Dict[str, int]:
        if not chunks:
            return {"new_chunks": 0, "total_chunks": self.collection.count()}

        count_before = self.collection.count()

        for start in range(0, len(chunks), batch_size):
            batch = chunks[start : start + batch_size]
            texts = [item.text for item in batch]
            embeddings = self.embedder.encode(texts, normalize_embeddings=True).tolist()
            ids = [item.chunk_id for item in batch]
            metadatas = [item.metadata for item in batch]
            self.collection.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)

        count_after = self.collection.count()
        new_chunks = max(0, count_after - count_before)
        return {"new_chunks": new_chunks, "total_chunks": count_after}

    def query(self, query_text: str, n_results: int = 4) -> List[Dict]:
        total_started_at = perf_counter()
        collection_count = self.collection.count()
        if collection_count == 0:
            logger.info("AI vector timing collectionCount=0 totalMs=%.1f", (perf_counter() - total_started_at) * 1000)
            return []

        embedding_started_at = perf_counter()
        query_embedding = self.embedder.encode([query_text], normalize_embeddings=True).tolist()
        embedding_ms = (perf_counter() - embedding_started_at) * 1000

        chroma_started_at = perf_counter()
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )
        chroma_ms = (perf_counter() - chroma_started_at) * 1000

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        hits: List[Dict] = []
        for document, metadata, distance in zip(documents, metadatas, distances):
            hits.append(
                {
                    "document": document or "",
                    "metadata": metadata or {},
                    "distance": float(distance) if distance is not None else None,
                }
            )
        logger.info(
            "AI vector timing collectionCount=%s requestedResults=%s hits=%s embeddingMs=%.1f chromaMs=%.1f totalMs=%.1f",
            collection_count,
            n_results,
            len(hits),
            embedding_ms,
            chroma_ms,
            (perf_counter() - total_started_at) * 1000,
        )
        return hits
