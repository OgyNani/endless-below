# One-shot HTML chrome emitter. Run from the repo root:
#   python tools/emit-pages.py
# The site itself has no build step; this only keeps header/footer in sync.
#
# Pages live in folders so URLs are /home/, /characters/, /devlog/.
# Root / redirects to /home/. Asset and script hrefs are root-relative.

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SIGIL = """\
          <svg class="brand__sigil" viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true" focusable="false">
            <circle cx="16" cy="16" r="13.5" stroke="currentColor" stroke-opacity=".35"/>
            <circle cx="16" cy="16" r="9.5" stroke="currentColor" stroke-opacity=".18" stroke-dasharray="2 3"/>
            <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.5 10.5 16 14l5.5-3.5" stroke-opacity=".9"/>
              <path d="M10.5 15.5 16 19l5.5-3.5" stroke-opacity=".6"/>
              <path d="M10.5 20.5 16 24l5.5-3.5" stroke-opacity=".35"/>
            </g>
          </svg>"""

NAV = [
    ("/home/", "Home"),
    ("/characters/", "Characters"),
    ("/devlog/", "Devlog"),
]

LEGACY = ("classes.html", "devlog.html")


def nav_html(current):
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        items.append(f'            <li><a class="site-nav__link" href="{href}"{cur}>{label}</a></li>')
    return "\n".join(items)


def page(
    route,
    title,
    description,
    canonical,
    og_title,
    body,
    scripts,
    header_solid=True,
):
    solid = " site-header--solid" if header_solid else ""
    script_tags = "\n  ".join(f'<script src="{src}"></script>' for src in scripts)
    return f"""<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#050506">

  <!-- Canonical domain. TODO(deploy): confirm before launch. -->
  <link rel="canonical" href="{canonical}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ENDLESS BELOW">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <!-- TODO(art): replace with the final 1200x630 share image -->
  <meta property="og:image" content="https://endless-below.com/assets/media/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="ENDLESS BELOW key art placeholder">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="https://endless-below.com/assets/media/og-image.png">
  <!-- TODO(links): add twitter:site once the account exists -->

  <link rel="icon" href="/assets/branding/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="icon" href="/assets/branding/favicon-512.png" sizes="512x512" type="image/png">
  <link rel="apple-touch-icon" href="/assets/branding/apple-touch-icon-180.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Spectral:ital,wght@0,300;0,400;0,600;1,400&display=swap">

  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/pages.css">
  <link rel="stylesheet" href="/css/pixel-ui.css">
</head>

<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <div class="atmos" aria-hidden="true">
    <div class="atmos__glow"></div>
    <canvas class="atmos__motes"></canvas>
    <div class="atmos__grain"></div>
    <div class="atmos__vignette"></div>
  </div>

  <div class="page">
    <header class="site-header{solid}">
      <div class="container site-header__inner">
        <a class="brand" href="/home/">
{SIGIL}
          <span class="brand__name">Endless Below</span>
        </a>

        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span class="nav-toggle__bars" aria-hidden="true"></span>
          <span>Menu</span>
        </button>

        <nav class="site-nav" id="site-nav" aria-label="Primary">
          <ul class="site-nav__list">
{nav_html(route)}
          </ul>
        </nav>

        <div class="site-header__cta">
          <!-- TODO(links): replace "#" with the real Steam wishlist URL -->
          <a class="btn btn--sm btn--primary" href="#" data-todo="steam-wishlist">Wishlist</a>
          <!-- TODO(links): replace "#" with the real Discord invite URL -->
          <a class="btn btn--sm" href="#" data-todo="discord-invite">Discord</a>
        </div>
      </div>
    </header>

    <main class="page__main" id="main">
{body}
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a class="brand" href="/home/">
{SIGIL}
              <span class="brand__name">Endless Below</span>
            </a>
            <p class="site-footer__tagline">A dark fantasy online action RPG.</p>
          </div>

          <div class="site-footer__links">
            <div class="footer-col">
              <h4>Follow</h4>
              <!-- TODO(links): all external destinations are placeholders -->
              <ul>
                <li><a href="#" data-todo="steam">Steam</a></li>
                <li><a href="#" data-todo="discord">Discord</a></li>
                <li><a href="#" data-todo="youtube">YouTube</a></li>
                <li><a href="#" data-todo="twitter">X / Twitter</a></li>
                <li><a href="#" data-todo="github">GitHub</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Site</h4>
              <ul>
                <li><a href="/home/">Home</a></li>
                <li><a href="/characters/">Characters</a></li>
                <li><a href="/devlog/">Devlog</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="site-footer__base">
          <span>© <span data-year>2026</span> Endless Below</span>
          <span>Work in progress — all content subject to change</span>
        </div>
      </div>
    </footer>
  </div>

  {script_tags}
</body>
</html>
"""


HOME = r"""
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__art" data-parallax="-0.05">
          <!-- TODO(art): replace this placeholder with the final key art:
               <img class="hero__img" src="/assets/backgrounds/hero-key-art.webp"
                    alt="" width="2560" height="1440" fetchpriority="high"> -->
          <div class="ph" role="img" aria-label="Placeholder: hero key art, 2560 by 1440">
            <span class="ph__label">Hero Key Art</span>
            <span class="ph__dims">2560 × 1440 · 16:9 · WebP</span>
            <span class="ph__note">A city, the Abyss, dark fantasy atmosphere. Subject centred, centre-left kept clear for the title, must crop safely to mobile portrait.</span>
          </div>
        </div>
        <div class="hero__scrim" aria-hidden="true"></div>

        <div class="container hero__inner">
          <div class="hero__content">
            <p class="eyebrow">Online action RPG · In development</p>

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

        <a class="hero__scroll" href="#last-city">
          <span class="hero__scroll-label">Descend</span>
          <span class="hero__scroll-track" aria-hidden="true">
            <span class="hero__scroll-hint">
              <span class="hero__scroll-arrow"></span>
            </span>
          </span>
        </a>
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
              <!-- TODO(art): replace with the last-city key art -->
              <div class="ph ph--16x9" role="img" aria-label="Placeholder: the last city above, 1600 by 900">
                <span class="ph__label">The Last City Above</span>
                <span class="ph__dims">1600 × 900 · 16:9 · WebP</span>
                <span class="ph__note">A surface city around the mouth of the Abyss. Dark. Still standing.</span>
              </div>
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
              <!-- TODO(art): replace with abyss atmosphere art -->
              <div class="ph ph--16x9" role="img" aria-label="Placeholder: the Abyss below, 1600 by 900">
                <span class="ph__label">Everything Else Lies Below</span>
                <span class="ph__dims">1600 × 900 · 16:9 · WebP</span>
                <span class="ph__note">Depths that should not exist. Forests, ruins, seas, lost places.</span>
              </div>
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

DEVLOG = r"""
      <header class="page-header">
        <div class="container page-header__inner">
          <p class="eyebrow">Development journal</p>
          <h1 class="page-header__title">Devlog</h1>
          <p class="page-header__lead">Development updates, art, animation and systems. Future patch-style notes will live here too. Mock entries are marked.</p>
        </div>
      </header>

      <section class="section" aria-labelledby="devlog-list-title">
        <div class="container">
          <h2 class="visually-hidden" id="devlog-list-title">Entries</h2>

          <p class="notice">
            <span class="notice__mark">Demo</span>
            Every entry currently on this page is mock content for layout. It is not production history.
          </p>

          <div class="filters js-only" data-devlog-filters></div>

          <p class="notice no-js-only">
            <span class="notice__mark">No JavaScript</span>
            Full articles, tag filters and galleries need JavaScript. Mock titles are listed below.
          </p>
          <ol class="no-js-only">
            <li>12 October 2026 — Character Animation Pipeline</li>
            <li>28 September 2026 — Building the Abyss</li>
            <li>8 September 2026 — Combat System Progress</li>
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
        "scripts": ["/js/main.js", "/data/devlog.js", "/js/devlog.js"],
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
        "body": DEVLOG,
        "scripts": ["/js/main.js", "/data/devlog.js", "/js/devlog.js"],
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
    for spec in PAGES:
        out = spec["out"]
        args = {k: v for k, v in spec.items() if k != "out"}
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
