/* ==========================================================================
   ENDLESS BELOW — class data
   --------------------------------------------------------------------------
   ⚠ ALL PROSE IN THIS FILE IS PLACEHOLDER COPY (copyStatus: "placeholder").
     Only the class NAMES are confirmed. Roles, taglines and descriptions are
     temporary scaffolding so the layout can be built — replace them with real
     design copy before launch. Gameplay specifics are intentionally left as
     `null` so the renderer prints a visible "TBD" slot instead of fiction.

   Adding a class later: append an object here. No HTML changes required.

   Idle spritesheets live at /assets/characters/<id>/idle_{M|F}.png
     5 frames × 32px, horizontal, 160 × 32 source.
     defaultVariant is "male"; swap via art.idle.defaultVariant or a
     per-render `variant` option — no gender UI yet.
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA = (global.EB_DATA = global.EB_DATA || {});

  /* Idle spritesheets. Paths are root-relative so they resolve from /characters/. */
  function art(id) {
    return {
      idle: {
        frameSize: 32,
        frames: 5,
        duration: "1s",
        defaultVariant: "male",
        variants: {
          male: "/assets/characters/" + id + "/idle_M.png",
          female: "/assets/characters/" + id + "/idle_F.png"
        }
      }
    };
  }

  /* Gameplay detail slots. Everything undecided stays null on purpose. */
  function details(coreFantasy) {
    return {
      coreFantasy: coreFantasy, // placeholder copy
      combatStyle: null, // TBD — awaiting design
      resource: null, // TBD — awaiting design
      traits: null, // TBD — awaiting design
      abilities: null, // TBD — no invented skills
      subclasses: null // TBD — no invented subclasses
    };
  }

  DATA.classes = [
    {
      id: "archer",
      name: "Archer",
      role: "Ranged",
      accent: "#8fb37a",
      tagline: "Placeholder tagline — distance is a discipline.",
      description:
        "Placeholder description. Fights from range and reads the ground before anyone steps on it.",
      copyStatus: "placeholder",
      art: art("archer"),
      details: details("Placeholder core fantasy: the expedition's eyes, holding ground from a distance.")
    },
    {
      id: "warrior",
      name: "Warrior",
      role: "Frontline",
      accent: "#b4703a",
      tagline: "Placeholder tagline — the first one through the door.",
      description:
        "Placeholder description. Holds the front of the formation and absorbs what the dark throws first.",
      copyStatus: "placeholder",
      art: art("warrior"),
      details: details("Placeholder core fantasy: disciplined steel, the line that does not break.")
    },
    {
      id: "bard",
      name: "Bard",
      role: "Support",
      accent: "#c8a24a",
      tagline: "Placeholder tagline — someone has to remember the way back.",
      description:
        "Placeholder description. Keeps the party coordinated and carries the record of the descent.",
      copyStatus: "placeholder",
      art: art("bard"),
      details: details("Placeholder core fantasy: the keeper of the expedition's memory and morale.")
    },
    {
      id: "priest",
      name: "Priest",
      role: "Healer",
      accent: "#e6dcc6",
      tagline: "Placeholder tagline — light carried, not given.",
      description:
        "Placeholder description. Sustains the party through wounds the Abyss leaves behind.",
      copyStatus: "placeholder",
      art: art("priest"),
      details: details("Placeholder core fantasy: a borrowed light held against very old darkness.")
    },
    {
      id: "mage",
      name: "Mage",
      role: "Caster",
      accent: "#6f5fb8",
      tagline: "Placeholder tagline — study what should not be studied.",
      description:
        "Placeholder description. Shapes raw magic into force, at a cost that has to be managed.",
      copyStatus: "placeholder",
      art: art("mage"),
      details: details("Placeholder core fantasy: scholarship pointed directly at the unknown.")
    },
    {
      id: "rogue",
      name: "Rogue",
      role: "Skirmisher",
      accent: "#5f6a7a",
      tagline: "Placeholder tagline — be elsewhere when it turns.",
      description:
        "Placeholder description. Moves ahead of the party, takes openings, leaves before the answer arrives.",
      copyStatus: "placeholder",
      art: art("rogue"),
      details: details("Placeholder core fantasy: positioning as a weapon, and a way out already chosen.")
    },
    {
      id: "paladin",
      name: "Paladin",
      role: "Guardian",
      accent: "#cdb98a",
      tagline: "Placeholder tagline — an oath weighs more than armour.",
      description:
        "Placeholder description. Protects the party and anchors it when the ground stops cooperating.",
      copyStatus: "placeholder",
      art: art("paladin"),
      details: details("Placeholder core fantasy: a vow that keeps other people alive.")
    },
    {
      id: "barbarian",
      name: "Barbarian",
      role: "Bruiser",
      accent: "#9d4a3a",
      tagline: "Placeholder tagline — answer the dark louder.",
      description:
        "Placeholder description. Trades caution for momentum and breaks what blocks the route.",
      copyStatus: "placeholder",
      art: art("barbarian"),
      details: details("Placeholder core fantasy: raw momentum, carried further than it should go.")
    },
    {
      id: "warlock",
      name: "Warlock",
      role: "Occult",
      accent: "#8a4f9e",
      tagline: "Placeholder tagline — something below answered.",
      description:
        "Placeholder description. Borrows power from the Abyss and pays the interest later.",
      copyStatus: "placeholder",
      art: art("warlock"),
      details: details("Placeholder core fantasy: a bargain made somewhere very deep.")
    },
    {
      id: "spellblade",
      name: "Spellblade",
      role: "Hybrid",
      accent: "#6fb3c0",
      tagline: "Placeholder tagline — the blade is the incantation.",
      description:
        "Placeholder description. Weaves spellwork into close combat, trading reach for tempo.",
      copyStatus: "placeholder",
      art: art("spellblade"),
      details: details("Placeholder core fantasy: magic and steel resolved into a single motion.")
    }
  ];
})(window);
