# One-shot HTML chrome emitter. Run from the repo root:
#   python tools/emit-pages.py
# Full site (chrome + Devlog from Markdown):
#   python tools/build.py
#
# Pages live in folders so URLs are /home/, /characters/, /devlog/.
# Root / redirects to /home/. Asset and script hrefs are root-relative.

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from sitechrome import page  # noqa: E402
from devlog_content import format_date, load_posts  # noqa: E402

LEGACY = ("classes.html", "devlog.html")


HOME = r"""
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__art" data-parallax="-0.05">
          <img class="hero__img" src="/assets/backgrounds/main.png"
               alt="" width="2560" height="1440" fetchpriority="high">
        </div>
        <div class="hero__scrim" aria-hidden="true"></div>

        <div class="container hero__inner">
          <div class="hero__content">
            <h1 class="hero__title" id="hero-title">
              <span>Endless</span>
              <span class="hero__title-below">Below</span>
            </h1>

            <p class="hero__creed">Descend. Survive. Return changed.</p>

            <p class="hero__desc">ENDLESS BELOW is a dark fantasy online action RPG about dangerous expeditions into an ever-changing Abyss.</p>

            <div class="hero__actions">
              <!-- TODO(links): replace "#" with the real Steam wishlist URL -->
              <a class="btn btn--primary" href="#" data-todo="steam-wishlist">Wishlist on Steam</a>
              <!-- TODO(links): replace "#" with the real Discord invite URL -->
              <a class="btn" href="#" data-todo="discord-invite">Join Discord</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section home-premise" id="last-city" aria-labelledby="last-city-title">
        <div class="container">
          <div class="split reveal">
            <div class="home-premise__copy">
              <p class="eyebrow">The surface</p>
              <h2 class="section__title" id="last-city-title">The last city above</h2>
              <p class="section__lead">One city still stands on the surface.</p>
              <p>Built around the mouth of the Abyss, it survives in a place the depths somehow never claimed.</p>
              <p>Beyond its walls, almost nothing remains.</p>
            </div>
            <div class="home-premise__art frame">
              <img class="home-premise__img" src="/assets/backgrounds/city.png"
                   alt="" width="1600" height="900">
            </div>
          </div>
        </div>
      </section>

      <div class="pixel-divider" aria-hidden="true"></div>

      <section class="section section--sunken home-premise" id="the-abyss" aria-labelledby="abyss-title">
        <div class="container">
          <div class="split split--reverse reveal">
            <div class="home-premise__copy">
              <p class="eyebrow">The Abyss</p>
              <h2 class="section__title" id="abyss-title">Everything else lies below</h2>
              <p class="section__lead">The Abyss is more than darkness beneath the earth.</p>
              <p>Forests, ruins, seas, lost settlements and places that should not exist can be found somewhere in its depths.</p>
              <p>No descent promises the same path twice.</p>
            </div>
            <div class="home-premise__art frame">
              <img class="home-premise__img" src="/assets/backgrounds/abbys.png"
                   alt="" width="1600" height="900">
            </div>
          </div>
        </div>
      </section>

      <div class="pixel-divider" aria-hidden="true"></div>

      <section class="section" id="latest-devlog" aria-labelledby="devlog-preview-title">
        <div class="container">
          <div class="class-preview__head reveal">
            <div>
              <p class="eyebrow">Devlog</p>
              <h2 class="section__title" id="devlog-preview-title">Latest</h2>
            </div>
            <a class="btn btn--sm" href="/devlog/">View all devlogs</a>
          </div>

          <p class="notice no-js-only">
            <span class="notice__mark">No JavaScript</span>
            Latest entries need JavaScript. Open the <a href="/devlog/">Devlog</a>.
          </p>
          <div class="home-devlog js-only" data-devlog-preview></div>
        </div>
      </section>
"""

CLASSES = r"""
      <header class="page-header">
        <div class="container page-header__inner">
          <p class="eyebrow">Characters · <span data-class-count>10</span> base classes</p>
          <h1 class="page-header__title">Choose your path</h1>
          <p class="page-header__lead">The ten base classes. Abilities, resources and subclasses are not yet announced.</p>
        </div>
      </header>

      <section class="section" aria-labelledby="class-grid-title">
        <div class="container">
          <h2 class="visually-hidden" id="class-grid-title">Base classes</h2>

          <p class="notice no-js-only">
            <span class="notice__mark">No JavaScript</span>
            Sprites, idle animations and the class detail panel need JavaScript. The ten base classes are listed below.
          </p>
          <ol class="no-js-only">
            <li>Archer — Ranged</li>
            <li>Warrior — Frontline</li>
            <li>Bard — Support</li>
            <li>Priest — Healer</li>
            <li>Mage — Caster</li>
            <li>Rogue — Skirmisher</li>
            <li>Paladin — Guardian</li>
            <li>Barbarian — Bruiser</li>
            <li>Warlock — Occult</li>
            <li>Spellblade — Hybrid</li>
          </ol>

          <div class="class-grid js-only" data-classes="grid"></div>
        </div>
      </section>

      <section class="cta-band" aria-labelledby="classes-cta">
        <div class="container">
          <h2 id="classes-cta">Follow the expedition</h2>
          <p>Wishlist on Steam, or watch development in the Discord.</p>
          <div class="cta-band__actions">
            <!-- TODO(links): replace "#" with the real Steam wishlist URL -->
            <a class="btn btn--primary" href="#" data-todo="steam-wishlist">Wishlist on Steam</a>
            <!-- TODO(links): replace "#" with the real Discord invite URL -->
            <a class="btn" href="#" data-todo="discord-invite">Join Discord</a>
          </div>
        </div>
      </section>
"""

def _esc(text):
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def devlog_index_body(posts):
    if posts:
        items = "\n".join(
            f'            <li><a href="/devlog/{_esc(p["slug"])}/">'
            f'{_esc(format_date(p["date"]))} — {_esc(p["title"])}</a></li>'
            for p in posts
        )
    else:
        items = "            <li>No entries yet.</li>"
    return f"""
      <header class="page-header">
        <div class="container page-header__inner">
          <p class="eyebrow">Development journal</p>
          <h1 class="page-header__title">Devlog</h1>
          <p class="page-header__lead">Development updates, art, animation and systems. Future patch-style notes will live here too.</p>
        </div>
      </header>

      <section class="section" aria-labelledby="devlog-list-title">
        <div class="container">
          <h2 class="visually-hidden" id="devlog-list-title">Entries</h2>

          <div class="filters js-only" data-devlog-filters></div>

          <p class="notice no-js-only">
            <span class="notice__mark">No JavaScript</span>
            Tag filters need JavaScript. Entries are listed below.
          </p>
          <ol class="no-js-only">
{items}
          </ol>

          <ol class="devlog-list js-only" data-devlog-list></ol>
        </div>
      </section>
"""

NOT_FOUND = r"""
      <div class="not-found">
        <div class="container">
          <p class="not-found__code">404</p>
          <h1>This descent has no floor</h1>
          <p class="text-muted">That path does not exist on this site.</p>
          <p style="margin-top: 2rem;">
            <a class="btn btn--primary" href="/home/">Return to the surface</a>
          </p>
        </div>
      </div>
"""

ROOT_REDIRECT = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ENDLESS BELOW</title>
  <meta http-equiv="refresh" content="0; url=/home/">
  <link rel="canonical" href="https://endless-below.com/home/">
  <script>location.replace("/home/");</script>
</head>
<body>
  <p><a href="/home/">ENDLESS BELOW</a></p>
</body>
</html>
"""

PAGES = [
    {
        "out": "home/index.html",
        "route": "/home/",
        "title": "ENDLESS BELOW — Dark Fantasy Online Action RPG",
        "description": "ENDLESS BELOW is a dark fantasy online action RPG about dangerous expeditions into an ever-changing Abyss.",
        "canonical": "https://endless-below.com/home/",
        "og_title": "ENDLESS BELOW — Dark Fantasy Online Action RPG",
        "body": HOME,
        "scripts": ["/js/main.js?v=5", "/data/devlog.js?v=5", "/js/devlog.js?v=5"],
        "header_solid": False,
    },
    {
        "out": "characters/index.html",
        "route": "/characters/",
        "title": "Characters — ENDLESS BELOW",
        "description": "The ten base classes of ENDLESS BELOW.",
        "canonical": "https://endless-below.com/characters/",
        "og_title": "Characters — ENDLESS BELOW",
        "body": CLASSES,
        "scripts": ["/js/main.js", "/data/classes.js", "/js/classes.js"],
    },
    {
        "out": "devlog/index.html",
        "route": "/devlog/",
        "title": "Devlog — ENDLESS BELOW",
        "description": "Development updates for ENDLESS BELOW: art, animation, systems, and future patch-style notes.",
        "canonical": "https://endless-below.com/devlog/",
        "og_title": "Devlog — ENDLESS BELOW",
        "body": None,
        "scripts": ["/js/main.js?v=5", "/data/devlog.js?v=5", "/js/devlog.js?v=5"],
    },
    {
        "out": "404.html",
        "route": "",
        "title": "Not found — ENDLESS BELOW",
        "description": "That path does not exist on the ENDLESS BELOW site.",
        "canonical": "https://endless-below.com/404.html",
        "og_title": "Not found — ENDLESS BELOW",
        "body": NOT_FOUND,
        "scripts": ["/js/main.js"],
    },
]


def main():
    posts = load_posts(published_only=True)
    for spec in PAGES:
        out = spec["out"]
        args = {k: v for k, v in spec.items() if k != "out"}
        if args.get("body") is None:
            args["body"] = devlog_index_body(posts)
        html = page(**args)
        path = ROOT / out
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding="utf-8", newline="\n")
        print("wrote", path.relative_to(ROOT))

    root_index = ROOT / "index.html"
    root_index.write_text(ROOT_REDIRECT, encoding="utf-8", newline="\n")
    print("wrote", root_index.relative_to(ROOT), "(redirect to /home/)")

    for name in LEGACY:
        legacy = ROOT / name
        if legacy.exists():
            legacy.unlink()
            print("removed", name)


if __name__ == "__main__":
    main()
