# Shared page chrome for emit-pages.py and build-devlog.py.
# Keep this ASCII-safe: Windows consoles may be cp1251.

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from asset_version import versioned  # noqa: E402

STYLESHEETS = (
    "/css/variables.css",
    "/css/base.css",
    "/css/layout.css",
    "/css/components.css",
    "/css/pages.css",
    "/css/pixel-ui.css",
)

SIGIL = """\
          <img class="brand__sigil" src="/assets/branding/icon.png" width="28" height="28" alt="" decoding="async" aria-hidden="true">"""

NAV = [
    ("/home/", "Home"),
    ("/characters/", "Characters"),
    ("/devlog/", "Devlog"),
]


def nav_html(current):
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        items.append(
            f'            <li><a class="site-nav__link" href="{href}"{cur}>{label}</a></li>'
        )
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
    css_tags = "\n  ".join(
        f'<link rel="stylesheet" href="{versioned(href)}">' for href in STYLESHEETS
    )
    script_tags = "\n  ".join(
        f'<script src="{versioned(src)}"></script>' for src in scripts
    )
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

  <link rel="icon" href="/assets/branding/icon.png" type="image/png">
  <link rel="icon" href="/assets/branding/favicon-512.png" sizes="512x512" type="image/png">
  <link rel="apple-touch-icon" href="/assets/branding/apple-touch-icon-180.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Spectral:ital,wght@0,300;0,400;0,600;1,400&display=swap">

  {css_tags}
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
          <span>&copy; <span data-year>2026</span> Endless Below</span>
          <span>Work in progress -- all content subject to change</span>
        </div>
      </div>
    </footer>
  </div>

  {script_tags}
</body>
</html>
"""
