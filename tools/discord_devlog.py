# Discord webhook notifications for published Devlog posts.
# Stdlib only. Never print or log the webhook URL.
#
#   python tools/discord_devlog.py --mode new --files content/devlog/foo.md
#   python tools/discord_devlog.py --mode backfill
# GitHub Actions passes --send. Without --send this is a dry run.

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from devlog_content import format_date, load_posts, media_exists  # noqa: E402

SITE_ORIGIN = "https://endless-below.com"
SENT_PATH = ROOT / "data" / "discord-devlog-sent.json"
EMBED_COLOR = 0xC6A86A  # restrained warm gold
WEBHOOK_USERNAME = "ENDLESS BELOW"
AVATAR_PATH = "/assets/branding/icon.png"
SEND_GAP_SEC = 0.8
COVER_READY_INTERVAL_SEC = 5
COVER_READY_TIMEOUT_SEC = 90
COVER_PROBE_TIMEOUT_SEC = 10
_WEBHOOK_RE = re.compile(
    r"https://(?:www\.)?(?:discord|discordapp)\.com/api/webhooks/\S+",
    re.IGNORECASE,
)


class DiscordNotifyError(Exception):
    """Public failure text. Must never include the webhook URL."""


def redact(text: str, webhook_url: str = "") -> str:
    out = str(text or "")
    if webhook_url:
        out = out.replace(webhook_url, "[webhook]")
    return _WEBHOOK_RE.sub("[webhook]", out)


def cover_url(cover: str | None) -> str | None:
    if not cover:
        return None
    value = str(cover).strip()
    if not value:
        return None
    if value.startswith("https://") or value.startswith("http://"):
        return value
    if not value.startswith("/"):
        value = "/" + value
    return SITE_ORIGIN + value


def post_url(slug: str) -> str:
    return f"{SITE_ORIGIN}/devlog/#{slug}"


def webhook_avatar_url() -> str | None:
    if media_exists(AVATAR_PATH):
        return SITE_ORIGIN + AVATAR_PATH
    return None


def embed_timestamp(iso_date: str | None) -> str | None:
    raw = str(iso_date or "").strip()[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return None
    try:
        _dt.date.fromisoformat(raw)
    except ValueError:
        return None
    return f"{raw}T00:00:00.000Z"


def public_cover_url(cover: str | None) -> str | None:
    url = cover_url(cover)
    if not url:
        return None
    value = str(cover).strip()
    if value.startswith("https://") or value.startswith("http://"):
        return url
    if media_exists(value):
        return url
    return None


def _http_status(url: str, method: str, timeout: float = COVER_PROBE_TIMEOUT_SEC) -> int:
    headers = {"User-Agent": "endless-below-devlog"}
    if method == "GET":
        headers["Range"] = "bytes=0-0"
    request = urllib.request.Request(url, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return int(response.status)
    except urllib.error.HTTPError as exc:
        return int(exc.code)


def probe_cover_url(url: str, timeout: float = COVER_PROBE_TIMEOUT_SEC) -> tuple[bool, str]:
    """Lightweight public-URL check. HEAD first, GET if HEAD is unsupported."""
    try:
        status = _http_status(url, "HEAD", timeout=timeout)
        if status in (200, 206):
            return True, f"HTTP {status}"
        if status in (405, 501):
            status = _http_status(url, "GET", timeout=timeout)
            if status in (200, 206):
                return True, f"HTTP {status}"
        return False, f"HTTP {status}"
    except urllib.error.URLError as exc:
        try:
            status = _http_status(url, "GET", timeout=timeout)
            if status in (200, 206):
                return True, f"HTTP {status}"
            return False, f"HTTP {status}"
        except Exception as nested:
            return False, redact(str(nested) or str(exc.reason))
    except Exception as exc:
        return False, redact(str(exc))


def wait_for_public_cover(
    url: str,
    *,
    interval: float = COVER_READY_INTERVAL_SEC,
    timeout: float = COVER_READY_TIMEOUT_SEC,
    sleeper=time.sleep,
    prober=probe_cover_url,
) -> bool:
    """Retry until the public cover URL returns 200/206, or the timeout expires."""
    deadline = time.monotonic() + timeout
    started = time.monotonic()
    attempt = 0
    last_detail = "unreachable"
    while True:
        attempt += 1
        ready, last_detail = prober(url)
        elapsed = time.monotonic() - started
        if ready:
            print(f"cover ready {url} ({last_detail}, attempt {attempt})")
            return True
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            print(
                f"warning: cover not live after {timeout:.0f}s {url} "
                f"({last_detail}, {attempt} attempt(s)); sending without cover"
            )
            return False
        wait = min(interval, remaining)
        print(
            f"cover not live yet {url} ({last_detail}); "
            f"retry in {wait:.0f}s ({elapsed:.0f}s elapsed, {timeout:.0f}s max)"
        )
        sleeper(wait)


def is_devlog_markdown(path: str | Path) -> bool:
    rel = str(path).replace("\\", "/").lstrip("./")
    if not rel.startswith("content/devlog/") or not rel.endswith(".md"):
        return False
    rest = rel[len("content/devlog/") :]
    return bool(rest) and "/" not in rest and rest != ".md"


def load_sent(path: Path = SENT_PATH) -> list[str]:
    if not path.is_file():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    data = json.loads(raw)
    if not isinstance(data, list):
        raise DiscordNotifyError("sent-state file must be a JSON array of slugs")
    slugs: list[str] = []
    seen: set[str] = set()
    for item in data:
        slug = str(item).strip()
        if slug and slug not in seen:
            slugs.append(slug)
            seen.add(slug)
    return slugs


def save_sent(slugs: list[str], path: Path = SENT_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    unique: list[str] = []
    seen: set[str] = set()
    for slug in slugs:
        if slug and slug not in seen:
            unique.append(slug)
            seen.add(slug)
    path.write_text(
        json.dumps(unique, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def build_payload(post: dict) -> dict:
    slug = post["slug"]
    url = post_url(slug)
    summary = str(post.get("summary") or "").strip()
    tag = str(post.get("tag") or "").strip()
    date_human = format_date(post.get("date") or "")
    avatar = webhook_avatar_url()
    description_parts = []
    if summary:
        description_parts.append(summary)
    description_parts.append(f"[Read the full Devlog →]({url})")
    author = {"name": "ENDLESS BELOW • DEVLOG", "url": SITE_ORIGIN}
    if avatar:
        author["icon_url"] = avatar
    embed: dict = {
        "author": author,
        "title": post["title"],
        "url": url,
        "description": "\n\n".join(description_parts),
        "color": EMBED_COLOR,
        "footer": {
            "text": "ENDLESS BELOW  ·  endless-below.com",
        },
    }
    if avatar:
        embed["footer"]["icon_url"] = avatar
    meta_name = tag or "Devlog"
    if date_human:
        embed["fields"] = [{"name": meta_name, "value": date_human, "inline": True}]
    elif tag:
        embed["fields"] = [{"name": "Devlog", "value": tag, "inline": True}]
    image = public_cover_url(post.get("cover"))
    if image:
        embed["image"] = {"url": image}
    stamp = embed_timestamp(post.get("date"))
    if stamp:
        embed["timestamp"] = stamp
    payload = {
        "username": WEBHOOK_USERNAME,
        "allowed_mentions": {"parse": []},
        "embeds": [embed],
    }
    if avatar:
        payload["avatar_url"] = avatar
    return payload


def send_embed(webhook_url: str, payload: dict, timeout: float = 20) -> None:
    if not webhook_url:
        raise DiscordNotifyError("DISCORD_WEBHOOK_URL is not set")
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        webhook_url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "endless-below-devlog",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status >= 300:
                raise DiscordNotifyError(f"Discord HTTP {response.status}")
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:400]
        except Exception:
            detail = ""
        detail = redact(detail, webhook_url)
        extra = f": {detail}" if detail else ""
        raise DiscordNotifyError(f"Discord HTTP {exc.code}{extra}") from None
    except urllib.error.URLError as exc:
        reason = redact(getattr(exc, "reason", exc), webhook_url)
        raise DiscordNotifyError(f"Discord unavailable: {reason}") from None
    except DiscordNotifyError:
        raise
    except Exception as exc:
        raise DiscordNotifyError(redact(str(exc), webhook_url)) from None


def _normalize_rel(path: str | Path) -> str:
    return str(path).replace("\\", "/").lstrip("./")


def posts_by_source(posts: list[dict] | None = None) -> dict[str, dict]:
    posts = posts if posts is not None else load_posts(published_only=False)
    return {_normalize_rel(post["source"]): post for post in posts}


def select_new_posts(file_paths: list[str], posts: list[dict] | None = None) -> list[dict]:
    index = posts_by_source(posts)
    selected: list[dict] = []
    seen: set[str] = set()
    for raw in file_paths:
        rel = _normalize_rel(raw)
        if not is_devlog_markdown(rel):
            continue
        post = index.get(rel)
        if post is None:
            print(f"skip missing file: {rel}")
            continue
        if not post["published"]:
            print(f"skip unpublished: {post['slug']}")
            continue
        if post["slug"] in seen:
            continue
        seen.add(post["slug"])
        selected.append(post)
    selected.sort(key=lambda p: (p["date"], p["slug"]))
    return selected


def select_backfill_posts(posts: list[dict] | None = None) -> list[dict]:
    posts = posts if posts is not None else load_posts(published_only=False)
    published = [post for post in posts if post["published"]]
    published.sort(key=lambda p: (p["date"], p["slug"]))
    return published


def unsent(posts: list[dict], sent: list[str]) -> list[dict]:
    already = set(sent)
    return [post for post in posts if post["slug"] not in already]


def notify_posts(
    posts: list[dict],
    *,
    webhook_url: str,
    sent_path: Path = SENT_PATH,
    send: bool = False,
    delay: float = SEND_GAP_SEC,
    sender=send_embed,
    cover_waiter=wait_for_public_cover,
) -> tuple[list[str], list[str]]:
    """Send unsent posts. Returns (sent_now, failed_slugs)."""
    if not posts:
        print("no candidate posts")
        return [], []
    sent = load_sent(sent_path)
    queued = unsent(posts, sent)
    if not queued:
        print("all candidate posts already sent")
        return [], []

    if send and not webhook_url:
        raise DiscordNotifyError("DISCORD_WEBHOOK_URL is not set")

    sent_now: list[str] = []
    failed: list[str] = []
    for index, post in enumerate(queued):
        slug = post["slug"]
        payload = build_payload(post)
        print(f"{'send' if send else 'dry-run'} {slug} ({post['title']})")
        if not send:
            continue
        embed = payload["embeds"][0]
        image_url = (embed.get("image") or {}).get("url")
        if image_url:
            if not cover_waiter(image_url):
                embed.pop("image", None)
        try:
            sender(webhook_url, payload)
        except DiscordNotifyError as exc:
            print(f"failed {slug}: {exc}")
            failed.append(slug)
            continue
        sent.append(slug)
        sent_now.append(slug)
        save_sent(sent, sent_path)
        if index + 1 < len(queued) and delay > 0:
            time.sleep(delay)

    if not send:
        print(f"dry-run queued {len(queued)} post(s); sent-state unchanged")
    elif failed:
        raise DiscordNotifyError(
            "Discord notification failed for: " + ", ".join(failed)
        )
    return sent_now, failed


def _read_list_file(path: Path) -> list[str]:
    if not path.is_file():
        return []
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Notify Discord of Devlog posts")
    parser.add_argument("--mode", choices=("new", "backfill"), required=True)
    parser.add_argument("--files", nargs="*", default=[], help="Newly added Markdown paths")
    parser.add_argument("--from-list", dest="from_list", help="File of newly added Markdown paths")
    parser.add_argument(
        "--send",
        action="store_true",
        help="Actually POST to Discord. Without this flag, dry-run only.",
    )
    parser.add_argument("--sent-path", default=str(SENT_PATH))
    args = parser.parse_args(argv)

    sent_path = Path(args.sent_path)
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")
    if args.mode == "new":
        paths = list(args.files)
        if args.from_list:
            paths.extend(_read_list_file(Path(args.from_list)))
        posts = select_new_posts(paths)
    else:
        posts = select_backfill_posts()

    try:
        notify_posts(
            posts,
            webhook_url=webhook_url,
            sent_path=sent_path,
            send=args.send,
        )
    except DiscordNotifyError as exc:
        print(redact(str(exc), webhook_url), file=sys.stderr)
        return 1
    except json.JSONDecodeError:
        print("sent-state file is not valid JSON; refusing to notify", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
