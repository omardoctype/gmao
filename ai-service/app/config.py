from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _env_int_any(names: tuple[str, ...], default: int) -> int:
    for name in names:
        value = os.getenv(name)
        if not value:
            continue
        try:
            return int(value)
        except ValueError:
            return default
    return default


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if not value:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


class Settings:
    def __init__(self) -> None:
        self.service_name = os.getenv("SERVICE_NAME", "gmao-ai-service")
        self.ollama_url = os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")

        self.embedding_model = os.getenv(
            "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )
        self.collection_name = os.getenv("CHROMA_COLLECTION", "gmao_documents")

        self.documents_dir = Path(os.getenv("DOCUMENTS_DIR", str(BASE_DIR / "documents")))
        self.source_documents_dir = Path(
            os.getenv(
                "SOURCE_DOCUMENTS_DIR",
                str(BASE_DIR.parent / "backend" / "src" / "main" / "resources" / "demo-documents"),
            )
        )
        self.chroma_dir = Path(os.getenv("CHROMA_DIR", str(BASE_DIR / "chroma_db")))

        self.chunk_size = _env_int("CHUNK_SIZE", 900)
        self.chunk_overlap = _env_int("CHUNK_OVERLAP", 150)
        self.top_k = _env_int_any(("AI_TOP_K", "TOP_K"), 3)
        self.max_distance = _env_float("MAX_DISTANCE", 1.20)
        self.auto_sync_documents = _env_bool("AUTO_SYNC_DOCUMENTS", True)
        self.fast_mode = _env_bool("AI_FAST_MODE", True)
        self.max_chunk_chars = _env_int_any(("AI_MAX_CHUNK_CHARS", "FAST_CONTEXT_SNIPPET_CHARS", "CONTEXT_SNIPPET_CHARS"), 500)
        self.ollama_timeout_seconds = _env_int("OLLAMA_TIMEOUT_SECONDS", 120)
        self.ollama_num_predict = _env_int_any(("AI_NUM_PREDICT_DEFAULT", "OLLAMA_NUM_PREDICT"), 120)
        self.ollama_fast_num_predict = _env_int_any(("AI_NUM_PREDICT_FAST", "OLLAMA_FAST_NUM_PREDICT"), 80)
        self.ollama_temperature = _env_float("OLLAMA_TEMPERATURE", 0.2)
        self.ollama_top_p = _env_float("OLLAMA_TOP_P", 0.9)
        self.ollama_keep_alive = os.getenv("OLLAMA_KEEP_ALIVE", "10m")

        self.documents_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
