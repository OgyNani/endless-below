/* ==========================================================================
   ENDLESS BELOW — media gallery items
   --------------------------------------------------------------------------
   ⚠ EVERY ITEM BELOW IS A PLACEHOLDER SLOT (`src: null`).
     Nothing here is a real screenshot. Each entry documents an asset that
     still needs to be produced, including its required source dimensions.
     Replace `src` with a real path and the renderer swaps the styled
     placeholder for a lazy-loaded <img>.

   Item shape:
     id        — slug used by the lightbox
     title     — short caption
     category  — "screenshots" | "characters" | "world" | "concept" | "animations"
     kind      — display label for the item's format
     span      — optional grid emphasis: "wide" | "full"
     src       — null (placeholder) or an asset path
     label     — placeholder caption
     dims      — required source resolution
     ratio     — aspect-ratio helper suffix
     pixelArt  — true for assets that must never be smoothed
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA = (global.EB_DATA = global.EB_DATA || {});

  DATA.mediaCategories = [
    { id: "all", label: "All" },
    { id: "screenshots", label: "Screenshots" },
    { id: "characters", label: "Characters" },
    { id: "world", label: "World" },
    { id: "concept", label: "Concept Art" },
    { id: "animations", label: "Animations" }
  ];

  DATA.media = [
    {
      id: "hero-key-art",
      title: "Key Art — The City Above the Abyss",
      category: "concept",
      kind: "Key art",
      span: "wide",
      src: null,
      label: "HERO KEY ART",
      dims: "2560 × 1440",
      ratio: "16x9"
    },
    {
      id: "descent-screenshot-01",
      title: "Descent — Upper Layers",
      category: "screenshots",
      kind: "Screenshot",
      src: null,
      label: "GAMEPLAY SCREENSHOT",
      dims: "1920 × 1080",
      ratio: "16x9"
    },
    {
      id: "biome-forest",
      title: "Swallowed Forest",
      category: "world",
      kind: "Environment",
      src: null,
      label: "BIOME — FOREST",
      dims: "1200 × 900",
      ratio: "4x3"
    },
    {
      id: "biome-sea",
      title: "Sunless Sea",
      category: "world",
      kind: "Environment",
      src: null,
      label: "BIOME — SEA",
      dims: "1200 × 900",
      ratio: "4x3"
    },
    {
      id: "class-lineup",
      title: "Class Lineup — Pixel Sprites",
      category: "characters",
      kind: "Pixel art",
      span: "full",
      src: null,
      label: "CLASS SPRITE LINEUP",
      dims: "source 16 × 16 per sprite",
      ratio: "8x3",
      pixelArt: true
    },
    {
      id: "spellblade-full-art",
      title: "Spellblade — Full Art",
      category: "characters",
      kind: "Character art",
      src: null,
      label: "SPELLBLADE FULL ART",
      dims: "1200 × 1600",
      ratio: "3x4"
    },
    {
      id: "idle-cycle",
      title: "Idle Cycle — Side Facing",
      category: "animations",
      kind: "Animated WebP",
      src: null,
      label: "IDLE ANIMATION",
      dims: "16 × 16 per frame",
      ratio: "1x1",
      pixelArt: true
    },
    {
      id: "anchor-concept",
      title: "Anchor — Concept Study",
      category: "concept",
      kind: "Concept art",
      src: null,
      label: "ANCHOR CONCEPT",
      dims: "1920 × 1080",
      ratio: "16x9"
    },
    {
      id: "safe-space-screenshot",
      title: "Safe Space — Interior",
      category: "screenshots",
      kind: "Screenshot",
      src: null,
      label: "GAMEPLAY SCREENSHOT",
      dims: "1920 × 1080",
      ratio: "16x9"
    },
    {
      id: "settlement-below",
      title: "Settlement Below",
      category: "world",
      kind: "Environment",
      span: "wide",
      src: null,
      label: "SETTLEMENT BELOW",
      dims: "1920 × 1080",
      ratio: "16x9"
    },
    {
      id: "combat-loop-gif",
      title: "Combat Loop",
      category: "animations",
      kind: "Animated WebP",
      src: null,
      label: "COMBAT LOOP CAPTURE",
      dims: "1280 × 720",
      ratio: "16x9"
    },
    {
      id: "ruins-concept",
      title: "Ruins — Concept Study",
      category: "concept",
      kind: "Concept art",
      src: null,
      label: "RUINS CONCEPT",
      dims: "1200 × 900",
      ratio: "4x3"
    }
  ];
})(window);
