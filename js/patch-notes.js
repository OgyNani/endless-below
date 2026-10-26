/* ==========================================================================
   ENDLESS BELOW — patch notes rendering
   --------------------------------------------------------------------------
   Consumes window.EB_DATA.patchNotes. Renders a sticky version index and one
   section per release, each with a stable anchor id so single versions can be
   linked directly: patch-notes.html#v0-0-2
   Every change group is optional and only rendered when present.
   ========================================================================== */

(function (global) {
  "use strict";

  var EB = global.EB;
  var releases = ((global.EB_DATA || {}).patchNotes || []).slice();
  if (!EB) return;

  var h = EB.h;

  releases.sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date));
  });

  /* Section order is fixed so readers always scan in the same sequence. */
  var GROUPS = [
    { key: "added", label: "Added", modifier: "added" },
    { key: "changed", label: "Changed", modifier: "changed" },
    { key: "fixed", label: "Fixed", modifier: "fixed" },
    { key: "balance", label: "Balance", modifier: "balance" },
    { key: "knownIssues", label: "Known Issues", modifier: "known" }
  ];

  function anchorFor(release) {
    return (
      release.anchor ||
      String(release.version).toLowerCase().replace(/[^a-z0-9]+/g, "-")
    );
  }

  function changeGroup(group, items) {
    return h("section", {
      class: "change-group change-group--" + group.modifier,
      children: [
        h("h3", {
          class: "change-group__title",
          children: [
            h("span", { text: group.label }),
            h("span", { class: "change-group__count", text: items.length })
          ]
        }),
        h("ul", {
          children: items.map(function (item) {
            return h("li", { text: item });
          })
        })
      ]
    });
  }

  function releaseNode(release) {
    var id = anchorFor(release);

    var groups = GROUPS.filter(function (group) {
      var items = release[group.key];
      return Array.isArray(items) && items.length;
    }).map(function (group) {
      return changeGroup(group, release[group.key]);
    });

    return h("article", {
      class: "release reveal",
      attrs: { id: id, "aria-labelledby": "heading-" + id },
      children: [
        h("header", {
          class: "release__head",
          children: [
            h("h2", {
              class: "release__version",
              attrs: { id: "heading-" + id },
              text: release.version
            }),
            release.title
              ? h("span", { class: "release__date", text: release.title })
              : null,
            h("time", {
              class: "release__date",
              attrs: { datetime: release.date },
              text: EB.formatDate(release.date)
            }),
            release.mock ? EB.mockBadge("Demo release") : null,
            h("a", {
              class: "release__permalink",
              attrs: {
                href: "#" + id,
                "aria-label": "Permalink to " + release.version
              },
              text: "#" + id
            })
          ]
        }),
        release.headerArt
          ? h("div", {
              class: "release__header-art art-mount",
              children: EB.figure(release.headerArt)
            })
          : null,
        Array.isArray(release.highlights) && release.highlights.length
          ? h("section", {
              class: "release__highlights",
              children: [
                h("h3", { text: "Highlights" }),
                h("ul", {
                  children: release.highlights.map(function (item) {
                    return h("li", { text: item });
                  })
                })
              ]
            })
          : null,
        groups.length
          ? h("div", { children: groups })
          : h("p", { class: "empty-state", text: "No recorded changes." })
      ]
    });
  }

  function indexNode() {
    return h("ol", {
      children: releases.map(function (release) {
        var id = anchorFor(release);
        return h("li", {
          children: h("a", {
            attrs: { href: "#" + id, "data-version-link": id },
            children: [
              h("span", { text: release.version }),
              h("time", {
                attrs: { datetime: release.date },
                text: release.date
              })
            ]
          })
        });
      })
    });
  }

  /* Highlight the version currently in view inside the index. */
  function trackActive() {
    if (!("IntersectionObserver" in global)) return;

    var links = EB.$$("[data-version-link]");
    if (!links.length) return;

    var observer = new IntersectionObserver(
      function (records) {
        records.forEach(function (record) {
          if (!record.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("data-version-link") === record.target.id
            );
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    EB.$$(".release").forEach(function (release) {
      observer.observe(release);
    });
  }

  function mount() {
    var list = EB.$("[data-patch-list]");
    if (!list || !releases.length) return;

    EB.clear(list);
    EB.append(list, releases.map(releaseNode));

    var index = EB.$("[data-patch-index]");
    if (index) {
      EB.clear(index);
      index.appendChild(indexNode());
    }

    /* Releases are created after main.js' first reveal pass. */
    EB.scanReveal();
    trackActive();

    /* Releases render after load, so an incoming #anchor must be re-applied. */
    var hash = (global.location.hash || "").replace("#", "");
    if (hash) {
      var target = global.document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
