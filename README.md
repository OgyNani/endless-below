# ENDLESS BELOW — official website

Static site for the indie game **ENDLESS BELOW**. No build step, no framework, no backend. Intended to ship on **GitHub Pages** at [https://endless-below.com](https://endless-below.com).

This is a visual and structural foundation. Most artwork is still a sized placeholder. Class copy and devlog entries that ship with the repo are **mock / placeholder** and marked as such in the data files.

## Local preview

Any static server from the repo root:

```bash
python -m http.server 8099
```

Then open `http://localhost:8099/`.

Opening the HTML files directly (`file://`) also works: scripts are classic, not modules, and all paths are relative.

## Deploy to GitHub Pages

1. Push this folder as the repository root (or copy its contents there).
2. Settings → Pages → Deploy from branch → `main` / `/` (root).
3. Add a `CNAME` file containing `endless-below.com` only when the DNS is actually pointed at GitHub.
4. The empty `.nojekyll` file is already here so GitHub will not run Jekyll on the assets.

All URLs in the HTML are **relative** (`css/base.css`, `classes.html`, `assets/...`) so the site works as:

- a custom domain at the root (`https://endless-below.com/`)
- a project page (`https://user.github.io/endless-below/`)
- a local folder

Canonical tags currently claim `https://endless-below.com/`. Update them if the public URL changes.

## Pages

| File | Role |
|---|---|
| `index.html` | Home: hero, short pitch, Steam/Discord CTAs, character preview, latest devlog |
| `classes.html` | Characters — all 10 base classes + detail modal |
| `devlog.html` | Development journal (art, animation, systems; future patch-style notes) |
| `404.html` | GitHub Pages not-found |

## Architecture

```text
css/            design tokens, reset, layout, components, page composition
js/main.js      header, motion, placeholders, pixel sprites, modal, lightbox
js/classes.js   renders EB_DATA.classes
js/devlog.js    renders EB_DATA.devlog (full list + home preview)
data/           the only files you edit to add a class or a devlog entry
assets/         branding, characters, generated stand-ins
tools/          placeholder PNG generator; optional HTML chrome emitter
```

Classes and devlogs are **data + renderer**. Adding a class is: drop files in `assets/characters/<id>/`, append one object in `data/classes.js`. No HTML rewrite.

## Visual direction

Dark fantasy, inscriptional, parchment on charcoal. Display type is **Cinzel**, body is **Spectral**, labels are **IBM Plex Mono**. Tokens live in `css/variables.css` so the type stack can be swapped in one place.

Pixel art is never filtered. See `.pixel-art` and the display-size tokens in `css/variables.css`.

## JavaScript

Vanilla, no dependencies, no modules. If JavaScript is disabled:

- Home, 404, navigation and footer still work
- Class / Devlog catalogues show a plain-language fallback instead of an empty hole

`prefers-reduced-motion` disables parallax, motes, reveals and sprite bob.

## Asset production

Read **[ASSET_GUIDE.md](ASSET_GUIDE.md)** before making art. Every slot lists size, ratio, format, transparency, safe area and mobile crop.

Regenerate the tiny stand-in sprites / favicons / OG image (Windows):

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-placeholders.ps1
```

Safe to overwrite — they are not production art.

## Remaining TODOs

Marked in code as `TODO(links)` or `TODO(art)`:

- Steam wishlist URL
- Discord invite
- YouTube, X/Twitter, GitHub, Twitter `@` handle
- Real key art, biomes, class portraits, full art, idle WebP
- Real Open Graph image
- Real logo SVG
- Real favicon
- Replace mock devlog data before launch (`mock: true` in `data/devlog.js`)
- Replace placeholder class copy (`copyStatus: "placeholder"`)

Do not invent reviews, awards, dates, player counts or class mechanics to fill the gaps.
