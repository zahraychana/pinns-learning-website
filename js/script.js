
(() => {
  "use strict";

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function decodeHash(hash = window.location.hash) {
    try {
      return decodeURIComponent(hash.replace(/^#/, ""));
    } catch {
      return "";
    }
  }

  /* Navbar menggunakan halaman aktif, bukan posisi scroll. */

  function initializeNavigation() {
    const navigation = document.getElementById("primary-navigation");
    const toggle = document.getElementById("nav-toggle");
    const header = document.getElementById("site-header");
    const links = [
      ...document.querySelectorAll(".nav-link[data-page-target]")
    ];

    const pageByFile = {
      "index.html": "beranda",
      "materi.html": "materi",
      "latihan.html": "latihan",
      "reference.html": "referensi"
    };

    const filename = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

    const currentPage = document.body.dataset.page || pageByFile[filename];

    links.forEach((link) => {
      const active = link.dataset.pageTarget === currentPage;

      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (!navigation || !toggle || !header) return;

    const mobile = window.matchMedia("(max-width: 640px)");

    function setMenuOpen(open, restoreFocus = false) {
      const expanded = mobile.matches && open;

      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute(
        "aria-label",
        expanded ? "Tutup menu utama" : "Buka menu utama"
      );

      if (
        !expanded &&
        mobile.matches &&
        (restoreFocus || navigation.contains(document.activeElement))
      ) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", () => {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");

      if (!link || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (
        event.target instanceof Node &&
        !header.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("focusin", (event) => {
      if (
        event.target instanceof Node &&
        !header.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        event.preventDefault();
        setMenuOpen(false, true);
      }
    });

    function handleBreakpointChange() {
      const focused = document.activeElement;

      setMenuOpen(false);

      if (mobile.matches && navigation.contains(focused)) {
        toggle.focus();
      } else if (!mobile.matches && focused === toggle) {
        navigation.querySelector('[aria-current="page"]')?.focus();
      }
    }

    if (mobile.addEventListener) {
      mobile.addEventListener("change", handleBreakpointChange);
    } else {
      mobile.addListener(handleBreakpointChange);
    }

    window.addEventListener("pageshow", () => setMenuOpen(false));

    setMenuOpen(false);

    // Hamburger ditampilkan setelah pengendalinya tersedia.
    document.documentElement.classList.add("js-ready");
  }

  /* Satu topik terlihat; isi di dalam topik tetap ditampilkan lengkap. */

  function initializeViewer(config) {
    const root = document.querySelector(config.rootSelector);
    if (!root) return;

    const selector = root.querySelector(config.selector);
    const panels = [...root.querySelectorAll(config.panelSelector)];
    const controls = [...root.querySelectorAll(config.controlsSelector)];

    const previous = root.querySelector(
      `[data-action="${config.previousAction}"]`
    );

    const next = root.querySelector(
      `[data-action="${config.nextAction}"]`
    );

    const relatedLink = root.querySelector(config.relatedLinkSelector);

    if (!selector || panels.length === 0) return;

    let currentIndex = 0;
    let lastHash = null;
    let scrollFrame = null;

    function resolveTarget(id) {
      if (!id) return null;

      const target = document.getElementById(id);
      const panel = target?.closest(config.panelSelector);
      const index = panels.indexOf(panel);

      return index < 0 ? null : { index, target };
    }

    const initialTarget =
      resolveTarget(root.getAttribute(config.initialAttribute)) ||
      resolveTarget(selector.value) ||
      { index: 0, target: panels[0] };

    function showPanel(index) {
      currentIndex = index;

      panels.forEach((panel, panelIndex) => {
        panel.hidden = panelIndex !== index;
      });

      const activePanel = panels[index];

      selector.value = activePanel.id;

      if (previous) {
        previous.disabled = index === 0;
        previous.setAttribute("aria-controls", activePanel.id);
      }

      if (next) {
        next.disabled = index === panels.length - 1;
        next.setAttribute("aria-controls", activePanel.id);
      }

      if (relatedLink) {
        const topic =
          activePanel.dataset.exercise ||
          activePanel.id.replace(/^topic-/, "");

        relatedLink.setAttribute(
          "href",
          `${config.relatedPage}#${config.relatedPrefix}${topic}`
        );
      }
    }

    function positionTarget(target, focus = false) {
      if (scrollFrame !== null) {
        window.cancelAnimationFrame(scrollFrame);
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;

        if (target.closest(config.panelSelector)?.hidden) return;

        if (focus && target instanceof HTMLElement) {
          if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
          }

          target.focus({ preventScroll: true });
        }

        target.scrollIntoView({
          block: "start",
          behavior: reducedMotion.matches ? "auto" : "smooth"
        });
      });
    }

    function updateHash(target) {
      const url = new URL(window.location.href);

      url.hash = target.id;

      if (url.hash === window.location.hash) return;

      try {
        window.history.pushState(null, "", url.href);
      } catch {
        // Mendukung browser yang membatasi history pada file lokal.
        window.location.hash = encodeURIComponent(target.id);
      }

      lastHash = window.location.hash;
    }

    function navigate(
      index,
      {
        target = panels[index],
        focus = true,
        scroll = true
      } = {}
    ) {
      if (index < 0 || index >= panels.length) return;

      showPanel(index);
      updateHash(target);

      if (scroll) {
        positionTarget(target, focus);
      }
    }

    function synchronizeLocation(initial = false) {
      if (!initial && lastHash === window.location.hash) return;

      lastHash = window.location.hash;

      const id = decodeHash();
      const match = resolveTarget(id);

      // Anchor seperti #main-content menggunakan perilaku browser.
      if (!match && id && document.getElementById(id)) {
        if (initial) {
          showPanel(initialTarget.index);
        }

        return;
      }

      showPanel(match ? match.index : initialTarget.index);

      if (match) {
        positionTarget(match.target, !initial);
      } else if (!initial && !id) {
        positionTarget(panels[currentIndex]);
      }
    }

    selector.addEventListener("change", () => {
      const match = resolveTarget(selector.value);

      if (match) {
        // Fokus tetap pada select untuk navigasi dengan keyboard.
        navigate(match.index, {
          focus: false,
          scroll: false
        });
      }
    });

    previous?.addEventListener("click", () => {
      navigate(currentIndex - 1);
    });

    next?.addEventListener("click", () => {
      navigate(currentIndex + 1);
    });

    document.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");

      if (!link || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      const url = new URL(link.href, document.baseURI);

      const samePage =
        url.protocol === window.location.protocol &&
        url.host === window.location.host &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search;

      if (!samePage || !url.hash) return;

      const match = resolveTarget(decodeHash(url.hash));

      if (!match) return;

      event.preventDefault();

      navigate(match.index, {
        target: match.target
      });
    });

    window.addEventListener("hashchange", () => {
      synchronizeLocation();
    });

    window.addEventListener("popstate", () => {
      synchronizeLocation();
    });

    window.addEventListener("pageshow", (event) => {
      if (
        event.persisted &&
        lastHash !== window.location.hash
      ) {
        synchronizeLocation();
      }
    });

    synchronizeLocation(true);

    controls.forEach((control) => {
      control.hidden = false;
    });
  }

  /* Salin kode asli yang sudah dimasukkan ke elemen <code>. */

  function copyUsingTextarea(text) {
    if (typeof document.execCommand !== "function") return false;

    const selection = window.getSelection();
    const savedRanges = [];

    for (
      let index = 0;
      selection && index < selection.rangeCount;
      index += 1
    ) {
      savedRanges.push(selection.getRangeAt(index).cloneRange());
    }

    const focused = document.activeElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const textarea = document.createElement("textarea");

    textarea.className = "visually-hidden";
    textarea.value = text;
    textarea.readOnly = true;
    textarea.tabIndex = -1;
    textarea.setAttribute("aria-hidden", "true");

    document.body.appendChild(textarea);

    try {
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();

      if (focused instanceof HTMLElement && focused.isConnected) {
        focused.focus({ preventScroll: true });
      }

      selection?.removeAllRanges();

      savedRanges.forEach((range) => {
        selection?.addRange(range);
      });

      if (
        window.scrollX !== scrollX ||
        window.scrollY !== scrollY
      ) {
        try {
          window.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: "instant"
          });
        } catch {
          window.scrollTo(scrollX, scrollY);
        }
      }
    }
  }

  function initializeCodeCopy() {
    document.querySelectorAll("[data-code-container]").forEach((container) => {
      const button = container.querySelector(
        '[data-action="copy-code"]'
      );

      const code = button
        ? document.getElementById(button.dataset.codeTarget)
        : null;

      const status = container
        .closest(".code-panel")
        ?.querySelector(".code-status");

      if (!button || !code || !container.contains(code)) return;

      const originalLabel = button.textContent;

      let copying = false;
      let resetTimer = null;

      function refresh() {
        const hasCode = Boolean(code.textContent.trim());

        container.hidden = !hasCode;
        button.disabled = !hasCode || copying;
      }

      refresh();

      if (typeof MutationObserver !== "undefined") {
        new MutationObserver(refresh).observe(code, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }

      button.addEventListener("click", async () => {
        const text = code.textContent;

        if (copying || !text.trim()) return;

        copying = true;

        window.clearTimeout(resetTimer);

        button.disabled = true;
        button.setAttribute("aria-busy", "true");

        if (status) {
          status.textContent = "";
        }

        let copied = false;

        try {
          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(text);
              copied = true;
            } catch {
              copied = false;
            }
          }

          if (!copied) {
            copied = copyUsingTextarea(text);
          }

          button.textContent = copied ? "Tersalin" : originalLabel;

          if (status) {
            status.textContent = copied
              ? "Kode berhasil disalin."
              : "Kode belum dapat disalin. Pilih teks kode lalu gunakan Ctrl+C atau Command+C.";
          }
        } finally {
          copying = false;

          button.removeAttribute("aria-busy");
          refresh();

          resetTimer = window.setTimeout(() => {
            button.textContent = originalLabel;
          }, 2500);
        }
      });
    });
  }

  function initialize() {
    initializeNavigation();

    initializeViewer({
      rootSelector: "[data-material-viewer]",
      selector: "[data-material-selector]",
      panelSelector: "[data-material-topic]",
      controlsSelector: "[data-material-controls]",
      initialAttribute: "data-initial-topic",
      previousAction: "previous-topic",
      nextAction: "next-topic",
      relatedLinkSelector: ".button--exercise",
      relatedPage: "latihan.html",
      relatedPrefix: "latihan-"
    });

    initializeViewer({
      rootSelector: "[data-exercise-viewer]",
      selector: "[data-exercise-selector]",
      panelSelector: "[data-exercise]",
      controlsSelector: "[data-exercise-controls]",
      initialAttribute: "data-initial-exercise",
      previousAction: "previous-exercise",
      nextAction: "next-exercise",
      relatedLinkSelector: ".button--material",
      relatedPage: "materi.html",
      relatedPrefix: "topic-"
    });

    initializeCodeCopy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();