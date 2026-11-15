# Content-hash query params for static assets.
# Unchanged files keep the same ?v= so browsers can cache them.

from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
_HASHES: dict[str, str] = {}


def file_hash(rel: str) -> str:
    rel = urlsplit(rel).path.lstrip("/")
    path = ROOT / rel
    key = str(path)
    if key in _HASHES:
        return _HASHES[key]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:10]
    _HASHES[key] = digest
    return digest


def versioned(url: str) -> str:
    parts = urlsplit(url)
    if not parts.path.startswith("/") or parts.path.startswith("//"):
        return url
    query = f"v={file_hash(parts.path)}"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))
