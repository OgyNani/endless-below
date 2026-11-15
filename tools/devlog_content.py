# Parse Devlog Markdown (frontmatter + a small Markdown subset).
# No third-party packages: the site must build with stock Python 3.

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "devlog"

_MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)

_IMG_RE = re.compile(
    r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)"
)
_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_HEADING_RE = re.compile(r"^(#{1,3})\s+(.+)$")


def format_date(iso: str) -> str:
    parts = str(iso or "").split("-")
    if len(parts) != 3:
        return str(iso or "")
    try:
        month = _MONTHS[int(parts[1]) - 1]
        day = int(parts[2])
    except (ValueError, IndexError):
        return str(iso)
    return f"{day} {month} {parts[0]}"


def media_path(url: str | None) -> Path | None:
    if not url:
        return None
    rel = str(url).lstrip("/").replace("\\", "/")
    path = ROOT / rel
    return path if path.is_file() else None


def media_exists(url: str | None) -> bool:
    return media_path(url) is not None


def webp_canvas_size(path: Path) -> tuple[int, int] | None:
    """Read VP8X canvas size from an animated/still WebP. None if not VP8X."""
    data = path.read_bytes()
    if len(data) < 30 or data[0:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None
    if data[12:16] != b"VP8X":
        return None
    payload_size = int.from_bytes(data[16:20], "little")
    payload = data[20 : 20 + payload_size]
    if len(payload) < 10:
        return None
    width = 1 + int.from_bytes(payload[4:7], "little")
    height = 1 + int.from_bytes(payload[7:10], "little")
    return width, height


def _parse_frontmatter(raw: str) -> tuple[dict, str]:
    text = raw.replace("\r\n", "\n")
    if not text.startswith("---"):
        return {}, text.strip()
    rest = text[3:].lstrip("\n")
    end = rest.find("\n---")
    if end < 0:
        return {}, text.strip()
    block = rest[:end]
    body = rest[end + 4 :].lstrip("\n")
    meta = {}
    for line in block.split("\n"):
        if not line.strip() or line.strip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith('"') and value.endswith('"') and len(value) >= 2:
            value = value[1:-1]
        elif value.startswith("'") and value.endswith("'") and len(value) >= 2:
            value = value[1:-1]
        if value.lower() in ("true", "false"):
            meta[key] = value.lower() == "true"
        else:
            meta[key] = value
    return meta, body.strip()


def _inline(text: str) -> str:
    def img_sub(match):
        alt, src, title = match.group(1), match.group(2), match.group(3)
        return _figure_html(src, alt, title)

    parts = []
    last = 0
    for match in _IMG_RE.finditer(text):
        parts.append(_linkify(text[last:match.start()]))
        parts.append(img_sub(match))
        last = match.end()
    parts.append(_linkify(text[last:]))
    return "".join(parts)


def _linkify(text: str) -> str:
    out = []
    last = 0
    for match in _LINK_RE.finditer(text):
        out.append(html.escape(text[last:match.start()]))
        out.append(
            f'<a href="{html.escape(match.group(2), quote=True)}">'
            f"{html.escape(match.group(1))}</a>"
        )
        last = match.end()
    out.append(html.escape(text[last:]))
    return "".join(out)


def _figure_html(src: str, alt: str, caption: str | None) -> str:
    alt_e = html.escape(alt)
    cap_e = html.escape(caption) if caption else ""
    path = media_path(src)
    if path:
        size_attrs = ""
        canvas = webp_canvas_size(path) if path.suffix.lower() == ".webp" else None
        if canvas:
            size_attrs = (
                f' width="{canvas[0]}" height="{canvas[1]}" '
                f'style="--native-w:{canvas[0]};--native-h:{canvas[1]}"'
            )
        img = (
            f'<img class="devlog-media__img" src="{html.escape(src, quote=True)}" '
            f'alt="{alt_e}" loading="lazy" decoding="async"{size_attrs}>'
        )
    else:
        label = alt_e or "Artwork pending"
        img = (
            f'<div class="ph ph--16x9" role="img" '
            f'aria-label="Placeholder: {label}">'
            f'<span class="ph__label">{label}</span>'
            f'<span class="ph__dims">animated WebP</span></div>'
        )
    cap = f"<figcaption>{cap_e}</figcaption>" if cap_e else ""
    return f'<figure class="devlog-media">{img}{cap}</figure>'


def markdown_to_html(body: str) -> str:
    """Subset: headings, paragraphs, images, links. Images become figures."""
    blocks = re.split(r"\n\s*\n", body.strip())
    html_blocks = []
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        heading = _HEADING_RE.match(block)
        if heading and "\n" not in block:
            level = len(heading.group(1))
            html_blocks.append(
                f"<h{level}>{html.escape(heading.group(2).strip())}</h{level}>"
            )
            continue
        # A block that is only an image should not be wrapped in <p>
        # (figure is flow content).
        if _IMG_RE.fullmatch(block):
            html_blocks.append(_inline(block))
            continue
        inner = _inline(block).replace("\n", "<br>\n")
        html_blocks.append(f"<p>{inner}</p>")
    return "\n".join(html_blocks)


def _slug_from_path(path: Path) -> str:
    return path.stem


def load_posts(*, published_only: bool = False) -> list[dict]:
    posts = []
    if not CONTENT_DIR.is_dir():
        return posts
    for path in sorted(CONTENT_DIR.glob("*.md")):
        meta, body = _parse_frontmatter(path.read_text(encoding="utf-8"))
        slug = str(meta.get("slug") or _slug_from_path(path)).strip()
        published = meta.get("published", True)
        if isinstance(published, str):
            published = published.lower() != "false"
        tag = str(meta.get("tag") or "").strip()
        cover = str(meta.get("cover") or "").strip() or None
        post = {
            "id": slug,
            "slug": slug,
            "title": str(meta.get("title") or slug),
            "date": str(meta.get("date") or "")[:10],
            "tag": tag,
            "tags": [tag] if tag else [],
            "summary": str(meta.get("summary") or ""),
            "cover": cover,
            "published": bool(published),
            "mock": False,
            "href": f"/devlog/{slug}/",
            "body": body,
            "body_html": markdown_to_html(body),
            "source": str(path.relative_to(ROOT)).replace("\\", "/"),
        }
        if published_only and not post["published"]:
            continue
        posts.append(post)
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def index_payload(posts: list[dict]) -> list[dict]:
    """JSON-serialisable index entries consumed by js/devlog.js."""
    out = []
    for post in posts:
        cover = post["cover"] if media_exists(post["cover"]) else None
        out.append(
            {
                "id": post["id"],
                "date": post["date"],
                "title": post["title"],
                "summary": post["summary"],
                "tag": post["tag"],
                "tags": post["tags"],
                "href": "/devlog/#" + post["id"],
                "bodyHtml": post["body_html"],
                "mock": False,
                "hero": {
                    "src": cover,
                    "label": post["title"],
                    "alt": post["title"],
                    "dims": "cover",
                    "ratio": "16x9",
                    "pixelArt": False,
                },
            }
        )
    return out


def dumps_js(entries: list[dict]) -> str:
    payload = json.dumps(entries, indent=2, ensure_ascii=False)
    return (
        "/* Generated from content/devlog/*.md by tools/build-devlog.py. Do not edit. */\n"
        "(function (global) {\n"
        '  "use strict";\n'
        "  var DATA = (global.EB_DATA = global.EB_DATA || {});\n"
        f"  DATA.devlog = {payload};\n"
        "})(window);\n"
    )
