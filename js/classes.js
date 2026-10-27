/* ==========================================================================
   ENDLESS BELOW — class rendering
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.classes and renders:
     [data-classes="preview"] — home page carousel cards (links to /characters/)
     [data-classes="grid"]    — classes page grid (opens a detail modal)
   Adding a class is a data-only change; no markup edits required.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var data = (global.EB_DATA || {}).classes || [];
  if (!EB) return;

  var h = EB.h;
  var selectedVariant = {};

  function currentVariant(cls) {
    var idle = (cls.art || {}).idle || {};
    return selectedVariant[cls.id] || idle.defaultVariant || "male";
  }

  function setVariant(cls, variant) {
    selectedVariant[cls.id] = variant;
    EB.$$("[data-idle-for=\"" + cls.id + "\"]").forEach(function (el) {
      EB.applyIdleVariant(el, cls.art.idle, variant);
    });
    EB.$$("[data-gender-for=\"" + cls.id + "\"] .gender-toggle__btn").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-gender") === variant ? "true" : "false"
      );
    });
  }

  function genderToggle(cls) {
    var current = currentVariant(cls);
    var variants = ((cls.art || {}).idle || {}).variants || {};
    var options = [
      { id: "male", label: "M", available: !!variants.male },
      { id: "female", label: "F", available: !!variants.female }
    ].filter(function (opt) {
      return opt.available;
    });

    if (options.length < 2) return null;

    var group = h("div", {
      class: "gender-toggle",
      attrs: {
        role: "group",
        "aria-label": cls.name + " appearance",
        "data-gender-for": cls.id
      }
    });

    options.forEach(function (opt) {
      var btn = h("button", {
        class: "btn btn--sm gender-toggle__btn",
        attrs: {
          type: "button",
          "data-gender": opt.id,
          "aria-pressed": current === opt.id ? "true" : "false",
          "aria-label": cls.name + ", " + opt.label
        },
        text: opt.label
      });
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setVariant(cls, opt.id);
      });
      group.appendChild(btn);
    });

    return group;
  }

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
          attrs: { href: "/characters/#" + cls.id },
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
          children: (function () {
            var sprite = EB.characterIdleSprite(cls.art.idle, {
              scale: 5,
              variant: currentVariant(cls),
              label: cls.name
            });
            sprite.setAttribute("data-idle-for", cls.id);
            return [sprite, genderToggle(cls)];
          })()
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
          children: (function () {
            var sprite = EB.characterIdleSprite(cls.art.idle, {
              scale: 8,
              variant: currentVariant(cls),
              animated: true,
              label: cls.name + " idle"
            });
            sprite.setAttribute("data-idle-for", cls.id);
            return [sprite, genderToggle(cls)];
          })()
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

      /* Deep link support: /characters/#spellblade opens that class. */
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
