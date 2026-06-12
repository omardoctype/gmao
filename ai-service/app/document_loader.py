from __future__ import annotations

import re
import shutil
from dataclasses import dataclass
from hashlib import sha1
from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml


FRONT_MATTER_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
EQUIPMENT_CODE_PATTERN = re.compile(r"\bEQ-\d{3}\b", re.IGNORECASE)


@dataclass
class LoadedDocument:
    file_name: str
    content: str
    metadata: Dict[str, Any]


@dataclass
class DocumentChunk:
    chunk_id: str
    text: str
    metadata: Dict[str, Any]


def sync_markdown_documents(source_dir: Path, target_dir: Path) -> int:
    if not source_dir.exists():
        return 0

    target_dir.mkdir(parents=True, exist_ok=True)
    copied_count = 0

    for source_file in sorted(source_dir.glob("*.md")):
        target_file = target_dir / source_file.name
        if not target_file.exists() or source_file.read_bytes() != target_file.read_bytes():
            shutil.copy2(source_file, target_file)
            copied_count += 1

    return copied_count


def load_markdown_documents(documents_dir: Path) -> List[LoadedDocument]:
    documents: List[LoadedDocument] = []

    for path in sorted(documents_dir.glob("*.md")):
        raw_text = _read_text_with_fallback(path)
        front_matter, content = _extract_front_matter(raw_text)
        normalized_metadata = _normalize_metadata(front_matter)

        if "equipment_codes" not in normalized_metadata:
            detected_codes = sorted(set(code.upper() for code in EQUIPMENT_CODE_PATTERN.findall(raw_text)))
            if detected_codes:
                normalized_metadata["equipment_codes"] = detected_codes

        documents.append(
            LoadedDocument(
                file_name=path.name,
                content=content.strip(),
                metadata=normalized_metadata,
            )
        )

    return documents


def chunk_documents(
    documents: List[LoadedDocument],
    chunk_size: int,
    overlap: int,
) -> List[DocumentChunk]:
    chunks: List[DocumentChunk] = []

    for document in documents:
        text_chunks = _split_text(document.content, chunk_size=chunk_size, overlap=overlap)
        flattened_metadata = _flatten_metadata(document.metadata)
        flattened_metadata["source_file"] = document.file_name

        for idx, chunk_text in enumerate(text_chunks):
            chunk_id = sha1(f"{document.file_name}:{idx}:{chunk_text}".encode("utf-8")).hexdigest()
            chunk_metadata = dict(flattened_metadata)
            chunk_metadata["chunk_index"] = idx
            chunks.append(DocumentChunk(chunk_id=chunk_id, text=chunk_text, metadata=chunk_metadata))

    return chunks


def _extract_front_matter(raw_markdown: str) -> Tuple[Dict[str, Any], str]:
    match = FRONT_MATTER_PATTERN.match(raw_markdown)
    if not match:
        return {}, raw_markdown

    front_matter_text = match.group(1)
    content = raw_markdown[match.end() :]
    try:
        front_matter = yaml.safe_load(front_matter_text) or {}
    except yaml.YAMLError:
        front_matter = {}

    if not isinstance(front_matter, dict):
        front_matter = {}

    return front_matter, content


def _normalize_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}
    for key, value in metadata.items():
        if isinstance(value, (str, int, float, bool)):
            normalized[key] = value
        elif isinstance(value, list):
            primitive_items = [item for item in value if isinstance(item, (str, int, float, bool))]
            if primitive_items:
                normalized[key] = primitive_items

    equipements_value = normalized.get("equipements")
    if isinstance(equipements_value, list):
        normalized["equipment_codes"] = [str(item).upper() for item in equipements_value]

    return normalized


def _flatten_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    flat: Dict[str, Any] = {}
    for key, value in metadata.items():
        clean_key = f"meta_{str(key).lower()}"

        if isinstance(value, bool):
            flat[clean_key] = value
        elif isinstance(value, (int, float)):
            flat[clean_key] = value
        elif isinstance(value, str):
            flat[clean_key] = value
        elif isinstance(value, list):
            joined = ", ".join(str(item) for item in value)
            if joined:
                flat[clean_key] = joined

            if key in {"equipements", "equipment_codes"}:
                flat["equipment_codes"] = joined

    if "equipment_codes" not in flat and "meta_equipment_codes" in flat:
        flat["equipment_codes"] = str(flat["meta_equipment_codes"])

    return flat


def _read_text_with_fallback(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(encoding="utf-8", errors="ignore")


def _split_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    clean_text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not clean_text:
        return []

    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks: List[str] = []
    start = 0
    safe_overlap = max(0, min(overlap, chunk_size // 2))
    min_cut = max(0, int(chunk_size * 0.60))

    while start < len(clean_text):
        end = min(len(clean_text), start + chunk_size)
        if end < len(clean_text):
            window_start = start + min_cut
            split_at_newline = clean_text.rfind("\n", window_start, end)
            split_at_space = clean_text.rfind(" ", window_start, end)
            split_at = max(split_at_newline, split_at_space)
            if split_at > start:
                end = split_at

        chunk = clean_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(clean_text):
            break
        start = max(0, end - safe_overlap)

    return chunks
