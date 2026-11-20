/* ==========================================================================
   reference.js — glosarium yang bisa dicari & difilter per modul
   ========================================================================== */
(() => {
  "use strict";

  const escapeHTML = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  document.addEventListener("DOMContentLoaded", () => {
    const list = document.querySelector("[data-glossary]");
    const input = document.getElementById("glossary-q");
    const empty = document.querySelector("[data-empty]");
    if (!list || !window.PINNS_GLOSSARY) return;

    const items = [...window.PINNS_GLOSSARY].sort((a, b) => a.t.localeCompare(b.t));
    list.innerHTML = items.map((g) => `
      <div class="glossary-item" data-m="${g.m}" data-text="${escapeHTML((g.t + " " + g.id + " " + g.d).toLowerCase())}">
        <dt>${escapeHTML(g.t)}<small>${escapeHTML(g.id)}</small></dt>
        <dd>${escapeHTML(g.d)} <span class="badge">Modul ${g.m}</span></dd>
      </div>`).join("");

    let mod = "all";
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      list.querySelectorAll(".glossary-item").forEach((el) => {
        const ok = (mod === "all" || el.dataset.m === mod) && (!q || el.dataset.text.includes(q));
        el.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    input.addEventListener("input", apply);
    const btns = [...document.querySelectorAll("[data-filter] button")];
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mod = b.dataset.v;
      apply();
    }));
  });
})();
