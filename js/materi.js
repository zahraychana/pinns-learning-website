/* ==========================================================================
   materi.js — simulasi interaktif & navigasi halaman Materi
   1 Fungsi komposit · 2 Fungsi aktivasi · 3 Forward pass 2→2→1
   4 Ukuran matriks & parameter · 5 Bratu & bifurkasi · 6 FDM
   7 Titik kolokasi Burgers · 8 Chain rule vs beda hingga · 9 Residual invers
   + daftar isi aktif, progres baca, tandai modul selesai, diagram SVG
   ========================================================================== */
(() => {
  "use strict";
  const P = () => window.PINNs;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (v, d = 4) => (Number.isFinite(v) ? (Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : v.toFixed(d)) : "—");
  const exp = (v) => (Number.isFinite(v) ? v.toExponential(2) : "—");

  /* Pembuat kontrol slider */
  function slider(id, label, min, max, step, value) {
    return `<div class="control"><label for="${id}"><span>${label}</span><output id="${id}-out" for="${id}">${value}</output></label>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }
  function bindSlider(root, id, cb, digits = 2) {
    const input = $("#" + id, root), out = $("#" + id + "-out", root);
    const update = () => { out.textContent = Number(input.value).toFixed(digits); cb(Number(input.value)); };
    input.addEventListener("input", update);
    return { input, update, get value() { return Number(input.value); } };
  }
  function seg(name, options, active) {
    return `<div class="seg" role="group" aria-label="${name}">${options
      .map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === active}">${l}</button>`)
      .join("")}</div>`;
  }
  function bindSeg(root, cb) {
    const btns = $$(".seg button", root);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      cb(b.dataset.v);
    }));
  }
  const legend = (items) =>
    `<div class="plot-legend">${items.map(([c, t, dot]) => `<span class="${dot ? "dot" : ""}" style="--c:${c}">${t}</span>`).join("")}</div>`;

  /* ======================= 1. Fungsi komposit ======================= */
  const FUNCS = {
    sq: { tex: "x^2", f: (x) => x * x },
    inc: { tex: "x+1", f: (x) => x + 1 },
    dbl: { tex: "2x", f: (x) => 2 * x },
    sin: { tex: "\\sin x", f: Math.sin },
    tanh: { tex: "\\tanh x", f: Math.tanh },
    exp: { tex: "e^{x}", f: Math.exp }
  };
  function widgetComposite(body) {
    const opts = Object.entries(FUNCS).map(([k, v]) => `<option value="${k}">${v.tex.replace(/\\/g, "").replace("{x}", "x")}</option>`).join("");
    body.innerHTML = `<div class="widget-grid">
      <div>
        <div class="control"><label for="cf-f">Fungsi luar f(x)</label><select id="cf-f">${opts}</select></div>
        <div class="control"><label for="cf-g">Fungsi dalam g(x)</label><select id="cf-g">${opts}</select></div>
        ${slider("cf-x", "Nilai x", -2, 2, 0.1, 1)}
        <div class="calc-out" data-out></div>
      </div>
      <div><div class="plot"><canvas aria-label="Grafik f(g(x)) dan g(f(x))"></canvas></div>
      ${legend([["var(--accent)", "f(g(x))"], ["var(--accent-3)", "g(f(x))"], ["var(--pink)", "titik x terpilih", true]])}</div>
    </div>
    <p class="widget-hint">Bandingkan kedua kurva: urutan komposisi mengubah hasil. Default-nya adalah contoh slide, f(x)=x² dan g(x)=x+1.</p>`;
    $("#cf-f", body).value = "sq";
    $("#cf-g", body).value = "inc";
    const plot = new (P().Plot)($("canvas", body), { xlim: [-2, 2] });
    const out = $("[data-out]", body);
    const xs = P().linspace(-2, 2, 200);
    let xv = 1;
    function render() {
      const f = FUNCS[$("#cf-f", body).value], g = FUNCS[$("#cf-g", body).value];
      const fg = (x) => f.f(g.f(x)), gf = (x) => g.f(f.f(x));
      const clip = (v) => (Math.abs(v) > 50 ? NaN : v);
      out.innerHTML = `g(${xv.toFixed(1)}) = <span class="hl">${fmt(g.f(xv), 3)}</span><br>
        f(g(${xv.toFixed(1)})) = <span class="hl">${fmt(fg(xv), 3)}</span><br>
        g(f(${xv.toFixed(1)})) = ${fmt(gf(xv), 3)}`;
      plot.draw([
        { x: xs, y: xs.map((x) => clip(fg(x))), color: "--accent", width: 2.6 },
        { x: xs, y: xs.map((x) => clip(gf(x))), color: "--accent-3", dash: [6, 5] },
        { type: "marker", x: [xv], y: [fg(xv)], color: "--pink" }
      ]);
    }
    $("#cf-f", body).addEventListener("change", render);
    $("#cf-g", body).addEventListener("change", render);
    bindSlider(body, "cf-x", (v) => { xv = v; render(); }, 1);
    render();
  }

  /* ======================= 2. Fungsi aktivasi ======================= */
  const ACT = {
    tanh: { f: Math.tanh, d1: (z) => 1 - Math.tanh(z) ** 2, d2: (z) => { const t = Math.tanh(z); return -2 * t * (1 - t * t); } },
    sigmoid: {
      f: (z) => 1 / (1 + Math.exp(-z)),
      d1: (z) => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); },
      d2: (z) => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s) * (1 - 2 * s); }
    },
    relu: { f: (z) => Math.max(0, z), d1: (z) => (z > 0 ? 1 : 0), d2: () => 0 },
    sin: { f: Math.sin, d1: Math.cos, d2: (z) => -Math.sin(z) }
  };
  function widgetActivation(body) {
    body.innerHTML = `${seg("Pilih fungsi aktivasi", [["tanh", "tanh"], ["sigmoid", "sigmoid"], ["relu", "ReLU"], ["sin", "sin"]], "tanh")}
      <div class="plot mt-1"><canvas aria-label="Grafik fungsi aktivasi dan turunannya"></canvas></div>
      ${legend([["var(--accent)", "σ(z)"], ["var(--accent-3)", "σ′(z)"], ["var(--pink)", "σ″(z)"]])}
      <p class="widget-hint" data-note></p>`;
    const plot = new (P().Plot)($("canvas", body), { xlim: [-4, 4], ylim: [-1.6, 1.6] });
    const zs = P().linspace(-4, 4, 400);
    const notes = {
      tanh: "tanh: mulus, simetris di sekitar 0, dan σ″ tidak nol. Ideal untuk PINNs yang membutuhkan u_xx.",
      sigmoid: "sigmoid: mulus dengan output (0,1). Turunannya kecil (maks 0.25) sehingga gradien bisa melemah di jaringan dalam.",
      relu: "ReLU: σ″ = 0 di mana-mana (kecuali z=0). Akibatnya u_xx dari jaringan ReLU nyaris selalu nol, sehingga tidak cocok untuk PDE orde dua.",
      sin: "sin: mulus dan periodik; turunan berapa pun tetap tidak nol. Kadang dipakai untuk solusi berosilasi."
    };
    function render(k) {
      const a = ACT[k];
      plot.draw([
        { x: zs, y: zs.map(a.f), color: "--accent", width: 2.8 },
        { x: zs, y: zs.map(a.d1), color: "--accent-3", dash: [7, 5] },
        { x: zs, y: zs.map(a.d2), color: "--pink", dash: [2, 4], width: 2.4 }
      ]);
      $("[data-note]", body).textContent = notes[k];
    }
    bindSeg(body, render);
    render("tanh");
  }

  /* ======================= 3. Forward pass 2→2→1 ======================= */
  function widgetForward(body) {
    const params = [
      ["x1", "x₁", 1], ["x2", "x₂", 0.5],
      ["w1", "w₁", 0.5], ["w2", "w₂", -1], ["w3", "w₃", 1], ["w4", "w₄", 1], ["w5", "w₅", 1], ["w6", "w₆", -0.5],
      ["b1", "b₁", 0], ["b2", "b₂", 0], ["b3", "b₃", 0]
    ];
    body.innerHTML = `<div class="widget-grid">
      <div>
        <div class="control"><label for="fp-act">Fungsi aktivasi f</label>
          <select id="fp-act"><option value="tanh">tanh</option><option value="sigmoid">sigmoid</option><option value="relu">ReLU</option></select></div>
        <div class="slider-bank">${params.map(([k, l, v]) => slider("fp-" + k, l, -2, 2, 0.05, v)).join("")}</div>
        <button class="btn btn--ghost btn--sm" type="button" data-reset>Reset ke contoh</button>
      </div>
      <div>
        <svg class="net-svg" viewBox="0 0 520 300" role="img" aria-label="Diagram jaringan 2-2-1 dengan nilai neuron">
          <g data-edges></g><g data-nodes></g>
        </svg>
        ${legend([["var(--accent-3)", "weight positif"], ["var(--pink)", "weight negatif"]])}
        <div class="calc-out mt-1" data-out aria-live="polite"></div>
      </div>
    </div>
    <p class="widget-hint">Tebal garis sebanding dengan |w|. Nilai di dalam lingkaran adalah output neuron. Coba buat \\(y\\) mendekati 0.9 dengan mengubah \\(w_5\\) dan \\(w_6\\).</p>`;
    const nodes = { x1: [70, 90], x2: [70, 210], h1: [260, 90], h2: [260, 210], y: [450, 150] };
    const edges = [["x1", "h1", "w1"], ["x2", "h1", "w2"], ["x1", "h2", "w3"], ["x2", "h2", "w4"], ["h1", "y", "w5"], ["h2", "y", "w6"]];
    const gE = $("[data-edges]", body), gN = $("[data-nodes]", body), out = $("[data-out]", body);
    gE.innerHTML = edges.map(([a, b, w]) => {
      const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
      return `<line class="edge" data-w="${w}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text class="lbl" data-wl="${w}" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 10}"></text>`;
    }).join("");
    gN.innerHTML = Object.entries(nodes).map(([k, [x, y]]) => {
      const stroke = k.startsWith("x") ? "var(--accent-3)" : k === "y" ? "var(--pink)" : "var(--accent)";
      const name = { x1: "x₁", x2: "x₂", h1: "h₁", h2: "h₂", y: "y" }[k];
      return `<circle class="node" cx="${x}" cy="${y}" r="30" stroke="${stroke}"/><text class="val-text" data-v="${k}" x="${x}" y="${y}"></text><text class="lbl" x="${x}" y="${y + 46}">${name}</text>`;
    }).join("");

    const ctrls = {};
    const render = () => {
      const v = Object.fromEntries(Object.entries(ctrls).map(([k, c]) => [k, c.value]));
      const f = ACT[$("#fp-act", body).value].f;
      const z1 = v.w1 * v.x1 + v.w2 * v.x2 + v.b1, z2 = v.w3 * v.x1 + v.w4 * v.x2 + v.b2;
      const h1 = f(z1), h2 = f(z2);
      const z3 = v.w5 * h1 + v.w6 * h2 + v.b3, y = f(z3);
      const vals = { x1: v.x1, x2: v.x2, h1, h2, y };
      Object.entries(vals).forEach(([k, val]) => { $(`[data-v="${k}"]`, gN).textContent = val.toFixed(3); });
      edges.forEach(([, , w]) => {
        const line = $(`[data-w="${w}"]`, gE);
        line.setAttribute("stroke", v[w] >= 0 ? "var(--accent-3)" : "var(--pink)");
        line.setAttribute("stroke-width", 0.8 + Math.abs(v[w]) * 2.6);
        line.setAttribute("stroke-opacity", 0.35 + Math.min(Math.abs(v[w]), 2) * 0.3);
        $(`[data-wl="${w}"]`, gE).textContent = `${w}=${v[w].toFixed(2)}`;
      });
      out.innerHTML = `h₁ = f(${v.w1.toFixed(2)}·${v.x1.toFixed(2)} + ${v.w2.toFixed(2)}·${v.x2.toFixed(2)} + ${v.b1.toFixed(2)}) = f(${z1.toFixed(4)}) = <span class="hl">${h1.toFixed(4)}</span><br>
        h₂ = f(${v.w3.toFixed(2)}·${v.x1.toFixed(2)} + ${v.w4.toFixed(2)}·${v.x2.toFixed(2)} + ${v.b2.toFixed(2)}) = f(${z2.toFixed(4)}) = <span class="hl">${h2.toFixed(4)}</span><br>
        y  = f(${v.w5.toFixed(2)}·h₁ + ${v.w6.toFixed(2)}·h₂ + ${v.b3.toFixed(2)}) = f(${z3.toFixed(4)}) = <span class="hl">${y.toFixed(4)}</span>`;
    };
    params.forEach(([k]) => { ctrls[k] = bindSlider(body, "fp-" + k, render); });
    $("#fp-act", body).addEventListener("change", render);
    $("[data-reset]", body).addEventListener("click", () => {
      params.forEach(([k, , val]) => { ctrls[k].input.value = val; ctrls[k].update(); });
      $("#fp-act", body).value = "tanh";
      render();
    });
    render();
  }

  /* ======================= 4. Ukuran matriks & parameter ======================= */
  function widgetParams(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("pc-in", "Jumlah input", 1, 4, 1, 2)}
        ${slider("pc-layers", "Jumlah hidden layer", 1, 8, 1, 4)}
        ${slider("pc-nodes", "Node per hidden layer", 2, 64, 1, 20)}
        ${slider("pc-out", "Jumlah output", 1, 3, 1, 1)}
      </div>
      <div>
        <div class="table-wrap" style="max-height:300px;overflow:auto"><table><thead><tr><th>Layer</th><th>Ukuran W</th><th>Ukuran B</th><th>Parameter</th></tr></thead><tbody data-rows></tbody></table></div>
        <div class="stats"><div class="stat"><span>Total parameter</span><strong data-total></strong></div><div class="stat"><span>Arsitektur</span><strong data-arch-str></strong></div></div>
      </div>
    </div>`;
    const c = {};
    const render = () => {
      const nIn = c.in.value, L = c.layers.value, n = c.nodes.value, nOut = c.out.value;
      const sizes = [nIn, ...Array(L).fill(n), nOut];
      let total = 0;
      const rows = [];
      for (let l = 1; l < sizes.length; l++) {
        const p = sizes[l - 1] * sizes[l] + sizes[l];
        total += p;
        rows.push(`<tr><td>W<sub>${l}</sub>, B<sub>${l}</sub></td><td>${sizes[l - 1]} × ${sizes[l]}</td><td>1 × ${sizes[l]}</td><td>${p.toLocaleString("id-ID")}</td></tr>`);
      }
      $("[data-rows]", body).innerHTML = rows.join("");
      $("[data-total]", body).textContent = total.toLocaleString("id-ID");
      $("[data-arch-str]", body).textContent = sizes.join("–");
    };
    c.in = bindSlider(body, "pc-in", render, 0);
    c.layers = bindSlider(body, "pc-layers", render, 0);
    c.nodes = bindSlider(body, "pc-nodes", render, 0);
    c.out = bindSlider(body, "pc-out", render, 0);
    render();
  }

  /* ======================= 5. Bratu & bifurkasi ======================= */
  function widgetBratu(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("br-c", "Parameter C", 0.05, 3.7, 0.01, 2)}
        <button class="btn btn--ghost btn--sm" type="button" data-c2>Kembali ke C = 2 (slide)</button>
        <div class="stats">
          <div class="stat"><span>θ cabang bawah</span><strong data-t1></strong></div>
          <div class="stat"><span>θ cabang atas</span><strong data-t2></strong></div>
          <div class="stat"><span>max u (bawah)</span><strong data-m1></strong></div>
          <div class="stat"><span>max u (atas)</span><strong data-m2></strong></div>
        </div>
      </div>
      <div><div class="plot"><canvas aria-label="Solusi persamaan Bratu"></canvas></div>
      ${legend([["var(--accent)", "cabang bawah (solusi stabil, dipakai di slide)"], ["var(--pink)", "cabang atas"]])}
      <p class="widget-hint" data-msg aria-live="polite"></p></div>
    </div>`;
    const plot = new (P().Plot)($("canvas", body), { xlim: [0, 1], xlabel: "x", ylabel: "u(x)" });
    const xs = P().linspace(0, 1, 200);
    const render = (C) => {
      const th = P().bratuThetas(C);
      const msg = $("[data-msg]", body);
      if (!th.length) {
        plot.draw([], { ylim: [0, 5] });
        ["t1", "t2", "m1", "m2"].forEach((k) => { $(`[data-${k}]`, body).textContent = "—"; });
        msg.innerHTML = `<span class="bad">Tidak ada solusi</span> karena C = ${C.toFixed(2)} &gt; C<sub>c</sub> ≈ 3.5138. Kedua cabang sudah bertemu dan menghilang (titik balik/bifurkasi).`;
        return;
      }
      const [a, b] = th;
      plot.draw([
        { x: xs, y: xs.map((x) => P().bratuExact(x, a)), color: "--accent", width: 2.8 },
        { x: xs, y: xs.map((x) => P().bratuExact(x, b)), color: "--pink", dash: [7, 5] }
      ], { ylim: [0, Math.max(1, P().bratuExact(0.5, b) * 1.1)] });
      $("[data-t1]", body).textContent = a.toFixed(6);
      $("[data-t2]", body).textContent = b.toFixed(6);
      $("[data-m1]", body).textContent = P().bratuExact(0.5, a).toFixed(4);
      $("[data-m2]", body).textContent = P().bratuExact(0.5, b).toFixed(4);
      msg.innerHTML = Math.abs(C - 2) < 0.005
        ? "C = 2: θ cabang bawah = 0.589388, sama dengan nilai pada slide."
        : C > 3.4 ? "Kedua cabang hampir bertemu; dekat C<sub>c</sub> ≈ 3.5138 solusinya akan hilang." : "Geser C dan amati kedua solusi saling mendekat.";
    };
    const s = bindSlider(body, "br-c", render);
    $("[data-c2]", body).addEventListener("click", () => { s.input.value = 2; s.update(); });
    render(2);
  }

  /* ======================= 6. FDM ======================= */
  function widgetFDM(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("fd-n", "Jumlah subinterval n", 4, 200, 1, 100)}
        ${slider("fd-c", "Parameter C", 0.5, 3.4, 0.1, 2)}
        <div class="stats">
          <div class="stat"><span>h = 1/n</span><strong data-h></strong></div>
          <div class="stat"><span>Unknowns</span><strong data-unk></strong></div>
          <div class="stat"><span>Iterasi Newton</span><strong data-it></strong></div>
          <div class="stat"><span>Galat maks</span><strong data-err></strong></div>
        </div>
      </div>
      <div>
        <div class="plot"><canvas aria-label="Solusi FDM dan analitik"></canvas></div>
        ${legend([["var(--accent)", "solusi analitik"], ["var(--pink)", "FDM u_k", true]])}
        <div class="plot plot--short mt-1"><canvas aria-label="Galat absolut FDM"></canvas></div>
        ${legend([["var(--accent-3)", "|u_FDM − u_true|"]])}
      </div>
    </div>
    <h4>Bukti galat \\(\\mathcal O(h^2)\\)</h4>
    <div class="table-wrap"><table><thead><tr><th>n</th><th>h</th><th>Galat maks</th><th>Rasio galat (n/2 → n)</th></tr></thead><tbody data-conv></tbody></table></div>
    <p class="widget-hint">Sistem nonlinear diselesaikan dengan Newton (kasus \\(\\mu\\to0\\) dari Levenberg–Marquardt) dan Jacobian tridiagonal (algoritma Thomas). Rasio ≈ 4 menandakan galat berorde \\(h^2\\).</p>`;
    const plot = new (P().Plot)($("canvas", body), { xlim: [0, 1], xlabel: "x", ylabel: "u" });
    const errPlot = new (P().Plot)($$("canvas", body)[1], { xlim: [0, 1], xlabel: "x" });
    const xs = P().linspace(0, 1, 200);
    let n = 100, C = 2;
    function convTable() {
      const th = P().bratuThetas(C)[0];
      let prev = null;
      $("[data-conv]", body).innerHTML = [10, 20, 40, 80, 160].map((m) => {
        const r = P().solveBratuFDM(m, C);
        const e = Math.max(...r.x.map((x, i) => Math.abs(r.u[i] - P().bratuExact(x, th))));
        const row = `<tr><td>${m}</td><td>${(1 / m).toFixed(5)}</td><td>${exp(e)}</td><td>${prev ? (prev / e).toFixed(2) : "—"}</td></tr>`;
        prev = e;
        return row;
      }).join("");
    }
    function render() {
      const th = P().bratuThetas(C)[0];
      const r = P().solveBratuFDM(n, C);
      const errs = r.x.map((x, i) => Math.abs(r.u[i] - P().bratuExact(x, th)));
      plot.draw([
        { x: xs, y: xs.map((x) => P().bratuExact(x, th)), color: "--accent", width: 2.4 },
        { type: "points", x: r.x, y: r.u, color: "--pink", r: n > 60 ? 2.2 : 3.5 }
      ]);
      errPlot.draw([{ x: r.x, y: errs, color: "--accent-3", width: 2 }]);
      $("[data-h]", body).textContent = (1 / n).toFixed(5);
      $("[data-unk]", body).textContent = n - 1;
      $("[data-it]", body).textContent = r.converged ? r.iter : "gagal";
      $("[data-err]", body).textContent = exp(Math.max(...errs));
    }
    bindSlider(body, "fd-n", (v) => { n = v; render(); }, 0);
    bindSlider(body, "fd-c", (v) => { C = v; render(); convTable(); }, 1);
    render();
    convTable();
  }

  /* ======================= 7. Titik kolokasi Burgers ======================= */
  function widgetCollocation(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("co-ni", "Titik interior n_i", 10, 2000, 10, 300)}
        ${slider("co-nb", "Titik batas/awal n_b", 6, 300, 2, 60)}
        <div class="control"><span class="control-label">Cara memilih titik</span>${seg("Cara sampling", [["random", "Acak"], ["grid", "Grid"]], "random")}</div>
        <button class="btn btn--ghost btn--sm" type="button" data-resample>Acak ulang</button>
        <p class="widget-hint">Titik batas/awal dibagi rata ke tiga sisi: \\(t=0\\) (syarat awal \\(u=-\\sin\\pi x\\)), \\(x=-1\\), dan \\(x=1\\) (syarat batas \\(u=0\\)).</p>
      </div>
      <div><div class="plot plot--square"><canvas aria-label="Domain x dari -1 sampai 1 dan t dari 0 sampai 1 dengan titik kolokasi"></canvas></div>
        ${legend([["var(--accent)", "interior → MSE_i", true], ["var(--accent-3)", "awal t = 0 → MSE_b", true], ["var(--pink)", "batas x = ±1 → MSE_b", true]])}</div>
    </div>`;
    const plot = new (P().Plot)($("canvas", body), { xlim: [-1.05, 1.05], ylim: [-0.05, 1.05], xlabel: "x", ylabel: "t" });
    let ni = 300, nb = 60, mode = "random", seed = 1;
    function render() {
      const r = P().rng(seed);
      const ix = [], it = [];
      if (mode === "grid") {
        const nx = Math.max(2, Math.round(Math.sqrt(ni * 2))), nt = Math.max(2, Math.round(ni / nx));
        for (let i = 1; i <= nx; i++) for (let j = 1; j <= nt; j++) { ix.push(-1 + (2 * i) / (nx + 1)); it.push(j / (nt + 1)); }
      } else {
        for (let k = 0; k < ni; k++) { ix.push(-1 + 2 * r()); it.push(r()); }
      }
      const n0 = Math.round(nb / 2), nside = Math.round((nb - n0) / 2);
      const ax = [], at = [], bx = [], bt = [];
      for (let k = 0; k < n0; k++) { ax.push(mode === "grid" ? -1 + (2 * (k + 0.5)) / n0 : -1 + 2 * r()); at.push(0); }
      for (let k = 0; k < nside; k++) {
        const tv = mode === "grid" ? (k + 0.5) / nside : r();
        bx.push(-1, 1); bt.push(tv, tv);
      }
      plot.draw([
        { type: "points", x: ix, y: it, color: "--accent", r: ni > 800 ? 1.6 : 2.4 },
        { type: "points", x: ax, y: at, color: "--accent-3", r: 3.6 },
        { type: "points", x: bx, y: bt, color: "--pink", r: 3.6 }
      ]);
    }
    bindSlider(body, "co-ni", (v) => { ni = v; render(); }, 0);
    bindSlider(body, "co-nb", (v) => { nb = v; render(); }, 0);
    bindSeg(body, (v) => { mode = v; render(); });
    $("[data-resample]", body).addEventListener("click", () => { seed++; render(); });
    render();
  }

  /* ======================= 8. Chain rule vs beda hingga ======================= */
  function widgetChainRule(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("cr-x", "x", -1, 1, 0.01, 0.3)}
        ${slider("cr-t", "t", 0, 1, 0.01, 0.5)}
        ${slider("cr-h", "log₁₀ h (langkah beda hingga)", -8, -1, 1, -4)}
        <button class="btn btn--ghost btn--sm" type="button" data-reseed>Acak bobot jaringan</button>
        <p class="widget-hint">Jaringan: \\([x\\;t]\\to 6\\to 6\\to u\\) dengan aktivasi tanh, persis struktur pada slide (2 hidden layer).</p>
      </div>
      <div>
        <div class="table-wrap"><table>
          <thead><tr><th>Besaran</th><th>Chain rule (eksak)</th><th>Beda hingga</th><th>Selisih</th></tr></thead>
          <tbody data-rows></tbody></table></div>
        <p class="widget-hint" data-msg></p>
      </div>
    </div>`;
    const H = 6;
    let net;
    function makeNet(seed) {
      const r = P().rng(seed);
      const m = (a, b) => Array.from({ length: a }, () => Array.from({ length: b }, () => r.normal() * 0.9));
      net = { W1: m(2, H), B1: m(1, H)[0], W2: m(H, H), B2: m(1, H)[0], W3: m(H, 1).map((v) => v[0]), B3: r.normal() * 0.3 };
    }
    // Forward + turunan sesuai rumus slide (konvensi baris)
    function forward(x, t) {
      const { W1, B1, W2, B2, W3, B3 } = net;
      const X = [x, t], Xx = [1, 0], Xt = [0, 1];
      const lin = (v, W, B) => W[0].map((_, j) => v.reduce((s, vi, i) => s + vi * W[i][j], B ? B[j] : 0));
      const h1 = lin(X, W1, B1), h1x = lin(Xx, W1), h1t = lin(Xt, W1);
      const s = (z) => Math.tanh(z), s1 = (z) => 1 - Math.tanh(z) ** 2, s2 = (z) => -2 * Math.tanh(z) * (1 - Math.tanh(z) ** 2);
      const H1 = h1.map(s), H1x = h1.map((z, j) => s1(z) * h1x[j]), H1t = h1.map((z, j) => s1(z) * h1t[j]);
      const H1xx = h1.map((z, j) => s2(z) * h1x[j] ** 2); // h1,xx = X_xx W1 = 0
      const h2 = lin(H1, W2, B2), h2x = lin(H1x, W2), h2t = lin(H1t, W2), h2xx = lin(H1xx, W2);
      const H2 = h2.map(s), H2x = h2.map((z, j) => s1(z) * h2x[j]), H2t = h2.map((z, j) => s1(z) * h2t[j]);
      const H2xx = h2.map((z, j) => s2(z) * h2x[j] ** 2 + s1(z) * h2xx[j]);
      const dot = (v) => v.reduce((a, vi, j) => a + vi * W3[j], 0);
      return { u: dot(H2) + B3, ux: dot(H2x), ut: dot(H2t), uxx: dot(H2xx) };
    }
    let x = 0.3, t = 0.5, h = 1e-4, seed = 5;
    function render() {
      const e = forward(x, t);
      const u = (a, b) => forward(a, b).u;
      const fd = {
        ux: (u(x + h, t) - u(x - h, t)) / (2 * h),
        ut: (u(x, t + h) - u(x, t - h)) / (2 * h),
        uxx: (u(x + h, t) - 2 * u(x, t) + u(x - h, t)) / (h * h)
      };
      $("[data-rows]", body).innerHTML =
        `<tr><td>u</td><td class="mono">${e.u.toFixed(8)}</td><td>—</td><td>—</td></tr>` +
        [["u_x", "ux"], ["u_t", "ut"], ["u_xx", "uxx"]].map(([l, k]) =>
          `<tr><td>${l}</td><td class="mono">${e[k].toFixed(8)}</td><td class="mono">${fd[k].toFixed(8)}</td><td class="mono">${exp(Math.abs(e[k] - fd[k]))}</td></tr>`).join("");
      $("[data-msg]", body).textContent = h <= 1e-6
        ? "h sangat kecil: galat pembulatan (round-off) mulai mendominasi, terutama untuk u_xx yang membagi dengan h². Beda hingga memburuk, sedangkan chain rule tetap eksak."
        : h >= 1e-2
          ? "h besar: galat pemotongan (truncation) O(h²) terlihat jelas pada beda hingga."
          : "Untuk h sedang, beda hingga mendekati hasil chain rule, tetapi tidak pernah persis sama.";
    }
    makeNet(seed);
    bindSlider(body, "cr-x", (v) => { x = v; render(); });
    bindSlider(body, "cr-t", (v) => { t = v; render(); });
    bindSlider(body, "cr-h", (v) => { h = Math.pow(10, v); render(); }, 0);
    $("[data-reseed]", body).addEventListener("click", () => { makeNet(++seed); render(); });
    render();
  }

  /* ======================= 9. Residual invers ======================= */
  function widgetInverse(body) {
    body.innerHTML = `<div class="widget-grid">
      <div>
        ${slider("iv-l1", "Tebakan λ₁", 0, 3, 0.01, 0.5)}
        ${slider("iv-l2", "Tebakan λ₂", 0, 4, 0.01, 3)}
        <div class="stats"><div class="stat"><span>MSE_de</span><strong data-mse></strong></div></div>
        <p class="widget-hint" data-msg aria-live="polite"></p>
      </div>
      <div>
        <div class="plot plot--short"><canvas aria-label="Data observasi u(x_k)"></canvas></div>
        ${legend([["var(--accent)", "data u(x_k) (cabang atas, C=1)", true]])}
        <div class="plot plot--short mt-1"><canvas aria-label="Residual fisika"></canvas></div>
        ${legend([["var(--pink)", "residual u_xx + λ₁e^{λ₂u/2}"]])}
      </div>
    </div>
    <p class="widget-hint">Di sini \\(u\\) dan \\(u_{xx}\\) diambil dari solusi sebenarnya agar fokus pada peran \\(\\lambda\\). Pada PINN sungguhan keduanya berasal dari jaringan dan dioptimasi bersamaan.</p>`;
    const th = P().bratuThetas(1)[1];
    const xs = P().linspace(0.025, 0.975, 20);
    const us = xs.map((x) => P().bratuExact(x, th));
    const uxx = us.map((u) => -Math.exp(u)); // solusi sebenarnya memenuhi u_xx = -e^u
    const pData = new (P().Plot)($("canvas", body), { xlim: [0, 1], ylim: [0, 4.5], xlabel: "x", ylabel: "u" });
    const pRes = new (P().Plot)($$("canvas", body)[1], { xlim: [0, 1], xlabel: "x", ylabel: "residual" });
    pData.draw([{ type: "points", x: xs, y: us, color: "--accent", r: 4 }]);
    let l1 = 0.5, l2 = 3;
    function render() {
      const res = us.map((u, k) => uxx[k] + l1 * Math.exp((l2 * u) / 2));
      const mse = res.reduce((s, r) => s + r * r, 0) / res.length;
      const lim = Math.max(1, ...res.map(Math.abs));
      pRes.draw([{ x: [0, 1], y: [0, 0], color: "--border-strong", width: 1 }, { x: xs, y: res, color: "--pink", width: 2.4 }, { type: "points", x: xs, y: res, color: "--pink", r: 3 }], { ylim: [-lim * 1.1, lim * 1.1] });
      $("[data-mse]", body).textContent = exp(mse);
      $("[data-msg]", body).innerHTML = mse < 1e-3
        ? `<span class="ok">Hampir sempurna!</span> λ₁ ≈ ${l1.toFixed(2)}, λ₂ ≈ ${l2.toFixed(2)}. Nilai sebenarnya λ₁ = 1, λ₂ = 2.`
        : "Geser λ₁ dan λ₂ sampai residual menjadi garis datar di nol.";
    }
    bindSlider(body, "iv-l1", (v) => { l1 = v; render(); });
    bindSlider(body, "iv-l2", (v) => { l2 = v; render(); });
    render();
  }

  /* ======================= Diagram SVG ======================= */
  function drawDeepNet() {
    const g = $("[data-deepnet]");
    if (!g) return;
    const cols = [60, 170, 280, 390, 500, 600];
    const rows5 = [50, 120, 200, 280, 350];
    const pos = cols.map((x, c) => (c === 0 ? [[x, 160], [x, 240]] : c === 5 ? [[x, 200]] : rows5.map((y) => [x, y])));
    let s = "";
    for (let c = 0; c < pos.length - 1; c++) {
      for (const [x1, y1] of pos[c]) for (const [x2, y2] of pos[c + 1]) {
        s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent)" stroke-opacity=".25" stroke-width="1"/>`;
      }
    }
    pos.forEach((col, c) => col.forEach(([x, y], r) => {
      const dots = c > 0 && c < 5 && r === 2;
      const stroke = c === 0 ? "var(--accent-3)" : c === 5 ? "var(--pink)" : "var(--accent)";
      if (dots) { s += `<text x="${x}" y="${y}" font-size="22">⋮</text>`; return; }
      s += `<circle class="node" cx="${x}" cy="${y}" r="17" stroke="${stroke}"/>`;
      const lbl = c === 0 ? ["x", "y"][r] : c === 5 ? "u" : `h${["₁", "₂", "", "₁₉", "₂₀"][r]}`;
      s += `<text x="${x}" y="${y}" font-size="${c === 0 || c === 5 ? 15 : 11}">${lbl}</text>`;
    }));
    [1, 2, 3, 4].forEach((c) => { s += `<text class="lbl" x="${cols[c]}" y="18">H${"₁₂₃₄"[c - 1]} (20)</text>`; });
    s += `<text class="lbl" x="60" y="18">input</text><text class="lbl" x="600" y="18">output</text>`;
    g.innerHTML = s;
  }

  function drawArchitecture() {
    const svg = $("[data-arch]");
    if (!svg) return;
    const rows = [
      { y: 45, pre: "X_t", tag: "t", ins: "[0 1]" },
      { y: 125, pre: "X", tag: "", ins: "[x t]", main: true },
      { y: 205, pre: "X_x", tag: "x", ins: "[1 0]" },
      { y: 285, pre: "X_xx", tag: "xx", ins: "[0 0]" }
    ];
    const steps = ["h₁", "H₁", "h₂", "H₂", "u"];
    const xs = [60, 140, 230, 320, 410, 500, 590];
    let s = `<rect x="20" y="100" width="610" height="50" rx="14" fill="rgba(250,204,21,.12)" stroke="rgba(250,204,21,.45)"/>`;
    rows.forEach((r) => {
      const sub = r.tag ? `,${r.tag}` : "";
      const labels = [r.ins, r.pre, ...steps.map((st, i) => (i === 4 ? (r.tag ? `u_${r.tag}` : "u") : st + sub))];
      labels.forEach((lbl, i) => {
        if (i < labels.length - 1) {
          s += `<line x1="${xs[i] + 24}" y1="${r.y}" x2="${xs[i + 1] - 24}" y2="${r.y}" stroke="var(--accent)" stroke-opacity=".6" stroke-width="1.6" marker-end="url(#arr)"/>`;
          const op = ["", "W₁", "σ", "W₂", "σ", "W₃"][i];
          if (op) s += `<text class="lbl" x="${(xs[i] + xs[i + 1]) / 2}" y="${r.y - 11}">${r.main || op.startsWith("W") ? op : op + "′"}</text>`;
        }
        const stroke = i === 0 ? "var(--accent-3)" : i === labels.length - 1 ? "var(--pink)" : "var(--accent)";
        s += `<circle class="node" cx="${xs[i]}" cy="${r.y}" r="23" stroke="${stroke}"/><text x="${xs[i]}" y="${r.y}" font-size="${lbl.length > 4 ? 10 : 12}">${lbl}</text>`;
      });
      s += `<line x1="613" y1="${r.y}" x2="668" y2="165" stroke="var(--pink)" stroke-opacity=".6" stroke-width="1.6"/>`;
    });
    s += `<rect x="660" y="135" width="92" height="60" rx="12" fill="var(--accent-soft)" stroke="var(--pink)" stroke-width="2"/>
      <text x="706" y="156" font-size="12">f = u_t</text><text x="706" y="175" font-size="12">+ 𝒩(u)</text>
      <line x1="706" y1="195" x2="706" y2="245" stroke="var(--pink)" stroke-width="1.6" marker-end="url(#arr)"/>
      <rect x="668" y="250" width="76" height="40" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
      <text x="706" y="270" font-size="12">L atau F</text>
      <text class="lbl" x="325" y="320">Aliran turunan memakai σ′ dan σ″ dari aliran utama (pita kuning)</text>`;
    svg.innerHTML = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>${s}`;
  }

  /* ======================= Navigasi materi ======================= */
  function initMatrixQuiz() {
    $$("[data-matrix-quiz] .mq-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ans = $(".mq-ans", btn);
        ans.textContent = btn.dataset.ans;
        ans.hidden = !ans.hidden;
      });
    });
  }

  function initProgress() {
    const store = P().store;
    const done = store.get("modules-done", {});
    const btns = $$("[data-done]");
    const update = () => {
      const count = ["modul-1", "modul-2", "modul-3", "modul-4"].filter((m) => done[m]).length;
      $("[data-progress-bar]").style.width = `${count * 25}%`;
      $("[data-progress-label]").textContent = `${count}/4`;
      btns.forEach((b) => {
        const on = !!done[b.dataset.done];
        b.setAttribute("aria-pressed", String(on));
        b.textContent = on ? "✓ Selesai dipelajari" : "Tandai selesai";
      });
      $$("[data-toc-module]").forEach((li) => li.classList.toggle("is-done", !!done[li.dataset.tocModule]));
    };
    btns.forEach((b) => b.addEventListener("click", () => {
      const m = b.dataset.done;
      done[m] = !done[m];
      store.set("modules-done", done);
      update();
      if (done[m]) {
        P().toast("Progres tersimpan. Lanjut ke modul berikutnya! ");
        if (Object.values(done).filter(Boolean).length === 4) P().confetti();
      }
    }));
    update();
  }

  function initTOC() {
    const links = $$(".toc a[href^='#']");
    const targets = links.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    const toggle = $(".toc-toggle");
    toggle?.addEventListener("click", () => {
      const open = !$(".toc").classList.contains("is-open");
      $(".toc").classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    const bar = $(".reading-progress");
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY + 120;
      let current = targets[0];
      for (const t of targets) if (t.offsetTop <= y) current = t;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + current?.id));
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = `${Math.min(100, (window.scrollY / Math.max(h, 1)) * 100)}%`;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  const WIDGETS = {
    composite: widgetComposite, activation: widgetActivation, forward: widgetForward, params: widgetParams,
    bratu: widgetBratu, fdm: widgetFDM, collocation: widgetCollocation, chainrule: widgetChainRule, inverse: widgetInverse
  };

  document.addEventListener("DOMContentLoaded", () => {
    // Widget dibangun saat mendekati layar agar halaman tetap ringan.
    const build = (w) => {
      if (w.dataset.built) return;
      w.dataset.built = "1";
      const body = $(".widget-body", w);
      try {
        WIDGETS[w.dataset.widget](body);
        P().renderMath(body);
      } catch (err) {
        body.innerHTML = `<p class="bad">Simulasi gagal dimuat: ${err.message}</p>`;
        console.error(err);
      }
    };
    const widgets = $$("[data-widget]");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { build(e.target); io.unobserve(e.target); } });
      }, { rootMargin: "400px 0px" });
      widgets.forEach((w) => io.observe(w));
    } else widgets.forEach(build);
    // Cadangan: bangun sisa widget saat browser senggang (mis. lompat cepat via daftar isi).
    window.addEventListener("load", () => {
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
      widgets.forEach((w) => idle(() => build(w)));
    });

    drawDeepNet();
    drawArchitecture();
    initMatrixQuiz();
    initProgress();
    initTOC();
  });
})();
