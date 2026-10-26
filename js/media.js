/* ==========================================================================
   ENDLESS BELOW — media gallery rendering
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.media and EB_DATA.mediaCategories.
   Category filters + the shared lightbox. Items are buttons (they trigger an
   in-page viewer rather than navigating), and the lightbox is keyboard
   closable with Escape and navigable with the arrow keys.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var dataSet = global.EB_DATA || {};
  var items = dataSet.media || [];
  var categories = dataSet.mediaCategories || [{ id: "all", label: "All" }];
  if (!EB) return;

  var h = EB.h;
  var active = "all";

  function visibleItems() {
    return items.filter(function (item) {
      return active === "all" || item.category === active;
    });
  }

  function itemNode(item) {
    var span = item.span === "wide" ? " media-item--wide" : item.span === "full" ? " media-item--full" : "";

    var btn = h("button", {
      class: "media-item reveal" + span,
      attrs: {
        type: "button",
        "data-media-id": item.id,
        "aria-label": "Open " + item.title + " in the media viewer"
      },
      children: [
        h("span", { class: "media-item__art", children: EB.figure(item) }),
        h("span", {
          class: "media-item__zoom",
          attrs: { "aria-hidden": "true" },
          text: "Expand"
        }),
        h("span", {
          class: "media-item__bar",
          children: [
            h("span", { class: "media-item__title", text: item.title }),
            h("span", { class: "media-item__kind", text: item.kind })
          ]
        })
      ]
    });

    btn.addEventListener("click", function () {
      var list = visibleItems();
      var index = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === item.id) {
          index = i;
          break;
        }
      }
      EB.lightbox.open(list, index);
    });

    return btn;
  }

  function renderGrid(grid, emptyState) {
    EB.clear(grid);
    var list = visibleItems();
    EB.append(grid, list.map(itemNode));
    if (emptyState) emptyState.hidden = list.length > 0;

    /* Freshly created nodes need a reveal pass of their own. */
    EB.scanReveal(grid);
  }

  function renderFilters(bar, grid, emptyState) {
    EB.clear(bar);
    bar.appendChild(h("span", { class: "filters__label", text: "Filter" }));

    categories.forEach(function (category) {
      var btn = h("button", {
        class: "filter-btn",
        text: category.label,
        attrs: {
          type: "button",
          "aria-pressed": category.id === active ? "true" : "false"
        }
      });

      btn.addEventListener("click", function () {
        active = category.id;
        EB.$$(".filter-btn", bar).forEach(function (other) {
          other.setAttribute("aria-pressed", other === btn ? "true" : "false");
        });
        renderGrid(grid, emptyState);
      });

      bar.appendChild(btn);
    });
  }

  function mount() {
    var grid = EB.$("[data-media-grid]");
    if (!grid || !items.length) return;

    var emptyState = h("p", {
      class: "empty-state",
      attrs: { hidden: true },
      text: "Nothing in this category yet."
    });
    grid.parentNode.insertBefore(emptyState, grid.nextSibling);

    renderGrid(grid, emptyState);

    var bar = EB.$("[data-media-filters]");
    if (bar) renderFilters(bar, grid, emptyState);

    var count = EB.$("[data-media-count]");
    if (count) count.textContent = String(items.length);
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
