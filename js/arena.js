/* ==========================================================================
   arena.js — enam mini game PINNsWEB
   Fit the Wave · Gradient Descent Golf · PINN Lab · Detektif λ ·
   Pasangkan Istilah · Kuis Galaksi
   ========================================================================== */
(() => {
  "use strict";
  const P = () => window.PINNs;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sci = (v) => (Number.isFinite(v) ? v.toExponential(2) : "—");
  const starStr = (n, max = 3) => "★".repeat(n) + `<span class="off">${"★".repeat(max - n)}</span>`;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setSeg(container, cb) {
    const btns = $$("button", container);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      cb(b.dataset.v);
    }));
  }
  function rangeBind(id, fmt, cb) {
    const input = document.getElementById(id), out = document.getElementById(id + "-out");
    const upd = () => { out.textContent = fmt(Number(input.value)); cb?.(Number(input.value)); };
    input.addEventListener("input", upd);
    upd();
    return input;
  }

  /* ============================ Fit the Wave ============================ */
  function gameFitWave(panel) {
    const LEVELS = [
      { name: "1 · Kurva S", f: (x) => 0.8 * Math.tanh(6 * (x - 0.5)) },
      { name: "2 · Bukit", f: (x) => 0.5 * (Math.tanh(12 * (x - 0.3)) - Math.tanh(12 * (x - 0.7))) },
      { name: "3 · Gelombang", f: (x) => Math.sin(2 * Math.PI * x) },
      { name: "4 · sin(4πx) slide", f: (x) => Math.sin(4 * Math.PI * x), auto: true }
    ];
    const H = 3;
    const xs = P().linspace(0, 1, 41), xf = P().linspace(0, 1, 200);
    const plot = new (P().Plot)($("canvas", panel), { xlim: [0, 1], ylim: [-1.5, 1.5], xlabel: "x", ylabel: "u" });
    const best = P().store.get("fitwave", {});
    let level = 0, params = new Float64Array(3 * H + 1), autoNet = null, running = false;

    $("[data-levels]", panel).innerHTML = LEVELS.map((l, i) => `<button type="button" data-v="${i}" aria-pressed="${i === 0}">${l.name}</button>`).join("");
    const sliderBox = $("[data-sliders]", panel);
    const ranges = { v: [-2, 2, 0.01], w: [-20, 20, 0.1], b: [-15, 15, 0.1] };
    sliderBox.innerHTML = `<div class="slider-bank" style="grid-template-columns:1fr">${[0, 1, 2].map((j) => `
      <div class="neuron-group"><h5>Neuron ${j + 1}</h5>
      ${["v", "w", "b"].map((k) => `<div class="control"><label for="fw-${k}${j}"><span>${k}<sub>${j + 1}</sub></span><output id="fw-${k}${j}-out"></output></label>
        <input type="range" id="fw-${k}${j}" min="${ranges[k][0]}" max="${ranges[k][1]}" step="${ranges[k][2]}" data-k="${k}" data-j="${j}"></div>`).join("")}
      </div>`).join("")}
      <div class="control"><label for="fw-c"><span>c (bias output)</span><output id="fw-c-out"></output></label><input type="range" id="fw-c" min="-1" max="1" step="0.01"></div></div>`;
    const idx = (k, j) => ({ v: 0, w: H, b: 2 * H }[k] + j);

    function syncSliders() {
      $$("input[data-k]", sliderBox).forEach((inp) => {
        const i = idx(inp.dataset.k, +inp.dataset.j);
        inp.value = params[i];
        $("#" + inp.id + "-out", sliderBox).textContent = params[i].toFixed(2);
      });
      $("#fw-c", sliderBox).value = params[3 * H];
      $("#fw-c-out", sliderBox).textContent = params[3 * H].toFixed(2);
    }
    $$("input", sliderBox).forEach((inp) => inp.addEventListener("input", () => {
      if (inp.id === "fw-c") params[3 * H] = +inp.value;
      else params[idx(inp.dataset.k, +inp.dataset.j)] = +inp.value;
      $("#" + inp.id + "-out", sliderBox).textContent = (+inp.value).toFixed(2);
      render();
    }));

    const netVal = (p, h, x) => { let s = p[3 * h]; for (let j = 0; j < h; j++) s += p[j] * Math.tanh(p[h + j] * x + p[2 * h + j]); return s; };

    function render() {
      const L = LEVELS[level];
      const p = L.auto ? (autoNet ? autoNet.net.p : null) : params;
      const h = L.auto ? 20 : H;
      const series = [{ type: "points", x: xs, y: xs.map(L.f), color: "--accent-3", r: 3.5 }];
      let mse = NaN;
      if (p) {
        if (!L.auto) for (let j = 0; j < H; j++) series.push({ x: xf, y: xf.map((x) => p[j] * Math.tanh(p[H + j] * x + p[2 * H + j])), color: "--pink", width: 1.2, dash: [3, 4] });
        series.push({ x: xf, y: xf.map((x) => netVal(p, h, x)), color: "--accent", width: 3 });
        mse = xs.reduce((s, x) => s + (netVal(p, h, x) - L.f(x)) ** 2, 0) / xs.length;
      }
      plot.draw(series);
      $("[data-mse]", panel).textContent = Number.isFinite(mse) ? mse.toFixed(5) : "—";
      const stars = mse < 0.001 ? 3 : mse < 0.005 ? 2 : mse < 0.02 ? 1 : 0;
      $("[data-stars]", panel).innerHTML = starStr(stars);
      if (stars > (best[level] || 0)) {
        best[level] = stars;
        P().store.set("fitwave", best);
        updateBest();
        if (stars === 3) { P().toast(`Level ${level + 1}: ★★★ sempurna!`); P().confetti(); }
      }
      return mse;
    }

    function setLevel(i) {
      stop();
      level = +i;
      const L = LEVELS[level];
      sliderBox.hidden = !!L.auto;
      autoNet = null;
      $("[data-random]", panel).hidden = !!L.auto;
      $("[data-msg]", panel).innerHTML = L.auto
        ? "Target dari slide: 2 gelombang penuh. 3 neuron tidak cukup, jadi tekan <strong>Latih otomatis</strong> untuk melatih jaringan 20 neuron dengan Adam (slide memakai BFGS)."
        : level === 0 ? "Petunjuk: satu neuron saja cukup. Coba v₁ ≈ 0.8, w₁ ≈ 6, b₁ ≈ −3, dan set neuron lain v = 0."
          : level === 1 ? "Petunjuk: bukit = selisih dua kurva S (dua neuron dengan v berlawanan tanda)."
            : "Petunjuk: susun tiga kurva S naik–turun–naik. Atau tekan Latih otomatis lalu amati slider bergerak sendiri.";
      if (!L.auto) {
        params = new Float64Array(3 * H + 1);
        params.set([0.5, 0, 0, 4, 1, 1, -2, 0, 0, 0]);
        syncSliders();
      }
      render();
    }

    function randomize() {
      const r = P().rng((Math.random() * 1e9) | 0);
      for (let j = 0; j < H; j++) { params[j] = (r() * 2 - 1) * 1.2; params[H + j] = (r() * 2 - 1) * 15; params[2 * H + j] = (r() * 2 - 1) * 8; }
      params[3 * H] = 0;
      syncSliders();
      render();
    }

    let raf = 0;
    function stop() { running = false; cancelAnimationFrame(raf); $("[data-auto]", panel).textContent = "⚡ Latih otomatis (Adam)"; }
    function autoTrain() {
      if (running) { stop(); return; }
      const L = LEVELS[level];
      const ys = xs.map(L.f);
      if (L.auto) {
        autoNet = autoNet || new (P().Regressor)({ H: 20, xs, ys, lr: 0.02, seed: 3, wScale: 6 });
      } else {
        autoNet = new (P().Regressor)({ H, xs, ys, lr: 0.05, seed: 1 });
        autoNet.net.p.set(params);
      }
      running = true;
      $("[data-auto]", panel).textContent = "⏸ Jeda";
      const t0 = autoNet.iter;
      const loop = () => {
        if (!running) return;
        autoNet.train(L.auto ? 60 : 40);
        if (!L.auto) { params.set(autoNet.net.p.map((v, i) => (i < H ? Math.max(-2, Math.min(2, v)) : i < 2 * H ? Math.max(-20, Math.min(20, v)) : i < 3 * H ? Math.max(-15, Math.min(15, v)) : Math.max(-1, Math.min(1, v))))); autoNet.net.p.set(params); syncSliders(); }
        const mse = render();
        $("[data-msg]", panel).textContent = `Iterasi Adam: ${autoNet.iter} · MSE = ${sci(mse)}`;
        if (mse < 2e-5 || autoNet.iter - t0 > (L.auto ? 12000 : 4000)) { stop(); return; }
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    setSeg($("[data-levels]", panel), setLevel);
    $("[data-auto]", panel).addEventListener("click", autoTrain);
    $("[data-random]", panel).addEventListener("click", randomize);
    setLevel(0);
    return { pause: stop };
  }

  /* ======================= Gradient Descent Golf ======================= */
  function gameGolf(panel) {
    const COURSES = [
      { name: "1 · Mangkuk", L: (w) => 0.5 * (w - 1.5) ** 2 + 0.5, dL: (w) => w - 1.5, tip: "Lanskap kuadrat sederhana: L′(w) = w − 1.5. Coba μ = 1 dan lihat apa yang terjadi!" },
      { name: "2 · Dua lembah", L: (w) => 0.08 * w ** 4 - 0.9 * w ** 2 + 0.5 * w + 3, dL: (w) => 0.32 * w ** 3 - 1.8 * w + 0.5, tip: "Ada minimum lokal (jebakan) dan minimum global. Titik awal menentukan lembah mana yang dituju." },
      { name: "3 · Lembah curam", L: (w) => 3 * (w - 2) ** 2 + 0.4 * Math.sin(4 * w), dL: (w) => 6 * (w - 2) + 1.6 * Math.cos(4 * w), tip: "Lembah sangat curam: μ sedikit terlalu besar langsung berosilasi. Cari μ ‘pas’." }
    ];
    const ws = P().linspace(-4, 5, 400);
    const plot = new (P().Plot)($("canvas", panel), { xlim: [-4, 5], xlabel: "w", ylabel: "L(w)" });
    const best = P().store.get("golf", {});
    let c = 0, trail = [], animating = false, wStar = 0, ready = false;
    const w0In = rangeBind("golf-w0", (v) => v.toFixed(2), () => { if (ready && !animating) { trail = []; draw(); } });
    const muIn = rangeBind("golf-mu", (v) => Math.pow(10, v).toFixed(3));
    $("[data-levels]", panel).innerHTML = COURSES.map((x, i) => `<button type="button" data-v="${i}" aria-pressed="${i === 0}">${x.name}</button>`).join("");

    function setCourse(i) {
      c = +i;
      const C = COURSES[c];
      wStar = ws.reduce((a, b) => (C.L(b) < C.L(a) ? b : a));
      for (let k = 0; k < 60; k++) wStar -= C.dL(wStar) / 50; // haluskan
      const ys = ws.map(C.L);
      plot.opts.ylim = [Math.min(...ys) - 0.5, Math.min(Math.max(...ys), Math.min(...ys) + 25)];
      trail = [];
      $("[data-steps]", panel).textContent = "0";
      $("[data-stars]", panel).innerHTML = starStr(best[c] || 0);
      $("[data-msg]", panel).textContent = C.tip;
      draw();
    }
    function draw() {
      const C = COURSES[c];
      const w0 = +w0In.value;
      const pts = trail.length ? trail : [w0];
      plot.draw([
        { x: ws, y: ws.map(C.L), color: "--accent", width: 2.6 },
        { x: pts, y: pts.map(C.L), color: "--pink", width: 1.2, dash: [3, 3] },
        { type: "points", x: pts, y: pts.map(C.L), color: "--pink", r: 3 },
        { type: "marker", x: [wStar], y: [C.L(wStar)], color: "--success", r: 8 },
        { type: "marker", x: [pts[pts.length - 1]], y: [C.L(pts[pts.length - 1])], color: "--pink", r: 7 }
      ]);
      $("[data-loss]", panel).textContent = C.L(pts[pts.length - 1]).toFixed(4);
    }
    function swing() {
      if (animating) return;
      const C = COURSES[c];
      const mu = Math.pow(10, +muIn.value);
      let w = +w0In.value;
      trail = [w];
      animating = true;
      let step = 0;
      const msg = $("[data-msg]", panel);
      const tick = () => {
        if (Math.abs(w - wStar) < 0.05 && step > 0) return finish(true);
        if (step >= 40 || !Number.isFinite(w) || Math.abs(w) > 50) return finish(false);
        w = w - mu * C.dL(w);
        step++;
        trail.push(Math.max(-60, Math.min(60, w)));
        $("[data-steps]", panel).textContent = step;
        draw();
        setTimeout(tick, reduce.matches ? 0 : 110);
      };
      const finish = (ok) => {
        animating = false;
        if (ok) {
          const stars = step <= 6 ? 3 : step <= 15 ? 2 : 1;
          $("[data-stars]", panel).innerHTML = starStr(stars);
          msg.innerHTML = `<span class="ok">Masuk lubang dalam ${step} langkah!</span> ${starStr(stars)}`;
          if (stars > (best[c] || 0)) { best[c] = stars; P().store.set("golf", best); updateBest(); }
          if (stars === 3) P().confetti();
        } else if (!Number.isFinite(w) || Math.abs(w) > 50) {
          msg.innerHTML = `<span class="bad">Divergen!</span> μ = ${mu.toFixed(3)} terlalu besar sehingga bola terpental makin jauh. Perkecil μ.`;
        } else if (Math.abs(C.dL(w)) < 1e-2) {
          msg.innerHTML = `<span class="bad">Terjebak</span> di titik stasioner w ≈ ${w.toFixed(2)} yang bukan minimum global. Gradient descent hanya “melihat” lereng lokal. Ubah titik awal.`;
        } else {
          msg.innerHTML = `Belum sampai setelah 40 langkah (w ≈ ${w.toFixed(2)}). ${Math.abs(w - trail[trail.length - 2]) < 0.02 ? "μ terlalu kecil, langkah terlalu pendek." : "Bola berosilasi; coba μ sedikit lebih kecil."}`;
        }
      };
      tick();
    }
    setSeg($("[data-levels]", panel), setCourse);
    $("[data-swing]", panel).addEventListener("click", swing);
    $("[data-reset]", panel).addEventListener("click", () => { if (!animating) { trail = []; draw(); } });
    ready = true;
    setCourse(0);
    return {};
  }

  /* ============================ PINN Lab ============================ */
  function gamePinnLab(panel) {
    const [cSol, cLoss, cErr] = $$("canvas", panel);
    const pSol = new (P().Plot)(cSol, { xlim: [0, 1], xlabel: "x", ylabel: "u" });
    const pLoss = new (P().Plot)(cLoss, { xlim: [0, 1], logY: true, xlabel: "iterasi", pad: [12, 12, 30, 44] });
    const pErr = new (P().Plot)(cErr, { xlim: [0, 1], logY: true, xlabel: "x", pad: [12, 12, 30, 44] });
    const xf = P().linspace(0, 1, 101);
    let model, theta, running = false, raf = 0, celebrated = false, sampling = "random";
    const cfg = { C: 2, H: 10, ni: 99, alpha: 1, lr: 0.01, hard: false };
    const bestErr = () => P().store.get("pinn-lab", null);

    const reset = () => {
      stop();
      model = new (P().BratuPINN)({ ...cfg, sampling, seed: 11 });
      theta = P().bratuThetas(cfg.C)[0];
      celebrated = false;
      $("[data-alpha-row]", panel)?.removeAttribute("hidden");
      render();
    };
    rangeBind("lab-c", (v) => v.toFixed(1), (v) => { cfg.C = v; if (model) reset(); });
    rangeBind("lab-h", (v) => String(v), (v) => { cfg.H = v; if (model) reset(); });
    rangeBind("lab-ni", (v) => String(v), (v) => { cfg.ni = v; if (model) reset(); });
    rangeBind("lab-alpha", (v) => String(+Math.pow(10, v).toPrecision(2)), (v) => { cfg.alpha = Math.pow(10, v); if (model) reset(); });
    rangeBind("lab-lr", (v) => Math.pow(10, v).toFixed(3), (v) => { cfg.lr = Math.pow(10, v); if (model) reset(); });
    setSeg($("[data-sampling]", panel), (v) => { sampling = v; reset(); });
    $("[data-hard]", panel).addEventListener("change", (e) => {
      cfg.hard = e.target.checked;
      document.getElementById("lab-alpha").disabled = cfg.hard;
      reset();
    });

    function maxErr() { return Math.max(...xf.map((x) => Math.abs(model.uAt(x) - P().bratuExact(x, theta)))); }

    function render() {
      const exact = xf.map((x) => P().bratuExact(x, theta));
      const pred = xf.map((x) => model.uAt(x));
      const ymax = Math.max(0.1, ...exact) * 1.25;
      pSol.draw([
        { x: xf, y: exact, color: "--accent-3", width: 3 },
        { x: xf, y: pred, color: "--accent", width: 2.2, dash: [7, 4] },
        { type: "points", x: model.xi, y: model.xi.map(() => ymax * 0.02), color: "--pink", r: 2 }
      ], { ylim: [Math.min(-0.05, ...pred) , Math.max(ymax, ...pred)] });
      const hist = model.history.length ? model.history : [[0, model.loss]];
      const maxIt = Math.max(100, hist[hist.length - 1][0]);
      pLoss.draw([{ x: hist.map((h) => h[0]), y: hist.map((h) => h[1]), color: "--accent", width: 2 }], { xlim: [0, maxIt] });
      const errs = xf.map((x, i) => Math.max(Math.abs(pred[i] - exact[i]), 1e-12));
      pErr.draw([{ x: xf, y: errs, color: "--pink", width: 2 }]);
      const e = Math.max(...errs);
      $("[data-iter]", panel).textContent = model.iter;
      $("[data-loss]", panel).textContent = sci(model.loss);
      $("[data-msei]", panel).textContent = sci(model.mseI);
      $("[data-mseb]", panel).textContent = cfg.hard ? "0 (hard)" : sci(model.mseB);
      $("[data-err]", panel).textContent = sci(e);
      const msg = $("[data-msg]", panel);
      if (e < 1e-3 && model.iter > 0) {
        msg.innerHTML = `<span class="ok">Tantangan tercapai!</span> Galat maks ${sci(e)} &lt; 10⁻³ setelah ${model.iter} iterasi.`;
        if (!celebrated) {
          celebrated = true;
          P().confetti();
          const b = bestErr();
          if (b === null || model.iter < b) { P().store.set("pinn-lab", model.iter); updateBest(); }
        }
      } else if (!Number.isFinite(model.loss)) {
        msg.innerHTML = `<span class="bad">Training divergen.</span> Turunkan learning rate lalu reset.`;
        stop();
      } else {
        msg.textContent = model.iter === 0 ? "Tekan ▶ Latih. Solusi awal jaringan masih acak." : "Training berjalan… perhatikan loss turun dan kurva PINN mendekati solusi analitik.";
      }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      const b = $("[data-run]", panel);
      if (b) b.textContent = "▶ Latih";
    }
    function run() {
      if (running) { stop(); return; }
      running = true;
      $("[data-run]", panel).textContent = "⏸ Jeda";
      let batch = 20;
      const loop = () => {
        if (!running) return;
        const t = performance.now();
        model.train(batch);
        const dt = performance.now() - t;
        batch = Math.max(5, Math.min(400, Math.round(batch * (12 / Math.max(dt, 1)))));
        render();
        if (model.iter >= 30000 || !Number.isFinite(model.loss)) { stop(); return; }
        raf = requestAnimationFrame(loop);
      };
      loop();
    }
    $("[data-run]", panel).addEventListener("click", run);
    $("[data-step]", panel).addEventListener("click", () => { for (let i = 0; i < 4; i++) model.train(25); render(); });
    $("[data-reset]", panel).addEventListener("click", reset);
    reset();
    return { pause: stop };
  }

  /* ============================ Detektif λ ============================ */
  function gameDetective(panel) {
    const CASES = [[1, 2], [0.5, 3], [1.5, 1], [2, 1.5], [0.8, 2.5], [2.5, 0.8], [1.2, 1.2]];
    const [cData, cRes, cHeat] = $$("canvas", panel);
    const pData = new (P().Plot)(cData, { xlim: [0, 1], xlabel: "x", ylabel: "u", pad: [12, 12, 30, 40] });
    const pRes = new (P().Plot)(cRes, { xlim: [0, 1], xlabel: "x", pad: [12, 12, 30, 44] });
    let pHeat = null;
    const xs = P().linspace(1 / 16, 15 / 16, 15);
    let order, round, score, truth, us, uxx, locked, usedHeat, noise = false;
    const l1In = rangeBind("det-l1", (v) => v.toFixed(2), () => update());
    const l2In = rangeBind("det-l2", (v) => v.toFixed(2), () => update());

    function makeCase() {
      truth = order[round];
      const [a, b] = truth;
      const Cp = (a * b) / 2;
      const th = P().bratuThetas(Cp)[1];
      // v'' + C' e^v = 0 → u = 2v/λ2 memenuhi u'' + λ1 e^{λ2 u/2} = 0
      const r = P().rng(round * 97 + 13);
      const clean = xs.map((x) => (2 * P().bratuExact(x, th)) / b);
      const amp = Math.max(...clean) * 0.015;
      us = clean.map((u) => u + (noise ? r.normal() * amp : 0));
      uxx = clean.map((u) => -a * Math.exp((b * u) / 2));
      locked = false;
      usedHeat = false;
      $("[data-heat-wrap]", panel).hidden = true;
      $("[data-heat-legend]", panel).hidden = true;
      $("[data-lock]", panel).textContent = "🔒 Kunci tebakan";
      $("[data-heat]", panel).disabled = false;
      $("[data-round]", panel).textContent = `${round + 1}/3`;
      $("[data-msg]", panel).textContent = "Amati residual: garis merah muda harus rata di nol.";
      pData.draw([{ type: "points", x: xs, y: us, color: "--accent-3", r: 4 }], { ylim: [0, Math.max(...us) * 1.15] });
      update();
    }
    function mseFor(l1, l2) {
      let s = 0;
      for (let k = 0; k < us.length; k++) { const rr = uxx[k] + l1 * Math.exp((l2 * us[k]) / 2); s += rr * rr; }
      return s / us.length;
    }
    function update() {
      if (!us) return;
      const l1 = +l1In.value, l2 = +l2In.value;
      const res = us.map((u, k) => uxx[k] + l1 * Math.exp((l2 * u) / 2));
      const lim = Math.max(0.5, ...res.map(Math.abs)) * 1.1;
      pRes.draw([{ x: [0, 1], y: [0, 0], color: "--border-strong", width: 1 }, { x: xs, y: res, color: "--pink", width: 2.2 }, { type: "points", x: xs, y: res, color: "--pink", r: 3 }], { ylim: [-lim, lim] });
      $("[data-mse]", panel).textContent = sci(mseFor(l1, l2));
      if (pHeat && !$("[data-heat-wrap]", panel).hidden) drawHeatMarkers();
    }
    let heatReady = false;
    function showHeat() {
      $("[data-heat-wrap]", panel).hidden = false;
      $("[data-heat-legend]", panel).hidden = false;
      if (!pHeat) pHeat = new (P().Plot)(cHeat, { xlim: [0.1, 3], ylim: [0.1, 4], xlabel: "λ₁", ylabel: "λ₂", pad: [12, 12, 30, 40] });
      const nx = 90, ny = 90, vals = new Float64Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const l1 = 0.1 + (2.9 * i) / (nx - 1), l2 = 0.1 + (3.9 * j) / (ny - 1);
        vals[j * nx + i] = Math.log10(mseFor(l1, l2) + 1e-10);
      }
      pHeat.resize();
      pHeat.setHeatmap(vals, nx, ny);
      heatReady = true;
      drawHeatMarkers();
    }
    function drawHeatMarkers() {
      if (!heatReady) return;
      const s = [{ type: "marker", x: [+l1In.value], y: [+l2In.value], color: "--accent-3", r: 7 }];
      if (locked) s.push({ type: "marker", x: [truth[0]], y: [truth[1]], color: "#facc15", r: 7 });
      pHeat.draw(s);
    }
    function lock() {
      if (locked) {
        round++;
        if (round >= 3) return endSession();
        return makeCase();
      }
      locked = true;
      const [a, b] = truth;
      const g1 = +l1In.value, g2 = +l2In.value;
      const err = Math.abs(g1 - a) / a + Math.abs(g2 - b) / b;
      const pts = Math.max(0, Math.round(1000 * (1 - err * 2.5)) - (usedHeat ? 100 : 0));
      score += pts;
      $("[data-score]", panel).textContent = score;
      $("[data-msg]", panel).innerHTML = `Jawaban: λ₁ = <strong>${a}</strong>, λ₂ = <strong>${b}</strong>. Tebakanmu (${g1.toFixed(2)}, ${g2.toFixed(2)}) → <span class="${pts > 700 ? "ok" : "bad"}">+${pts} poin</span>. Titik kuning di peta adalah jawaban benar.`;
      $("[data-lock]", panel).textContent = round < 2 ? "Kasus berikutnya →" : "Lihat skor akhir";
      $("[data-heat]", panel).disabled = true;
      showHeat();
    }
    function endSession() {
      const best = Math.max(P().store.get("detective", 0), score);
      P().store.set("detective", best);
      updateBest();
      $("[data-msg]", panel).innerHTML = `<strong>Sesi selesai! Skor: ${score}/3000.</strong> Rekor: ${best}. ${score > 2400 ? "Insting inverse problem-mu tajam! 🕵️" : "Tip: atur λ₁ dulu sampai residual dekat x=0 dan x=1 nol, lalu λ₂ untuk bagian tengah."} <button class="btn btn--ghost btn--sm" type="button" data-again>Main lagi</button>`;
      if (score > 2400) P().confetti();
      $("[data-again]", panel).addEventListener("click", start);
      $("[data-lock]", panel).disabled = true;
    }
    function start() {
      order = P().shuffle(CASES).slice(0, 3);
      round = 0; score = 0;
      $("[data-score]", panel).textContent = 0;
      $("[data-lock]", panel).disabled = false;
      l1In.value = 1.5; l2In.value = 1.5;
      l1In.dispatchEvent(new Event("input")); l2In.dispatchEvent(new Event("input"));
      makeCase();
    }
    $("[data-lock]", panel).addEventListener("click", lock);
    $("[data-heat]", panel).addEventListener("click", () => { usedHeat = true; $("[data-heat]", panel).disabled = true; showHeat(); });
    $("[data-noise]", panel).addEventListener("change", (e) => { noise = e.target.checked; start(); });
    start();
    return {};
  }

  /* ========================== Pasangkan Istilah ========================== */
  function gameMatch(panel) {
    let selected = null, matched = 0, misses = 0, seconds = 0, timer = null, started = false;
    const termsBox = $("[data-terms]", panel), defsBox = $("[data-defs]", panel);
    function newRound() {
      clearInterval(timer);
      started = false; matched = 0; misses = 0; seconds = 0; selected = null;
      $("[data-time]", panel).textContent = 0;
      $("[data-miss]", panel).textContent = 0;
      $("[data-pairs]", panel).textContent = "0/6";
      const items = P().shuffle(window.PINNS_GLOSSARY).slice(0, 6).map((g, i) => ({ ...g, k: i }));
      termsBox.innerHTML = items.map((g) => `<button type="button" class="match-item match-term" data-k="${g.k}">${g.t}</button>`).join("");
      defsBox.innerHTML = P().shuffle(items).map((g) => `<button type="button" class="match-item" data-k="${g.k}">${g.d}</button>`).join("");
    }
    function startTimer() {
      if (started) return;
      started = true;
      timer = setInterval(() => { seconds++; $("[data-time]", panel).textContent = seconds; }, 1000);
    }
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest(".match-item");
      if (!btn || btn.disabled) return;
      startTimer();
      const isTerm = btn.classList.contains("match-term");
      if (!selected || selected.classList.contains("match-term") === isTerm) {
        selected?.classList.remove("is-selected");
        selected = btn;
        btn.classList.add("is-selected");
        return;
      }
      if (selected.dataset.k === btn.dataset.k) {
        [selected, btn].forEach((b) => { b.classList.remove("is-selected"); b.classList.add("is-matched"); b.disabled = true; });
        matched++;
        $("[data-pairs]", panel).textContent = `${matched}/6`;
        if (matched === 6) {
          clearInterval(timer);
          const sc = Math.max(50, 600 - 10 * seconds - 30 * misses);
          const best = Math.max(P().store.get("match", 0), sc);
          P().store.set("match", best);
          updateBest();
          P().toast(`Selesai dalam ${seconds} detik, ${misses} salah → skor ${sc} (rekor ${best})`);
          if (sc >= 400) P().confetti();
        }
      } else {
        misses++;
        $("[data-miss]", panel).textContent = misses;
        [selected, btn].forEach((b) => { b.classList.add("is-wrong"); setTimeout(() => b.classList.remove("is-wrong", "is-selected"), 420); });
      }
      selected = null;
    });
    $("[data-new]", panel).addEventListener("click", newRound);
    newRound();
    return { pause: () => clearInterval(timer) };
  }

  /* ============================ Kuis Galaksi ============================ */
  function gameGalaxyQuiz(panel) {
    const root = $("[data-timed-quiz]", panel);
    root.innerHTML = `<p>10 soal acak dari semua modul. Setiap soal 20 detik, 3 nyawa. Poin = 100 + 10×sisa detik + bonus <em>streak</em>.</p><button class="btn btn--primary" type="button">🚀 Mulai</button>`;
    let quiz = null;
    $("button", root).addEventListener("click", () => {
      quiz = new (P().Quiz)(root, { module: "all", count: 10, timed: true, seconds: 20, lives: 3, storeKey: "galaxy-quiz", onFinish: updateBest });
    });
    return { pause: () => quiz && clearInterval(quiz.timer) };
  }

  /* ============================ Kerangka Arena ============================ */
  const GAMES = { fitwave: gameFitWave, golf: gameGolf, "pinn-lab": gamePinnLab, detective: gameDetective, match: gameMatch, "galaxy-quiz": gameGalaxyQuiz };
  const instances = {};

  function updateBest() {
    const s = P().store;
    const fw = Object.values(s.get("fitwave", {})).reduce((a, b) => a + b, 0);
    const golf = Object.values(s.get("golf", {})).reduce((a, b) => a + b, 0);
    const lab = s.get("pinn-lab", null);
    const labels = {
      fitwave: fw ? `🏆 ${fw}/12 bintang` : "",
      golf: golf ? `🏆 ${golf}/9 bintang` : "",
      "pinn-lab": lab ? `🏆 Tantangan selesai dalam ${lab} iterasi` : "",
      detective: s.get("detective", 0) ? `🏆 Rekor ${s.get("detective", 0)}/3000` : "",
      match: s.get("match", 0) ? `🏆 Rekor ${s.get("match", 0)} poin` : "",
      "galaxy-quiz": s.get("galaxy-quiz", 0) ? `🏆 Rekor ${s.get("galaxy-quiz", 0)} poin` : ""
    };
    Object.entries(labels).forEach(([k, v]) => { const el = $(`[data-best="${k}"]`); if (el) el.textContent = v; });
  }

  function open(name, { scroll = true } = {}) {
    if (!GAMES[name]) return;
    Object.values(instances).forEach((g) => g.pause?.());
    $("[data-empty]").hidden = true;
    $$("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== name; });
    $$("[data-game]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.game === name)));
    const panel = $(`[data-panel="${name}"]`);
    if (!instances[name]) {
      try {
        instances[name] = GAMES[name](panel) || {};
      } catch (err) {
        console.error(err);
        panel.insertAdjacentHTML("beforeend", `<p class="bad">Game gagal dimuat: ${err.message}</p>`);
      }
      P().renderMath(panel);
    }
    history.replaceState(null, "", "#" + name);
    if (scroll) panel.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-game]").forEach((b) => b.addEventListener("click", () => open(b.dataset.game)));
    updateBest();
    const fromHash = () => { const n = location.hash.slice(1); if (GAMES[n]) open(n); };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  });
})();
