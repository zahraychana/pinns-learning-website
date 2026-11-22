/* ==========================================================================
   main.js — fitur bersama untuk semua halaman PINNsWEB
   - Tema gelap/terang (disimpan di localStorage)
   - Navigasi mobile, header saat scroll, tombol kembali ke atas
   - Latar "galaksi jaringan": bintang + konstelasi neuron yang saling terhubung
   - Render rumus KaTeX, animasi muncul saat scroll, toast, confetti
   - Penyimpanan progres belajar (PINNs.store)
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Penyimpanan aman (bisa gagal di mode privat) ---------- */
  const store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem("pinns:" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("pinns:" + key, JSON.stringify(value));
      } catch {
        /* abaikan: penyimpanan tidak tersedia */
      }
    }
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  /* ---------- Confetti kecil untuk perayaan ---------- */
  function confetti() {
    if (reduceMotion.matches) return;
    const canvas = document.createElement("canvas");
    canvas.className = "confetti";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#818cf8", "#a78bfa", "#f0abfc", "#67e8f9", "#fcd34d"];
    const parts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -11 - 3,
      s: Math.random() * 6 + 3,
      r: Math.random() * Math.PI,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.32;
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (++frame < 150) requestAnimationFrame(tick);
      else canvas.remove();
    })();
  }

  /* ---------- Tema ---------- */
  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"
      );
    });
    document.dispatchEvent(new CustomEvent("pinns:themechange", { detail: theme }));
  }

  function initTheme() {
    applyTheme(root.dataset.theme === "light" ? "light" : "dark");
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem("pinns-theme", next); } catch { /* abaikan */ }
        applyTheme(next);
      });
    });
  }

  /* ---------- Navigasi ---------- */
  function initNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primary-nav");

    if (toggle && nav) {
      const setOpen = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
      nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
      window.matchMedia("(min-width: 861px)").addEventListener("change", () => setOpen(false));
    }

    const backTop = document.querySelector(".back-to-top");
    const onScroll = () => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 8);
      backTop?.classList.toggle("is-visible", y > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" }));
  }

  /* ---------- Latar galaksi + konstelasi jaringan saraf ---------- */
  function initNetworkBackground() {
    const canvas = document.getElementById("network-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, nodes = [], stars = [], raf = 0;
    let starRGB = "220,215,255", lineRGB = "167,139,250";
    const mouse = { x: -9999, y: -9999 };

    function readColors() {
      const cs = getComputedStyle(root);
      starRGB = cs.getPropertyValue("--star").trim() || starRGB;
      lineRGB = cs.getPropertyValue("--line").trim() || lineRGB;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.round((w * h) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 1.2
      }));
      stars = Array.from({ length: Math.round((w * h) / 5000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.2,
        p: Math.random() * Math.PI * 2
      }));
    }

    function draw(t = 0) {
      ctx.clearRect(0, 0, w, h);
      const dark = root.dataset.theme === "dark";

      for (const s of stars) {
        const a = (dark ? 0.55 : 0.28) + Math.sin(t / 900 + s.p) * 0.25;
        ctx.fillStyle = `rgba(${starRGB},${Math.max(0.05, a)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const maxD = Math.min(170, Math.max(110, w / 9));
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${lineRGB},${(1 - d / maxD) * (dark ? 0.32 : 0.22)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 200) {
          ctx.strokeStyle = `rgba(${lineRGB},${(1 - md / 200) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${lineRGB},${dark ? 0.9 : 0.6})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step(t) {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      draw(t);
      raf = requestAnimationFrame(step);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (reduceMotion.matches) draw(0);
      else raf = requestAnimationFrame(step);
    }

    readColors();
    resize();
    start();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); start(); }, 150);
    });
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    });
    document.addEventListener("pinns:themechange", () => { readColors(); if (reduceMotion.matches) draw(0); });
  }

  /* ---------- KaTeX ---------- */
  function renderMath(scope = document.body) {
    if (typeof window.renderMathInElement !== "function") return false;
    window.renderMathInElement(scope, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
    });
    protectFromTranslate(scope);
    return true;
  }

  /* ---------- Bahasa: Indonesia / English (mesin Google Translate) ----------
     Status bahasa disimpan di cookie "googtrans" (dibaca langsung oleh Google),
     sehingga terjemahan ikut terbawa saat berpindah halaman. Skrip Google hanya
     dimuat ketika bahasa Inggris dipilih. */
  const NO_TRANSLATE = ".katex, .katex-display, pre, code, kbd, .brand-text, .lang-toggle";

  function protectFromTranslate(scope = document) {
    scope.querySelectorAll(NO_TRANSLATE).forEach((el) => {
      el.classList.add("notranslate");
      el.setAttribute("translate", "no");
    });
  }

  function currentLang() {
    return /(?:^|;\s*)googtrans=\/id\/en(?:;|$)/.test(document.cookie) ? "en" : "id";
  }

  function setLangCookie(lang) {
    const value = lang === "en" ? "/id/en" : "";
    const tail = lang === "en" ? "; path=/" : "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Google bisa menyimpan cookie di host maupun domain induknya: tangani semuanya.
    const parts = location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join("."));
    domains.forEach((d) => {
      const domain = d ? "; domain=" + d : "";
      document.cookie = "googtrans=" + value + tail + domain;
      if (d) document.cookie = "googtrans=" + value + tail + "; domain=." + d;
    });
  }

  let gtLoading = false;
  function loadTranslator() {
    if (gtLoading || window.google?.translate?.TranslateElement) return;
    gtLoading = true;
    const host = document.createElement("div");
    host.id = "gt-host";
    host.hidden = true;
    document.body.appendChild(host);
    window.pinnsTranslateInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "id", includedLanguages: "en", autoDisplay: false },
        "gt-host"
      );
    };
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=pinnsTranslateInit";
    s.async = true;
    s.onerror = () => {
      gtLoading = false;
      setLangCookie("id");
      applyLangButton("id");
      toast("Terjemahan gagal dimuat. Periksa koneksi internet.");
    };
    document.head.appendChild(s);
  }

  function applyLangButton(lang) {
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.textContent = lang === "en" ? "EN" : "ID";
      btn.setAttribute("aria-label", lang === "en" ? "Ganti ke Bahasa Indonesia" : "Translate to English");
      btn.title = lang === "en" ? "Bahasa Indonesia" : "English";
    });
  }

  function initLang() {
    protectFromTranslate();
    const lang = currentLang();
    applyLangButton(lang);
    if (lang === "en") loadTranslator();
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        // Google paling andal membaca cookie saat halaman dimuat: simpan pilihan lalu muat ulang.
        setLangCookie(currentLang() === "en" ? "id" : "en");
        btn.disabled = true;
        location.reload();
      });
    });
  }

  function initMath() {
    if (renderMath()) {
      document.dispatchEvent(new Event("pinns:mathready"));
      return;
    }
    // Skrip KaTeX dimuat dengan defer; tunggu sampai siap.
    let tries = 0;
    const timer = setInterval(() => {
      if (renderMath() || ++tries > 40) {
        clearInterval(timer);
        document.dispatchEvent(new Event("pinns:mathready"));
      }
    }, 100);
  }

  /* ---------- Animasi muncul saat scroll ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Progres modul di beranda ---------- */
  function initHomeProgress() {
    const done = store.get("modules-done", {});
    document.querySelectorAll("[data-module-progress]").forEach((el) => {
      if (done[el.dataset.moduleProgress]) {
        el.textContent = "✓ Selesai dipelajari";
        el.hidden = false;
      }
    });
    const total = document.querySelectorAll("[data-module-progress]").length;
    const count = Object.values(done).filter(Boolean).length;
    const bar = document.querySelector("[data-home-progress]");
    if (bar && total) {
      bar.style.width = (100 * Math.min(count, total)) / total + "%";
      const label = document.querySelector("[data-home-progress-label]");
      if (label) label.textContent = `${Math.min(count, total)} dari ${total} modul selesai`;
    }
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  window.PINNs = Object.assign(window.PINNs || {}, { store, toast, confetti, renderMath });

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initLang();
    initNav();
    initNetworkBackground();
    initReveal();
    initHomeProgress();
    initYear();
    initMath();
  });
})();
