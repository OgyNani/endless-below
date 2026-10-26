/* ==========================================================================
   ENDLESS BELOW — patch notes
   --------------------------------------------------------------------------
   ⚠ EVERY RELEASE BELOW IS DEMO CONTENT (`mock: true`).
     v0.0.1 and v0.0.2 are fabricated examples that exist only to demonstrate
     the patch-notes layout. They describe no real build, no real schedule and
     no real changes. Remove them before publishing real notes.

   Order: newest first (the renderer also sorts by date defensively).

   Release shape — every change section is optional:
     version      — display string, e.g. "v0.0.2"
     anchor       — auto-derived from version if omitted: v0.0.2 -> "v0-0-2"
     date         — ISO 8601 (YYYY-MM-DD)
     title        — optional short release name
     headerArt    — optional image slot { src, label, dims, ratio }
     highlights   — optional array of strings
     added / changed / fixed / balance / knownIssues — optional arrays
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA = (global.EB_DATA = global.EB_DATA || {});

  DATA.patchNotes = [
    {
      version: "v0.0.2",
      anchor: "v0-0-2",
      mock: true,
      date: "2026-10-18",
      title: "Demo Release Two",
      headerArt: {
        src: null, // TODO(art): "assets/media/patch/v0-0-2.webp"
        label: "PATCH HEADER — V0.0.2",
        dims: "1600 × 600",
        ratio: "8x3"
      },
      highlights: [
        "Demo highlight. This release entry is placeholder content for layout purposes.",
        "Demo highlight. Replace with real highlights when a build actually ships."
      ],
      added: [
        "Demo entry: placeholder added item.",
        "Demo entry: placeholder added item with a slightly longer line so the list wraps and line-height can be checked at narrow widths.",
        "Demo entry: placeholder added item."
      ],
      changed: [
        "Demo entry: placeholder changed item.",
        "Demo entry: placeholder changed item."
      ],
      fixed: [
        "Demo entry: placeholder fixed item.",
        "Demo entry: placeholder fixed item."
      ],
      balance: ["Demo entry: placeholder balance item."],
      knownIssues: [
        "Demo entry: placeholder known issue.",
        "Demo entry: placeholder known issue."
      ]
    },
    {
      version: "v0.0.1",
      anchor: "v0-0-1",
      mock: true,
      date: "2026-10-04",
      title: "Demo Release One",
      // headerArt omitted on purpose — demonstrates the optional art slot.
      highlights: [
        "Demo highlight. First placeholder release used to demonstrate the layout."
      ],
      added: [
        "Demo entry: placeholder added item.",
        "Demo entry: placeholder added item."
      ],
      // `changed` and `balance` omitted on purpose — optional sections.
      fixed: ["Demo entry: placeholder fixed item."],
      knownIssues: ["Demo entry: placeholder known issue."]
    }
  ];
})(window);
