/* ==========================================================================
   ENDLESS BELOW — class rendering
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.classes and renders:
     [data-classes="preview"] — home page carousel cards (links to classes.html)
     [data-classes="grid"]    — classes page grid (opens a detail modal)
   Adding a class is a data-only change; no markup edits required.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var data = (global.EB_DATA || {}).classes || [];
  if (!EB) return;

  var h = EB.h;

  /* Accent colours come from data as hex; cards need them with alpha. */
  function hexToRgba(hex, alpha) {
    var clean = String(hex || "").replace("#", "");
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var int = parseInt(clean, 16);
    if (isNaN(int)) return "rgba(111, 95, 184, " + alpha + ")";
    return (
      "rgba(" +
      ((int >> 16) & 255) +
      ", " +
      ((int >> 8) & 255) +
      ", " +
      (int & 255) +
      ", " +
      alpha +
      ")"
    );
  }

  function accentStyle(cls) {
    return {
      "--class-accent": hexToRgba(cls.accent, 0.55),
      "--class-accent-text": cls.accent || "var(--cyan)"
    };
  }

  /**
   * One class card. `variant`:
   *   "preview" — home page, action is a link to the classes page
   *   "full"    — classes page, action is a button that opens the modal
   */
  function card(cls, variant) {
    var isPreview = variant === "preview";

    var action = isPreview
      ? h("a", {
          class: "btn btn--sm",
          attrs: { href: "classes.html#" + cls.id },
          children: [
            "View class",
            h("span", { class: "caret", attrs: { "aria-hidden": "true" }, text: "→" })
          ]
        })
      : h("button", {
          class: "btn btn--sm",
          attrs: {
            type: "button",
            "data-class-open": cls.id,
            "aria-label": "View " + cls.name + " details"
          },
          children: [
            "View class",
            h("span", { class: "caret", attrs: { "aria-hidden": "true" }, text: "→" })
          ]
        });

    return h("article", {
      /* Preview cards live in a horizontally scrolled rail where an
         intersection-based reveal would keep off-screen cards hidden. */
      class: "class-card" + (isPreview ? "" : " reveal"),
      style: accentStyle(cls),
      attrs: { id: isPreview ? null : "class-" + cls.id },
      children: [
        h("div", {
          class: "class-card__art",
          children: [
            EB.figure(cls.art.portrait),
            /* Idle animation sits over the art. 16px source at 4x = 64px. */
            h("div", {
              class: "class-card__sprite",
              children: EB.idleAnimation(cls.art.idle, {
                scale: 4,
                fallbackSprite: cls.art.sprite,
                label: cls.name + " idle animation (placeholder)"
              })
            })
          ]
        }),
        h("div", {
          class: "class-card__body",
          children: [
            h("p", { class: "class-card__role", text: cls.role }),
            h("h3", { class: "class-card__name", text: cls.name }),
            h("p", { class: "class-card__desc", text: cls.description }),
            h("div", { class: "class-card__foot", children: action })
          ]
        })
      ]
    });
  }

  /* ---- Detail panel (rendered into the shared modal) ------------------- */
  function metaRow(label, value) {
    return h("div", {
      class: "meta-list__row",
      children: [
        h("dt", { text: label }),
        h("dd", {
          children: value
            ? h("span", { text: value })
            : h("span", { class: "tbd", text: "Awaiting design" })
        })
      ]
    });
  }

  function section(title, body) {
    return h("section", {
      class: "class-detail__section",
      children: [h("h4", { text: title }), body]
    });
  }

  function detail(cls) {
    var d = cls.details || {};

    var traits = Array.isArray(d.traits) && d.traits.length
      ? h("ul", {
          class: "trait-list",
          children: d.traits.map(function (trait) {
            return h("li", { children: h("span", { class: "tag", text: trait }) });
          })
        })
      : h("span", { class: "tbd", text: "Awaiting design" });

    return h("div", {
      class: "class-detail",
      style: accentStyle(cls),
      children: [
        h("div", {
          class: "class-detail__art",
          children: [
            EB.figure(cls.art.fullArt, { eager: true }),
            h("div", {
              class: "class-detail__sprite",
              children: [
                EB.idleAnimation(cls.art.idle, {
                  scale: 6,
                  fallbackSprite: cls.art.sprite,
                  label: cls.name + " idle animation (placeholder)"
                }),
                h("p", {
                  class: "class-detail__sprite-label",
                  text:
                    "Idle · " +
                    (cls.art.idle.direction || "side") +
                    " · " +
                    cls.art.idle.frameSize +
                    "×" +
                    cls.art.idle.frameSize +
                    " source"
                })
              ]
            })
          ]
        }),
        h("div", {
          class: "class-detail__body",
          children: [
            h("p", { class: "eyebrow", text: "Base class · " + cls.role }),
            h("h2", { class: "class-detail__name", text: cls.name }),
            h("p", { class: "class-detail__tagline", text: cls.tagline }),
            h("p", { text: cls.description }),
            h("dl", {
              class: "meta-list class-detail__section",
              children: [
                metaRow("Core Fantasy", d.coreFantasy),
                metaRow("Combat Style", d.combatStyle),
                metaRow("Class Resource", d.resource)
              ]
            }),
            section("Signature Traits", traits),
            section(
              "Abilities",
              Array.isArray(d.abilities) && d.abilities.length
                ? h("ul", {
                    children: d.abilities.map(function (a) {
                      return h("li", { text: a });
                    })
                  })
                : h("span", { class: "tbd", text: "Not yet announced" })
            ),
            section(
              "Subclasses",
              Array.isArray(d.subclasses) && d.subclasses.length
                ? h("ul", {
                    children: d.subclasses.map(function (s) {
                      return h("li", { text: s });
                    })
                  })
                : h("span", { class: "tbd", text: "Not yet announced" })
            ),
            h("p", {
              class: "mono text-muted",
              style: { "margin-top": "2rem" },
              text: "Placeholder copy — class details are not final."
            })
          ]
        })
      ]
    });
  }

  function findClass(id) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === id) return data[i];
    }
    return null;
  }

  function openDetail(id) {
    var cls = findClass(id);
    if (!cls) return;
    EB.modal.open(detail(cls), cls.name + " — class details");
    if (global.history && global.history.replaceState) {
      global.history.replaceState(null, "", "#" + cls.id);
    }
  }

  /* ---- Mount ----------------------------------------------------------- */
  function mount() {
    if (!data.length) return;

    var preview = EB.$('[data-classes="preview"]');
    if (preview) {
      EB.clear(preview);
      EB.append(
        preview,
        data.map(function (cls) {
          return card(cls, "preview");
        })
      );
    }

    var grid = EB.$('[data-classes="grid"]');
    if (grid) {
      EB.clear(grid);
      EB.append(
        grid,
        data.map(function (cls) {
          return card(cls, "full");
        })
      );

      grid.addEventListener("click", function (event) {
        var trigger = event.target.closest("[data-class-open]");
        if (!trigger) return;
        openDetail(trigger.getAttribute("data-class-open"));
      });

      function openFromHash() {
        var hash = (global.location.hash || "").replace("#", "");
        if (hash && findClass(hash)) openDetail(hash);
      }

      /* Deep link support: classes.html#spellblade opens that class. */
      openFromHash();
      global.addEventListener("hashchange", openFromHash);
    }

    var count = EB.$("[data-class-count]");
    if (count) count.textContent = String(data.length);

    /* Cards are created after main.js' first pass, so observe them now. */
    EB.scanReveal();
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
