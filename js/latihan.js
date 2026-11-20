/* ==========================================================================
   latihan.js — tab latihan (dengan dukungan URL #ex-1 … #ex-quiz & keyboard)
   dan lightbox untuk memperbesar grafik hasil.
   ========================================================================== */
(() => {
  "use strict";

  function initTabs() {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));

    function select(i, { focus = false, updateHash = true } = {}) {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
      if (updateHash) history.replaceState(null, "", "#" + panels[i].id);
    }

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (dir) { e.preventDefault(); select((i + dir + tabs.length) % tabs.length, { focus: true }); }
        if (e.key === "Home") { e.preventDefault(); select(0, { focus: true }); }
        if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, { focus: true }); }
      });
    });

    const fromHash = () => {
      const i = panels.findIndex((p) => "#" + p.id === location.hash);
      if (i >= 0) select(i, { updateHash: false });
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  function initLightbox() {
    const box = document.querySelector(".lightbox");
    if (!box) return;
    const img = box.querySelector("img");
    const cap = box.querySelector("p");
    let opener = null;
    const close = () => { box.hidden = true; opener?.focus(); };
    document.querySelectorAll("[data-lightbox]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.querySelector("img");
        img.src = src.src;
        img.alt = src.alt;
        cap.textContent = btn.closest("figure")?.querySelector("figcaption")?.textContent || src.alt;
        opener = btn;
        box.hidden = false;
        box.querySelector("[data-close]").focus();
      });
    });
    box.addEventListener("click", (e) => { if (e.target === box || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) close(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initLightbox();
  });
})();
