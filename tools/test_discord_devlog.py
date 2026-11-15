# Local tests for Discord Devlog notifications. Never POSTs to Discord.
#   python tools/test_discord_devlog.py

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import discord_devlog as dd  # noqa: E402
from devlog_content import load_posts  # noqa: E402


def _post(**overrides) -> dict:
    base = {
        "slug": "mage-run-animations",
        "title": "Mage Run Animations",
        "summary": "Mage movement is finally in.",
        "date": "2026-11-06",
        "tag": "Animation",
        "cover": "/assets/devlog/uploads/mage-cover.png",
        "published": True,
        "source": "content/devlog/mage-run-animations.md",
    }
    base.update(overrides)
    return base


class DiscordDevlogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.sent_path = Path(self.tmp.name) / "sent.json"
        self.sent_path.write_text("[]\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_payload_uses_frontmatter_not_today(self) -> None:
        payload = dd.build_payload(_post())
        embed = payload["embeds"][0]
        self.assertEqual(payload["username"], "ENDLESS BELOW")
        icon = "https://endless-below.com/assets/branding/icon.png"
        self.assertEqual(payload["avatar_url"], icon)
        self.assertEqual(embed["author"]["icon_url"], icon)
        self.assertEqual(embed["footer"]["icon_url"], icon)
        self.assertEqual(embed["author"]["name"], "ENDLESS BELOW • DEVLOG")
        self.assertEqual(embed["title"], "Mage Run Animations")
        self.assertEqual(embed["description"], (
            "Mage movement is finally in.\n\n"
            "[Read the full Devlog →](https://endless-below.com/devlog/#mage-run-animations)"
        ))
        self.assertEqual(embed["fields"], [
            {"name": "Animation", "value": "6 November 2026", "inline": True}
        ])
        self.assertNotIn("15 November 2026", json.dumps(payload))
        self.assertNotIn("BACKFILL", json.dumps(payload))
        self.assertEqual(
            embed["url"], "https://endless-below.com/devlog/#mage-run-animations"
        )
        self.assertEqual(embed["color"], 0xC6A86A)
        self.assertEqual(embed["timestamp"], "2026-11-06T00:00:00.000Z")
        self.assertEqual(embed["footer"]["text"], "ENDLESS BELOW  ·  endless-below.com")
        self.assertEqual(
            embed["image"]["url"],
            "https://endless-below.com/assets/devlog/uploads/mage-cover.png",
        )

    def test_missing_cover_omits_image(self) -> None:
        payload = dd.build_payload(_post(cover=None))
        self.assertNotIn("image", payload["embeds"][0])
        payload = dd.build_payload(_post(cover=""))
        self.assertNotIn("image", payload["embeds"][0])
        payload = dd.build_payload(_post(cover="/assets/devlog/uploads/missing-cover.webp"))
        self.assertNotIn("image", payload["embeds"][0])

    def test_invalid_date_omits_timestamp(self) -> None:
        payload = dd.build_payload(_post(date="soon"))
        self.assertNotIn("timestamp", payload["embeds"][0])

    def test_new_published_post_is_queued(self) -> None:
        posts = [_post(), _post(slug="draft", published=False, source="content/devlog/draft.md")]
        selected = dd.select_new_posts(
            ["content/devlog/mage-run-animations.md"],
            posts,
        )
        self.assertEqual([p["slug"] for p in selected], ["mage-run-animations"])
        sent_now, failed = dd.notify_posts(
            selected,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=True,
            delay=0,
            sender=lambda url, payload: None,
        )
        self.assertEqual(sent_now, ["mage-run-animations"])
        self.assertEqual(failed, [])
        self.assertEqual(dd.load_sent(self.sent_path), ["mage-run-animations"])

    def test_new_draft_is_not_queued(self) -> None:
        posts = [_post(slug="secret-draft", published=False, source="content/devlog/secret-draft.md")]
        selected = dd.select_new_posts(["content/devlog/secret-draft.md"], posts)
        self.assertEqual(selected, [])
        sent_now, failed = dd.notify_posts(
            selected,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=True,
            delay=0,
            sender=lambda url, payload: (_ for _ in ()).throw(AssertionError("should not send")),
        )
        self.assertEqual(sent_now, [])
        self.assertEqual(failed, [])
        self.assertEqual(dd.load_sent(self.sent_path), [])

    def test_edited_existing_file_is_not_a_new_post(self) -> None:
        posts = [_post()]
        selected = dd.select_new_posts([], posts)
        self.assertEqual(selected, [])

    def test_two_new_posts_queue_two_notifications(self) -> None:
        posts = [
            _post(slug="b-post", date="2026-11-08", title="B", source="content/devlog/b-post.md"),
            _post(slug="a-post", date="2026-11-07", title="A", source="content/devlog/a-post.md"),
        ]
        selected = dd.select_new_posts(
            ["content/devlog/b-post.md", "content/devlog/a-post.md"],
            posts,
        )
        self.assertEqual([p["slug"] for p in selected], ["a-post", "b-post"])
        calls: list[str] = []

        def sender(url, payload):
            calls.append(payload["embeds"][0]["url"].rsplit("#", 1)[-1])

        sent_now, failed = dd.notify_posts(
            selected,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=True,
            delay=0,
            sender=sender,
        )
        self.assertEqual(sent_now, ["a-post", "b-post"])
        self.assertEqual(calls, ["a-post", "b-post"])
        self.assertEqual(failed, [])

    def test_backfill_sends_unsent_oldest_first(self) -> None:
        repo_posts = [p for p in load_posts(published_only=False) if p["published"]]
        selected = dd.select_backfill_posts(repo_posts)
        slugs = [p["slug"] for p in selected]
        self.assertEqual(
            slugs,
            [
                "base-run-animations",
                "archer-run-animations",
                "barbarian-run-animations",
                "bard-run-animations",
                "mage-run-animations",
            ],
        )
        dd.save_sent(["base-run-animations"], self.sent_path)
        calls: list[str] = []

        def sender(url, payload):
            calls.append(payload["embeds"][0]["url"].rsplit("#", 1)[-1])

        sent_now, failed = dd.notify_posts(
            selected,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=True,
            delay=0,
            sender=sender,
        )
        self.assertEqual(failed, [])
        self.assertEqual(
            sent_now,
            [
                "archer-run-animations",
                "barbarian-run-animations",
                "bard-run-animations",
                "mage-run-animations",
            ],
        )
        self.assertEqual(calls, sent_now)

    def test_second_backfill_sends_nothing(self) -> None:
        selected = dd.select_backfill_posts(load_posts(published_only=True))
        dd.save_sent([p["slug"] for p in selected], self.sent_path)
        sent_now, failed = dd.notify_posts(
            selected,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=True,
            delay=0,
            sender=lambda url, payload: (_ for _ in ()).throw(AssertionError("duplicate")),
        )
        self.assertEqual(sent_now, [])
        self.assertEqual(failed, [])

    def test_failed_discord_does_not_mark_sent(self) -> None:
        posts = [_post(), _post(slug="second", source="content/devlog/second.md", date="2026-11-07")]

        def sender(url, payload):
            slug = payload["embeds"][0]["url"].rsplit("#", 1)[-1]
            if slug == "second":
                raise dd.DiscordNotifyError("Discord HTTP 500")

        with self.assertRaises(dd.DiscordNotifyError):
            dd.notify_posts(
                posts,
                webhook_url="https://example.invalid/webhook",
                sent_path=self.sent_path,
                send=True,
                delay=0,
                sender=sender,
            )
        self.assertEqual(dd.load_sent(self.sent_path), ["mage-run-animations"])

    def test_dry_run_does_not_write_state_or_send(self) -> None:
        posts = [_post()]
        sent_now, failed = dd.notify_posts(
            posts,
            webhook_url="https://example.invalid/webhook",
            sent_path=self.sent_path,
            send=False,
            delay=0,
            sender=lambda url, payload: (_ for _ in ()).throw(AssertionError("dry-run sent")),
        )
        self.assertEqual(sent_now, [])
        self.assertEqual(failed, [])
        self.assertEqual(dd.load_sent(self.sent_path), [])

    def test_cli_new_without_send_is_dry_run(self) -> None:
        with mock.patch.object(dd, "load_posts", return_value=[_post()]):
            code = dd.main(
                [
                    "--mode",
                    "new",
                    "--files",
                    "content/devlog/mage-run-animations.md",
                    "--sent-path",
                    str(self.sent_path),
                ]
            )
        self.assertEqual(code, 0)
        self.assertEqual(dd.load_sent(self.sent_path), [])

    def test_redact_never_prints_webhook(self) -> None:
        url = "https://discord.com/api/webhooks/123/secret-token"
        hidden = dd.redact(f"failed {url} boom", url)
        self.assertNotIn("secret-token", hidden)
        self.assertNotIn(url, hidden)

    def test_generated_and_css_changes_have_no_new_markdown(self) -> None:
        # Workflow only passes git diff --diff-filter=A paths. CSS/generated
        # commits yield an empty list, which must not notify.
        selected = dd.select_new_posts(
            ["css/pages.css", "data/devlog.js", "content/devlog/mage-run-animations.md.bak"],
            [_post()],
        )
        self.assertEqual(selected, [])

    def test_existing_published_repo_posts(self) -> None:
        posts = load_posts(published_only=True)
        slugs = {p["slug"] for p in posts}
        self.assertTrue(all(p["published"] for p in posts))
        self.assertEqual(len(posts), 5)
        self.assertEqual(
            slugs,
            {
                "base-run-animations",
                "archer-run-animations",
                "barbarian-run-animations",
                "bard-run-animations",
                "mage-run-animations",
            },
        )


if __name__ == "__main__":
    unittest.main()
