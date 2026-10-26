/* ==========================================================================
   ENDLESS BELOW — devlog rendering
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.devlog. Newest first, tag filtering, expandable
   article bodies and an optional gallery wired to the shared lightbox.
   Entries flagged `mock: true` render a visible badge.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var entries = ((global.EB_DATA || {}).devlog || []).slice();
  if (!EB) return;

  var h = EB.h;
  var activeTag = "all";

  /* Newest first, regardless of authoring order in the data file. */
  entries.sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date));
  });

  /* ---- Article body blocks -------------------------------------------- */
  function block(b) {
    switch (b.type) {
      case "h3":
        return h("h3", { text: b.text });
      case "ul":
        return h("ul", {
          children: (b.items || []).map(function (item) {
            return h("li", { text: item });
          })
        });
      case "quote":
        return h("blockquote", {
          class: "pullquote",
          children: [
            h("p", { text: b.text }),
            b.cite ? h("cite", { text: b.cite }) : null
          ]
        });
      default:
        return h("p", { text: b.text });
    }
  }

  function gallery(items) {
    if (!items || !items.length) return null;

    var wrap = h("div", { class: "devlog-gallery" });

    items.forEach(function (item, index) {
      var btn = h("button", {
        class: "media-item",
        attrs: {
          type: "button",
          "aria-label": "Open " + (item.title || item.label) + " in viewer"
        },
        children: [
          h("span", { class: "media-item__art", children: EB.figure(item) }),
          h("span", {
            class: "media-item__bar",
            children: [
              h("span", { class: "media-item__title", text: item.label }),
              h("span", { class: "media-item__kind", text: item.dims })
            ]
          })
        ]
      });

      btn.addEventListener("click", function () {
        EB.lightbox.open(items, index);
      });

      wrap.appendChild(btn);
    });

    return wrap;
  }

  /* ---- Entry ----------------------------------------------------------- */
  function entryNode(entry) {
    var bodyId = "devlog-body-" + entry.id;

    var article = h("div", {
      class: "devlog-entry__article prose",
      attrs: { id: bodyId, hidden: true },
      children: (entry.body || []).map(block).concat([gallery(entry.gallery)])
    });

    var toggle = h("button", {
      class: "btn btn--sm",
      attrs: {
        type: "button",
        "aria-expanded": "false",
        "aria-controls": bodyId
      },
      children: [
        h("span", { text: "Read entry" }),
        h("span", { class: "caret", attrs: { "aria-hidden": "true" }, text: "↓" })
      ]
    });

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      article.hidden = open;
      toggle.firstChild.textContent = open ? "Read entry" : "Close entry";
      toggle.lastChild.textContent = open ? "↓" : "↑";
    });

    var node = h("article", {
      class: "devlog-entry reveal",
      attrs: { id: entry.id },
      children: [
        h("div", {
          class: "devlog-entry__media",
          children: h("div", {
            class: "art-mount",
            children: EB.figure(entry.hero)
          })
        }),
        h("div", {
          class: "devlog-entry__content",
          children: [
            h("div", {
              class: "devlog-entry__meta",
              children: [
                h("time", {
                  attrs: { datetime: entry.date },
                  text: EB.formatDate(entry.date)
                }),
                entry.mock ? EB.mockBadge("Mock entry") : null
              ]
            }),
            h("h2", { class: "devlog-entry__title", text: entry.title }),
            h("p", { class: "devlog-entry__summary", text: entry.summary }),
            h("ul", {
              class: "tag-list",
              style: { "margin-top": "1rem" },
              children: (entry.tags || []).map(function (tag) {
                return h("li", { children: h("span", { class: "tag", text: tag }) });
              })
            }),
            h("div", { class: "devlog-entry__foot", children: toggle })
          ]
        }),
        article
      ]
    });

    return h("li", { attrs: { "data-tags": (entry.tags || []).join("|") }, children: node });
  }

  /* ---- Tag filter ------------------------------------------------------ */
  function uniqueTags() {
    var seen = [];
    entries.forEach(function (entry) {
      (entry.tags || []).forEach(function (tag) {
        if (seen.indexOf(tag) === -1) seen.push(tag);
      });
    });
    return seen.sort();
  }

  function applyFilter(list, emptyState) {
    var shown = 0;
    EB.$$("li", list).forEach(function (li) {
      var tags = (li.getAttribute("data-tags") || "").split("|");
      var match = activeTag === "all" || tags.indexOf(activeTag) !== -1;
      li.hidden = !match;
      if (match) shown++;
    });
    if (emptyState) emptyState.hidden = shown > 0;
  }

  function filters(list, emptyState) {
    var bar = EB.$("[data-devlog-filters]");
    if (!bar) return;

    EB.clear(bar);
    bar.appendChild(h("span", { class: "filters__label", text: "Filter" }));

    var tabs = h("div", { class: "filters__tabs" });

    var options = [{ id: "all", label: "All" }].concat(
      uniqueTags().map(function (tag) {
        return { id: tag, label: tag };
      })
    );

    options.forEach(function (option) {
      var btn = h("button", {
        class: "filter-btn",
        text: option.label,
        attrs: {
          type: "button",
          "aria-pressed": option.id === activeTag ? "true" : "false"
        }
      });

      btn.addEventListener("click", function () {
        activeTag = option.id;
        EB.$$(".filter-btn", bar).forEach(function (other) {
          other.setAttribute("aria-pressed", other === btn ? "true" : "false");
        });
        applyFilter(list, emptyState);
      });

      tabs.appendChild(btn);
    });

    bar.appendChild(tabs);
  }

  /* ---- Home preview (latest two) -------------------------------------- */
  function mountPreview() {
    var root = EB.$("[data-devlog-preview]");
    if (!root || !entries.length) return;

    var latest = entries.slice(0, 2);
    EB.clear(root);
    EB.append(
      root,
      latest.map(function (entry) {
        return h("article", {
          class: "home-devlog__card frame reveal",
          children: [
            EB.figure(entry.hero),
            h("div", {
              class: "home-devlog__body",
              children: [
                h("div", {
                  class: "devlog-entry__meta",
                  children: [
                    h("time", {
                      attrs: { datetime: entry.date },
                      text: EB.formatDate(entry.date)
                    }),
                    entry.mock ? EB.mockBadge("Mock entry") : null
                  ]
                }),
                h("h3", { text: entry.title }),
                h("p", { text: entry.summary }),
                h("a", {
                  class: "btn btn--sm",
                  attrs: { href: "devlog.html#" + entry.id },
                  text: "Read more"
                })
              ]
            })
          ]
        });
      })
    );
    EB.scanReveal();
  }

  /* ---- Mount ----------------------------------------------------------- */
  function mount() {
    mountPreview();

    var list = EB.$("[data-devlog-list]");
    if (!list || !entries.length) return;

    EB.clear(list);
    EB.append(list, entries.map(entryNode));

    var emptyState = h("p", {
      class: "empty-state",
      attrs: { hidden: true },
      text: "No entries with that tag yet."
    });
    list.parentNode.insertBefore(emptyState, list.nextSibling);

    filters(list, emptyState);

    /* Entries are created after main.js' first reveal pass. */
    EB.scanReveal();

    /* Open an entry directly when linked, e.g. devlog.html#building-the-abyss */
    var hash = (global.location.hash || "").replace("#", "");
    if (hash) {
      var target = global.document.getElementById(hash);
      if (target) {
        var toggle = EB.$(".devlog-entry__foot .btn", target);
        if (toggle) toggle.click();
        target.scrollIntoView({ behavior: EB.reduceMotion ? "auto" : "smooth" });
      }
    }
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
