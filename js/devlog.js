/* ==========================================================================
   ENDLESS BELOW — devlog index + home preview
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.devlog generated from content/devlog/*.md.
   Newest first, tag filtering. Read entry expands the post in place.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var entries = ((global.EB_DATA || {}).devlog || []).slice();
  if (!EB) return;

  var h = EB.h;
  var activeTag = "all";
  var archiveRoot = null;
  var entryObserver = null;
  var activeEntryId = "";

  entries.sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date));
  });

  function entryHref(entry) {
    return "/devlog/#" + entry.id;
  }

  function entryTags(entry) {
    if (entry.tags && entry.tags.length) return entry.tags;
    return entry.tag ? [entry.tag] : [];
  }

  function heroSlot(entry) {
    if (entry.hero) return entry.hero;
    return {
      src: entry.cover || null,
      label: entry.title,
      alt: entry.title,
      dims: "cover",
      ratio: "16x9",
      pixelArt: false
    };
  }

  /* ---- Card ------------------------------------------------------------- */
  function entryNode(entry) {
    var tags = entryTags(entry);
    var bodyId = "devlog-body-" + entry.id;

    var article = h("div", {
      class: "devlog-entry__article prose",
      attrs: { id: bodyId, hidden: true }
    });
    article.innerHTML = entry.bodyHtml || "";

    var toggle = h("button", {
      class: "btn btn--sm",
      attrs: {
        type: "button",
        "aria-expanded": "false",
        "aria-controls": bodyId
      },
      children: [
        h("span", {
          class: "btn__label",
          children: [h("span", { class: "btn__copy", text: "Read entry" })]
        })
      ]
    });

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      article.hidden = open;
      var copy = toggle.querySelector(".btn__copy");
      if (copy) copy.textContent = open ? "Read entry" : "Close entry";
    });

    var node = h("article", {
      class: "devlog-entry reveal",
      attrs: { id: entry.id },
      children: [
        h("div", {
          class: "devlog-entry__media",
          children: h("div", {
            class: "art-mount",
            children: EB.figure(heroSlot(entry))
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
                tags.length
                  ? h("ul", {
                      class: "tag-list",
                      children: tags.map(function (tag) {
                        return h("li", {
                          children: h("span", { class: "tag", text: tag })
                        });
                      })
                    })
                  : null,
                entry.mock ? EB.mockBadge("Mock entry") : null
              ]
            }),
            h("h2", { class: "devlog-entry__title", text: entry.title }),
            h("p", { class: "devlog-entry__summary", text: entry.summary }),
            h("div", { class: "devlog-entry__foot", children: toggle })
          ]
        }),
        article
      ]
    });

    return h("li", {
      attrs: { "data-tags": tags.join("|"), "data-entry-id": entry.id },
      children: node
    });
  }

  /* ---- Archive / timeline ---------------------------------------------- */
  function groupByDate(list) {
    var groups = [];
    var last = null;
    list.forEach(function (entry) {
      if (!last || last.date !== entry.date) {
        last = { date: entry.date, entries: [] };
        groups.push(last);
      }
      last.entries.push(entry);
    });
    return groups;
  }

  function setActiveEntry(id) {
    if (!archiveRoot || !id || id === activeEntryId) return;
    activeEntryId = id;
    EB.$$(".devlog-archive__link", archiveRoot).forEach(function (link) {
      var on = link.getAttribute("data-archive-id") === id;
      if (on) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "location");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function scrollToEntry(id, expand) {
    var target = global.document.getElementById(id);
    if (!target) return;
    if (expand) {
      var toggle = EB.$(".devlog-entry__foot .btn", target);
      if (toggle && toggle.getAttribute("aria-expanded") !== "true") {
        toggle.click();
      }
    }
    target.scrollIntoView({
      behavior: EB.reduceMotion ? "auto" : "smooth",
      block: "start"
    });
    setActiveEntry(id);
  }

  function bindArchiveLink(link) {
    link.addEventListener("click", function (event) {
      var id = link.getAttribute("data-archive-id");
      if (!id || !global.document.getElementById(id)) return;
      event.preventDefault();
      if (global.history && global.history.pushState) {
        global.history.pushState(null, "", "#" + id);
      } else {
        global.location.hash = id;
      }
      scrollToEntry(id, false);
    });
  }

  function mountArchive() {
    archiveRoot = EB.$("[data-devlog-archive]");
    if (!archiveRoot || !entries.length) return;

    var details = h("details", { class: "devlog-archive__details" });
    var summary = h("summary", {
      class: "devlog-archive__title",
      text: "Archive"
    });
    var body = h("div", { class: "devlog-archive__body" });

    groupByDate(entries).forEach(function (group) {
      var links = group.entries.map(function (entry) {
        var link = h("a", {
          class: "devlog-archive__link",
          text: entry.title,
          attrs: {
            href: "#" + entry.id,
            "data-archive-id": entry.id,
            "data-tags": entryTags(entry).join("|")
          }
        });
        bindArchiveLink(link);
        return h("li", { children: link });
      });

      body.appendChild(
        h("div", {
          class: "devlog-archive__group",
          attrs: { "data-archive-date": group.date },
          children: [
            h("p", {
              class: "devlog-archive__date",
              children: h("time", {
                attrs: { datetime: group.date },
                text: EB.formatDate(group.date)
              })
            }),
            h("ul", { class: "devlog-archive__posts", children: links })
          ]
        })
      );
    });

    details.appendChild(summary);
    details.appendChild(body);
    EB.clear(archiveRoot);
    archiveRoot.appendChild(details);

    var desktop = global.matchMedia("(min-width: 1025px)");
    function syncOpen() {
      if (desktop.matches) details.open = true;
    }
    syncOpen();
    if (desktop.addEventListener) desktop.addEventListener("change", syncOpen);
    else if (desktop.addListener) desktop.addListener(syncOpen);
  }

  function syncArchiveVisibility() {
    if (!archiveRoot) return;
    EB.$$("[data-archive-id]", archiveRoot).forEach(function (link) {
      var tags = (link.getAttribute("data-tags") || "").split("|");
      var match = activeTag === "all" || tags.indexOf(activeTag) !== -1;
      var item = link.parentNode;
      if (item) item.hidden = !match;
    });
    EB.$$(".devlog-archive__group", archiveRoot).forEach(function (group) {
      var shown = 0;
      EB.$$("[data-archive-id]", group).forEach(function (link) {
        if (link.parentNode && !link.parentNode.hidden) shown++;
      });
      group.hidden = shown === 0;
    });
  }

  function visibleEntryNodes(list) {
    var nodes = [];
    Array.prototype.forEach.call(list.children, function (li) {
      if (li.hidden) return;
      var article = li.querySelector(".devlog-entry");
      if (article && article.id) nodes.push(article);
    });
    return nodes;
  }

  function observeEntries(list) {
    if (entryObserver) {
      entryObserver.disconnect();
      entryObserver = null;
    }
    if (!("IntersectionObserver" in global)) {
      var first = visibleEntryNodes(list)[0];
      if (first) setActiveEntry(first.id);
      return;
    }

    var headerRaw = global.getComputedStyle(global.document.documentElement)
      .getPropertyValue("--header-h");
    var headerH = parseFloat(headerRaw) || 72;
    var ratios = {};

    entryObserver = new global.IntersectionObserver(
      function (changes) {
        changes.forEach(function (change) {
          ratios[change.target.id] = change.isIntersecting
            ? change.intersectionRatio
            : 0;
        });
        var bestId = "";
        var bestRatio = 0;
        Object.keys(ratios).forEach(function (id) {
          if (ratios[id] > bestRatio) {
            bestRatio = ratios[id];
            bestId = id;
          }
        });
        if (bestId) setActiveEntry(bestId);
      },
      {
        root: null,
        rootMargin: "-" + Math.round(headerH + 8) + "px 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    visibleEntryNodes(list).forEach(function (node) {
      entryObserver.observe(node);
    });
  }

  /* ---- Tag filter ------------------------------------------------------ */
  function uniqueTags() {
    var seen = [];
    entries.forEach(function (entry) {
      entryTags(entry).forEach(function (tag) {
        if (tag && seen.indexOf(tag) === -1) seen.push(tag);
      });
    });
    return seen.sort();
  }

  function applyFilter(list, emptyState) {
    var shown = 0;
    Array.prototype.forEach.call(list.children, function (li) {
      var tags = (li.getAttribute("data-tags") || "").split("|");
      var match = activeTag === "all" || tags.indexOf(activeTag) !== -1;
      li.hidden = !match;
      if (match) shown++;
    });
    if (emptyState) emptyState.hidden = shown > 0;
    syncArchiveVisibility();
    observeEntries(list);
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
            EB.figure(heroSlot(entry)),
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
                    entry.tag
                      ? h("span", { class: "tag", text: entry.tag })
                      : null,
                    entry.mock ? EB.mockBadge("Mock entry") : null
                  ]
                }),
                h("h3", { text: entry.title }),
                h("p", { text: entry.summary }),
                h("a", {
                  class: "btn btn--sm",
                  attrs: { href: entryHref(entry) },
                  children: [
                    h("span", {
                      class: "btn__label",
                      children: [h("span", { class: "btn__copy", text: "Read more" })]
                    })
                  ]
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

    mountArchive();
    filters(list, emptyState);
    syncArchiveVisibility();
    observeEntries(list);
    EB.scanReveal();

    var hash = (global.location.hash || "").replace("#", "");
    if (hash && global.document.getElementById(hash)) {
      scrollToEntry(hash, true);
    } else if (entries[0]) {
      setActiveEntry(entries[0].id);
    }
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
