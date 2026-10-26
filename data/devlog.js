/* ==========================================================================
   ENDLESS BELOW — devlog entries
   --------------------------------------------------------------------------
   ⚠ EVERY ENTRY BELOW IS MOCK CONTENT (`mock: true`).
     These exist only to demonstrate the devlog layout. They are NOT real
     production history: no dates, milestones or results here are factual.
     Delete them (or flip `mock` to false once an entry is genuinely real)
     before the site goes public. The renderer prints a "MOCK ENTRY" badge
     for anything with `mock: true`.

   Order: newest first (the renderer also sorts by date defensively).

   Entry shape:
     id        — slug, used for the #anchor and the "read entry" toggle id
     date      — ISO 8601 (YYYY-MM-DD)
     title     — string
     summary   — one or two sentences for the list view
     tags      — array of strings, drives the tag filter
     hero      — image slot { src, label, dims, ratio }
     body      — array of blocks: { type: "p" | "h3" | "ul" | "quote", ... }
     gallery   — optional array of image slots
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA = (global.EB_DATA = global.EB_DATA || {});

  DATA.devlog = [
    {
      id: "character-animation-pipeline",
      mock: true,
      date: "2026-10-12",
      title: "Character Animation Pipeline",
      summary:
        "Mock entry. How a 16×16 source sprite travels from the pixel grid to the screen without ever being blurred or resampled.",
      tags: ["Pixel Art", "Animation", "Tools"],
      hero: {
        src: null, // TODO(art): "assets/media/devlog/animation-pipeline.webp"
        label: "DEVLOG HERO — ANIMATION PIPELINE",
        dims: "1600 × 900",
        ratio: "16x9"
      },
      body: [
        {
          type: "p",
          text:
            "Placeholder article body. This entry is mock content used to validate the devlog layout, typography measure and gallery behaviour."
        },
        { type: "h3", text: "Source resolution is the contract" },
        {
          type: "p",
          text:
            "Sprites are authored at 16×16 and never upscaled on disk. Display scaling happens in CSS at integer multiples so the pixel grid stays intact at every size."
        },
        {
          type: "ul",
          items: [
            "Placeholder note: sprites exported as indexed PNG with transparency.",
            "Placeholder note: idle cycles delivered as animated WebP or as a horizontal spritesheet.",
            "Placeholder note: no filtering, no mipmaps, no half-pixel offsets."
          ]
        },
        {
          type: "quote",
          text:
            "Placeholder quote used to demonstrate the in-article quote style.",
          cite: "Mock attribution"
        },
        {
          type: "p",
          text:
            "Placeholder closing paragraph. Replace all of this text with a real write-up when the pipeline is finished."
        }
      ],
      gallery: [
        {
          src: null,
          label: "SPRITE SHEET BREAKDOWN",
          dims: "1600 × 900",
          ratio: "16x9"
        },
        {
          src: null,
          label: "IDLE CYCLE FRAMES",
          dims: "1600 × 900",
          ratio: "16x9"
        }
      ]
    },
    {
      id: "building-the-abyss",
      mock: true,
      date: "2026-09-28",
      title: "Building the Abyss",
      summary:
        "Mock entry. First pass on how descent layers are assembled, and why spaces need to read as places rather than levels.",
      tags: ["World", "Level Design"],
      hero: {
        src: null, // TODO(art): "assets/media/devlog/building-the-abyss.webp"
        label: "DEVLOG HERO — BUILDING THE ABYSS",
        dims: "1600 × 900",
        ratio: "16x9"
      },
      body: [
        {
          type: "p",
          text:
            "Placeholder article body. Mock content demonstrating a longer entry with multiple sections."
        },
        { type: "h3", text: "Layers, not levels" },
        {
          type: "p",
          text:
            "Placeholder paragraph about assembling descent layers out of reusable spatial pieces, kept deliberately vague until the real systems are locked."
        },
        { type: "h3", text: "What we are testing next" },
        {
          type: "ul",
          items: [
            "Placeholder item.",
            "Placeholder item.",
            "Placeholder item."
          ]
        }
      ],
      gallery: [
        { src: null, label: "LAYER BLOCKOUT", dims: "1600 × 900", ratio: "16x9" }
      ]
    },
    {
      id: "combat-system-progress",
      mock: true,
      date: "2026-09-08",
      title: "Combat System Progress",
      summary:
        "Mock entry. Early notes on readability in low light, telegraph timing and why the first second of a fight matters most.",
      tags: ["Combat", "Systems"],
      hero: {
        src: null, // TODO(art): "assets/media/devlog/combat-progress.webp"
        label: "DEVLOG HERO — COMBAT PROGRESS",
        dims: "1600 × 900",
        ratio: "16x9"
      },
      body: [
        {
          type: "p",
          text:
            "Placeholder article body. Mock content demonstrating a short entry with no gallery."
        },
        {
          type: "p",
          text:
            "Placeholder paragraph. Real combat details will be published once the system is stable enough to describe honestly."
        }
      ],
      gallery: null
    }
  ];
})(window);
