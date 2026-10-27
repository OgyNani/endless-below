/* ==========================================================================
   ENDLESS BELOW — shared runtime
   --------------------------------------------------------------------------
   Loaded on every page, before any page-specific script. Provides:
     - header scroll state + accessible mobile navigation
     - scroll reveal, light parallax, drifting motes (all motion-gated)
     - window.EB: small DOM helper + the reusable placeholder / pixel-sprite /
       modal / lightbox primitives used by the data-driven pages.
   No dependencies, classic script (works over file:// and GitHub Pages).
   ========================================================================== */

(function (global) {
  "use strict";

  var doc = global.document;
  var root = doc.documentElement;

  /* JS is available — enables the progressive-enhancement styles. */
  root.classList.remove("no-js");
  root.classList.add("js");

  var reduceMotion =
    global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     DOM helpers
     ====================================================================== */

  /**
   * Create an element.
   * @param {string} tag
   * @param {Object} [props] - class, text, attrs, dataset, style, children
   * @returns {HTMLElement}
   */
  function h(tag, props) {
    var node = doc.createElement(tag);
    if (!props) return node;

    if (props.class) node.className = props.class;
    if (props.text != null) node.textContent = String(props.text);

    if (props.attrs) {
      Object.keys(props.attrs).forEach(function (key) {
        var value = props.attrs[key];
        if (value == null || value === false) return;
        node.setAttribute(key, value === true ? "" : String(value));
      });
    }

    if (props.style) {
      Object.keys(props.style).forEach(function (key) {
        node.style.setProperty(key, props.style[key]);
      });
    }

    if (props.children) append(node, props.children);
    return node;
  }

  /**
   * Resolve a site-relative path against the document, not the stylesheet.
   * CSS `url()` inside a custom property is resolved against the file that
   * *uses* the variable (css/components.css), which would 404 a path like
   * assets/characters/... — so spritesheets must be absolute.
   */
  function toAbsoluteUrl(path) {
    if (!path) return path;
    try {
      return new URL(path, doc.baseURI).href;
    } catch (err) {
      return path;
    }
  }

  /** Append a node, array of nodes, or nothing. */
  function append(parent, children) {
    if (!children) return parent;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child == null || child === false) return;
      parent.appendChild(
        typeof child === "string" ? doc.createTextNode(child) : child
      );
    });
    return parent;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function $(selector, scope) {
    return (scope || doc).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
  }

  /**
   * Wrap button copy so hover/press can scale and shift the text without
   * stretching the 9-slice chrome.
   */
  function wrapButtonLabel(btn) {
    if (!btn || btn.querySelector(":scope > .btn__label")) return;
    var label = doc.createElement("span");
    label.className = "btn__label";
    var move = [];
    Array.prototype.slice.call(btn.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.classList &&
          (node.classList.contains("nav-toggle__bars") ||
           node.classList.contains("caret"))) {
        return;
      }
      move.push(node);
    });
    if (!move.length) return;
    move.forEach(function (node) {
      label.appendChild(node);
    });
    btn.appendChild(label);
  }

  function wrapButtonLabels(scope) {
    $$(".btn, .pixel-button, .nav-toggle", scope).forEach(wrapButtonLabel);
  }

  /* ======================================================================
     Asset primitives
     ====================================================================== */

  /**
   * Render an image slot. If `slot.src` is set we emit a real (lazy) <img>;
   * otherwise we emit a styled placeholder that states the required size.
   * This is the single swap point between placeholder art and final art.
   *
   * @param {Object} slot - { src, label, dims, ratio, alt, note, pixelArt }
   * @param {Object} [opts] - { className, eager }
   */
  function figure(slot, opts) {
    opts = opts || {};
    var extra = opts.className ? " " + opts.className : "";

    if (slot && slot.src) {
      return h("img", {
        class: (slot.pixelArt ? "pixel-art" : "asset-img") + extra,
        attrs: {
          src: slot.src,
          alt: slot.alt != null ? slot.alt : slot.label || "",
          loading: opts.eager ? "eager" : "lazy",
          decoding: "async"
        }
      });
    }

    return placeholder(slot, opts);
  }

  /**
   * Styled dark-fantasy placeholder. Always prints what belongs in the slot
   * and at which source resolution, so missing art is self-documenting.
   */
  function placeholder(slot, opts) {
    slot = slot || {};
    opts = opts || {};

    var classes = ["ph"];
    if (slot.ratio) classes.push("ph--" + slot.ratio);
    if (opts.className) classes.push(opts.className);

    var label = slot.label || "ARTWORK PENDING";

    return h("div", {
      class: classes.join(" "),
      attrs: {
        role: "img",
        "aria-label":
          "Placeholder: " + label + (slot.dims ? ", " + slot.dims : "")
      },
      children: [
        h("span", { class: "ph__label", text: label }),
        slot.dims ? h("span", { class: "ph__dims", text: slot.dims }) : null,
        slot.note ? h("span", { class: "ph__note", text: slot.note }) : null
      ]
    });
  }

  /**
   * Static pixel sprite. Source stays 16x16; CSS scales it with
   * image-rendering: pixelated at an integer multiple.
   * @param {Object} slot - { src, label, dims }
   * @param {string} [size] - "sm" | "md" | "lg" | "xl" | "2xl"
   */
  function sprite(slot, size) {
    if (!slot || !slot.src) {
      return placeholder(
        {
          label: (slot && slot.label) || "PIXEL SPRITE",
          dims: (slot && slot.dims) || "16 × 16",
          ratio: "1x1"
        },
        { className: "ph--plain pixel-slot" }
      );
    }

    return h("img", {
      class: "pixel-art pixel-art--" + (size || "md"),
      attrs: {
        src: slot.src,
        alt: slot.alt != null ? slot.alt : slot.label || "",
        loading: "lazy",
        decoding: "async",
        width: slot.width || 16,
        height: slot.height || 16
      }
    });
  }

  /**
   * Idle animation. Prefers a single animated file (WebP/GIF/APNG) when one is
   * supplied; falls back to a CSS-driven spritesheet; falls back again to the
   * static sprite. Swapping delivery is a data-only change.
   *
   * @param {Object} idle - { animated, sheet, frames, frameSize, fps }
   * @param {Object} [opts] - { scale, fallbackSprite, label }
   */
  function idleAnimation(idle, opts) {
    opts = opts || {};
    var scale = opts.scale || 8; // 16px * 8 = 128px, integer scaling

    if (idle && idle.animated) {
      return h("img", {
        class: "pixel-art",
        attrs: {
          src: idle.animated,
          alt: opts.label || "Idle animation",
          loading: "lazy",
          decoding: "async"
        },
        style: {
          width: idle.frameSize * scale + "px",
          height: idle.frameSize * scale + "px"
        }
      });
    }

    if (idle && idle.sheet) {
      return h("div", {
        class: "pixel-anim",
        attrs: {
          role: "img",
          "aria-label": opts.label || "Idle animation"
        },
        style: {
          "--px-sheet": "url(\"" + toAbsoluteUrl(idle.sheet) + "\")",
          "--px-frame": String(idle.frameSize || 16),
          "--px-frames": String(idle.frames || 4),
          "--px-fps": String(idle.fps || 6),
          "--px-scale": String(scale)
        }
      });
    }

    return sprite(opts.fallbackSprite, "lg");
  }

  /**
   * 5-frame horizontal idle spritesheet (32×32 source).
   * Default: frame 1, paused. Pass animated:true to loop immediately
   * (opened detail). Card hover is handled in CSS on .class-card.
   *
   * @param {Object} idle - { variants, defaultVariant, frameSize, frames, duration }
   * @param {Object} [opts] - { scale, variant, animated, label }
   */
  function characterIdleSprite(idle, opts) {
    opts = opts || {};
    idle = idle || {};
    var variant = opts.variant || idle.defaultVariant || "male";
    var variants = idle.variants || {};
    var sheet = variants[variant] || variants.male || variants.female;
    var scale = opts.scale || 5;
    var classes = "character-idle-sprite";
    if (opts.animated && !reduceMotion) classes += " character-idle-sprite--animated";

    if (!sheet) {
      return placeholder({
        label: opts.label || "IDLE SPRITE",
        dims: "32 × 32",
        ratio: "1x1"
      });
    }

    return h("div", {
      class: classes,
      attrs: {
        role: "img",
        "aria-label": opts.label || "Character idle",
        "data-idle-variant": variant
      },
      style: {
        "--idle-sheet": "url(\"" + toAbsoluteUrl(sheet) + "\")",
        "--idle-frame": String(idle.frameSize || 32),
        "--idle-frames": String(idle.frames || 5),
        "--idle-scale": String(scale),
        "--idle-duration": idle.duration || "1s"
      }
    });
  }

  function applyIdleVariant(node, idle, variant) {
    if (!node || !idle) return;
    var variants = idle.variants || {};
    var sheet = variants[variant] || variants.male || variants.female;
    if (!sheet) return;
    node.style.setProperty("--idle-sheet", "url(\"" + toAbsoluteUrl(sheet) + "\")");
    node.setAttribute("data-idle-variant", variant);
    node.style.backgroundPosition = "0 0";
    if (node.classList.contains("character-idle-sprite--animated")) {
      node.style.animation = "none";
      void node.offsetWidth;
      node.style.animation = "";
    }
  }

  /* ======================================================================
     Overlay base: focus trap, Escape, scroll lock, focus restore
     ====================================================================== */

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function createOverlay(config) {
    var node = config.node;
    var lastFocused = null;
    var isOpen = false;

    function trap(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      var items = $$(FOCUSABLE, node).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function open() {
      if (isOpen) return;
      lastFocused = doc.activeElement;
      node.classList.add("is-open");
      doc.body.classList.add("is-locked");
      node.addEventListener("keydown", trap);
      isOpen = true;

      var target = $$(FOCUSABLE, node)[0];
      if (target) target.focus();
    }

    function close() {
      if (!isOpen) return;
      node.classList.remove("is-open");
      doc.body.classList.remove("is-locked");
      node.removeEventListener("keydown", trap);
      isOpen = false;
      if (config.onClose) config.onClose();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    /* Click on the backdrop (but not the dialog) closes. */
    node.addEventListener("mousedown", function (event) {
      if (event.target === node) close();
    });

    return {
      node: node,
      open: open,
      close: close,
      isOpen: function () {
        return isOpen;
      }
    };
  }

  /* ---- Modal (class detail) -------------------------------------------- */
  var modal = (function () {
    var instance = null;
    var body = null;

    function build() {
      body = h("div", { class: "modal__content" });
      var dialog = h("div", {
        class: "modal__dialog",
        attrs: { role: "document" },
        children: [
          h("button", {
            class: "modal__close pixel-icon pixel-icon--close",
            attrs: { type: "button", "aria-label": "Close" }
          }),
          body
        ]
      });
      var node = h("div", {
        class: "modal",
        attrs: {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Details"
        },
        children: dialog
      });
      doc.body.appendChild(node);

      instance = createOverlay({
        node: node,
        onClose: function () {
          clear(body);
        }
      });
      $(".modal__close", node).addEventListener("click", instance.close);
      return instance;
    }

    return {
      open: function (content, label) {
        var it = instance || build();
        clear(body);
        append(body, content);
        if (label) it.node.setAttribute("aria-label", label);
        it.open();
      },
      close: function () {
        if (instance) instance.close();
      }
    };
  })();

  /* ---- Lightbox (media) ------------------------------------------------ */
  var lightbox = (function () {
    var instance = null;
    var stage = null;
    var caption = null;
    var counter = null;
    var items = [];
    var index = 0;

    function render() {
      var item = items[index];
      if (!item) return;

      clear(stage);
      append(stage, figure(item, { eager: true }));
      caption.textContent = item.title || item.label || "";
      counter.textContent = index + 1 + " / " + items.length;
    }

    function step(delta) {
      if (items.length < 2) return;
      index = (index + delta + items.length) % items.length;
      render();
    }

    function build() {
      stage = h("div", { class: "lightbox__stage" });
      caption = h("p", { class: "lightbox__caption" });
      counter = h("span", { class: "mono text-muted" });

      var prev = h("button", {
        class: "carousel__btn pixel-icon pixel-icon--left",
        attrs: { type: "button", "aria-label": "Previous item" }
      });
      var next = h("button", {
        class: "carousel__btn pixel-icon pixel-icon--right",
        attrs: { type: "button", "aria-label": "Next item" }
      });
      var close = h("button", {
        class: "btn btn--sm btn--ghost",
        text: "Close",
        attrs: { type: "button" }
      });

      var node = h("div", {
        class: "lightbox",
        attrs: {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Media viewer"
        },
        children: [
          stage,
          caption,
          h("div", {
            class: "lightbox__nav",
            children: [prev, counter, next, close]
          })
        ]
      });
      doc.body.appendChild(node);

      instance = createOverlay({ node: node });
      prev.addEventListener("click", function () {
        step(-1);
      });
      next.addEventListener("click", function () {
        step(1);
      });
      close.addEventListener("click", instance.close);
      node.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") step(-1);
        if (event.key === "ArrowRight") step(1);
      });
      return instance;
    }

    return {
      open: function (list, startIndex) {
        var it = instance || build();
        items = list || [];
        index = startIndex || 0;
        render();
        it.open();
      }
    };
  })();

  /* ======================================================================
     Header + navigation
     ====================================================================== */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;

    var toggle = $(".nav-toggle", header);

    /* Blend into the hero, firm up on scroll. */
    var onScroll = throttleFrame(function () {
      header.classList.toggle("is-scrolled", global.scrollY > 24);
    });
    onScroll();
    global.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle) return;

    function setOpen(open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("is-open"));
    });

    /* Escape closes, focus returns to the trigger. */
    header.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    doc.addEventListener("click", function (event) {
      if (!header.contains(event.target)) setOpen(false);
    });

    /* Reset when crossing back to the desktop layout. */
    var wide = global.matchMedia("(min-width: 1241px)");
    var onChange = function (event) {
      if (event.matches) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }

  /* ======================================================================
     Motion: reveal, parallax, motes
     ====================================================================== */
  var revealObserver = null;

  /**
   * Observe `.reveal` elements inside `scope` (default: document).
   * Safe to call repeatedly — page scripts call it after rendering data-driven
   * content, since those nodes do not exist during the initial pass.
   */
  function scanReveal(scope) {
    var targets = $$(".reveal", scope).filter(function (el) {
      return !el.hasAttribute("data-reveal-bound");
    });
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.setAttribute("data-reveal-bound", "");
    });

    if (reduceMotion || !("IntersectionObserver" in global)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    /* Stagger siblings slightly so grids resolve in sequence. */
    var parents = [];
    var counts = [];
    targets.forEach(function (el) {
      if (el.style.getPropertyValue("--reveal-delay")) return;
      var i = parents.indexOf(el.parentNode);
      if (i === -1) {
        parents.push(el.parentNode);
        counts.push(0);
        i = parents.length - 1;
      }
      el.style.setProperty("--reveal-delay", Math.min(counts[i] * 70, 350) + "ms");
      counts[i] += 1;
    });

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
    }

    targets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  function initParallax() {
    var layers = $$("[data-parallax]");
    if (!layers.length || reduceMotion) return;

    var onScroll = throttleFrame(function () {
      var y = global.scrollY;
      layers.forEach(function (layer) {
        var depth = parseFloat(layer.getAttribute("data-parallax")) || 0.1;
        /* Only animate while roughly on screen. */
        var rect = layer.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > global.innerHeight + 200) return;
        layer.style.transform = "translate3d(0," + (y * depth).toFixed(2) + "px,0)";
      });
    });

    onScroll();
    global.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Slow drifting motes — purely atmospheric, skipped for reduced motion. */
  function initMotes() {
    var canvas = $(".atmos__motes");
    if (!canvas || reduceMotion || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var motes = [];
    var raf = null;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      var count = Math.round(
        Math.min(46, Math.max(14, canvas.clientWidth / 34))
      );
      motes = [];
      for (var i = 0; i < count; i++) motes.push(makeMote(true));
    }

    function makeMote(scatter) {
      return {
        x: Math.random() * canvas.width,
        y: scatter ? Math.random() * canvas.height : canvas.height + 10,
        r: (Math.random() * 1.1 + 0.35) * dpr,
        vy: -(Math.random() * 0.16 + 0.04) * dpr,
        vx: (Math.random() - 0.5) * 0.07 * dpr,
        a: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.65 ? "111,179,192" : "205,192,164"
      };
    }

    function frame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        if (m.y + m.r < 0) motes[i] = makeMote(false);
        var alpha = m.a * (0.6 + 0.4 * Math.sin(t / 1400 + m.phase));
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + m.hue + "," + alpha.toFixed(3) + ")";
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = global.requestAnimationFrame(frame);
    }

    resize();
    raf = global.requestAnimationFrame(frame);

    global.addEventListener("resize", debounce(resize, 200));

    /* Stop painting when the tab is hidden. */
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) {
        if (raf) global.cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        raf = global.requestAnimationFrame(frame);
      }
    });
  }

  /* ======================================================================
     Carousel arrows (home class preview)
     ====================================================================== */
  function initCarousels() {
    $$(".carousel").forEach(function (carousel) {
      var rail = $(".carousel__rail", carousel);
      if (!rail) return;

      function stepBy(dir) {
        var first = rail.firstElementChild;
        var step = first ? first.getBoundingClientRect().width + 24 : 300;
        rail.scrollBy({
          left: dir * step,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }

      $$("[data-carousel-step]", carousel).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var dir = parseInt(btn.getAttribute("data-carousel-step"), 10) || 1;
          stepBy(dir);
        });
      });

      rail.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          stepBy(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          stepBy(-1);
        }
      });
    });
  }

  /* ======================================================================
     Small utilities
     ====================================================================== */
  function throttleFrame(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      global.requestAnimationFrame(function (t) {
        queued = false;
        fn(t);
      });
    };
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      global.clearTimeout(timer);
      timer = global.setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  /** Format an ISO date as "12 October 2026" without pulling in a library. */
  function formatDate(iso) {
    var parts = String(iso || "").split("-");
    if (parts.length !== 3) return String(iso || "");
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    var month = months[parseInt(parts[1], 10) - 1];
    if (!month) return String(iso);
    return parseInt(parts[2], 10) + " " + month + " " + parts[0];
  }

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /** Render a visible badge for mock/demo data so it is never mistaken. */
  function mockBadge(text) {
    return h("span", { class: "badge-mock", text: text || "Mock content" });
  }

  /* ======================================================================
     Public API
     ====================================================================== */
  global.EB = {
    h: h,
    append: append,
    clear: clear,
    $: $,
    $$: $$,
    figure: figure,
    placeholder: placeholder,
    sprite: sprite,
    idleAnimation: idleAnimation,
    characterIdleSprite: characterIdleSprite,
    applyIdleVariant: applyIdleVariant,
    modal: modal,
    lightbox: lightbox,
    formatDate: formatDate,
    mockBadge: mockBadge,
    scanReveal: scanReveal,
    reduceMotion: reduceMotion,
    debounce: debounce,
    throttleFrame: throttleFrame
  };

  /* ======================================================================
     Boot
     ====================================================================== */
  function initButtonLabels() {
    wrapButtonLabels(doc);
    if (typeof MutationObserver === "undefined" || !doc.body) return;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(".btn, .pixel-button, .nav-toggle")) {
            wrapButtonLabel(node);
          }
          if (node.querySelectorAll) wrapButtonLabels(node);
        });
      });
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }

  function init() {
    initHeader();
    initButtonLabels();
    scanReveal();
    initParallax();
    initMotes();
    initCarousels();
    initYear();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
