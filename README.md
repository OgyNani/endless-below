# ENDLESS BELOW — official website

Static site for the indie game **ENDLESS BELOW**. No frontend framework. Ships on **GitHub Pages** at [https://endless-below.com](https://endless-below.com).

Chrome pages are plain HTML/CSS/vanilla JS. Devlog posts live as Markdown and are compiled into HTML + `data/devlog.js`.

## Local site

From the repo root:

```text
python -m http.server 8099 --bind 127.0.0.1
```

Open [http://127.0.0.1:8099/home/](http://127.0.0.1:8099/home/).

After editing Devlog Markdown, regenerate pages:

```text
python tools/build.py
```

## Devlog content

Posts: `content/devlog/<slug>.md`

Media: `assets/devlog/<folder>/` (post-specific) or `assets/devlog/uploads/` (CMS uploads)

A published post becomes `/devlog/<slug>/`. The index at `/devlog/` lists published posts, newest first.

## Admin (Decap CMS)

Local, no login — two terminals from the repo root (Node.js 20+ required for the proxy):

```text
python -m http.server 8099 --bind 127.0.0.1
npx decap-server
```

`npm run cms` is the same as `npx decap-server` after `npm install`. Then open [http://127.0.0.1:8099/admin/](http://127.0.0.1:8099/admin/). Default proxy port is 8081. If the proxy is not running, Decap falls back to Turbo login — start `decap-server` instead. Saves write Markdown under `content/devlog/` (filesystem mode, no git commit). Run `python tools/build.py` to preview the post on the site.

Production (`https://endless-below.com/admin/`) uses **Decap Turbo** (`turbo-github`). GitHub Pages cannot run the OAuth handshake itself. Publish commits Markdown/media to `main`; the Rebuild Devlog workflow then regenerates the site.
