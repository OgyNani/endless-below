# Generate Devlog data + individual post pages from content/devlog/*.md
# Run from the repo root:
#   python tools/build-devlog.py
# Or generate the whole site:
#   python tools/build.py

from __future__ import annotations

import html
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from devlog_content import dumps_js, format_date, index_payload, load_posts  # noqa: E402
from sitechrome import page  # noqa: E402

DATA_JS = ROOT / "data" / "devlog.js"
DEVLOG_DIR = ROOT / "devlog"
SITEMAP = ROOT / "sitemap.xml"

STATIC_URLS = [
    "https://endless-below.com/",
    "https://endless-below.com/home/",
    "https://endless-below.com/characters/",
    "https://endless-below.com/devlog/",
]


def post_body(post: dict) -> str:
    tag = html.escape(post["tag"]) if post["tag"] else ""
    tag_html = f'<li><span class="tag">{tag}</span></li>' if tag else ""
    return f"""      <article class="devlog-post">
        <header class="page-header">
          <div class="container page-header__inner">
            <p class="eyebrow"><a href="/devlog/">Devlog</a></p>
            <h1 class="page-header__title">{html.escape(post["title"])}</h1>
            <div class="devlog-entry__meta">
              <time datetime="{html.escape(post["date"])}">{html.escape(format_date(post["date"]))}</time>
              {f'<ul class="tag-list">{tag_html}</ul>' if tag_html else ""}
            </div>
          </div>
        </header>

        <section class="section">
          <div class="container">
            <div class="prose devlog-post__body">
{post["body_html"]}
            </div>
            <p class="devlog-post__back">
              <a class="btn btn--sm" href="/devlog/"><span class="btn__label"><span class="btn__copy">All entries</span></span></a>
            </p>
          </div>
        </section>
      </article>
"""


def write_post_page(post: dict) -> Path:
    out_dir = DEVLOG_DIR / post["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    description = post["summary"] or post["title"]
    html_out = page(
        route="/devlog/",
        title=f"{post['title']} — ENDLESS BELOW",
        description=description,
        canonical=f"https://endless-below.com/devlog/{post['slug']}/",
        og_title=f"{post['title']} — ENDLESS BELOW",
        body=post_body(post),
        scripts=["/js/main.js?v=4"],
        header_solid=True,
    )
    path = out_dir / "index.html"
    path.write_text(html_out, encoding="utf-8", newline="\n")
    return path


def prune_stale(slugs: set[str]) -> None:
    if not DEVLOG_DIR.is_dir():
        return
    for child in DEVLOG_DIR.iterdir():
        if child.is_dir() and child.name not in slugs:
            shutil.rmtree(child)
            print("removed stale", child.relative_to(ROOT))


def write_sitemap(posts: list[dict]) -> None:
    urls = list(STATIC_URLS)
    for post in posts:
        urls.append(f"https://endless-below.com/devlog/{post['slug']}/")
    body = "\n".join(f"  <url><loc>{html.escape(url)}</loc></url>" for url in urls)
    SITEMAP.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n"
        "</urlset>\n",
        encoding="utf-8",
        newline="\n",
    )


def main() -> None:
    posts = load_posts(published_only=True)
    DATA_JS.parent.mkdir(parents=True, exist_ok=True)
    DATA_JS.write_text(dumps_js(index_payload(posts)), encoding="utf-8", newline="\n")
    print("wrote", DATA_JS.relative_to(ROOT))

    slugs = set()
    for post in posts:
        slugs.add(post["slug"])
        path = write_post_page(post)
        print("wrote", path.relative_to(ROOT))

    prune_stale(slugs)
    write_sitemap(posts)
    print("wrote", SITEMAP.relative_to(ROOT))


if __name__ == "__main__":
    main()
