/* ==========================================================================
   plot.js — plotter kanvas ringan (tanpa pustaka) untuk widget & game.
   Mendukung: garis, titik, sumbu log-y, heatmap, tema gelap/terang,
   layar retina, dan ukuran responsif (ResizeObserver).
   ========================================================================== */
(() => {
  "use strict";

  const cssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function resolveColor(c) {
    if (!c) return cssVar("--accent");
    if (c.startsWith("--")) return cssVar(c);
    return c;
  }

  function niceTicks(min, max, count = 5) {
    const span = max - min || 1;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    const ticks = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) {
      ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return ticks;
  }

  function fmt(v) {
    const a = Math.abs(v);
    if (a === 0) return "0";
    if (a >= 1e4 || a < 1e-3) return v.toExponential(0).replace("e+", "e");
    return String(+v.toPrecision(3));
  }

  class Plot {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.opts = Object.assign(
        { xlim: [0, 1], ylim: "auto", logY: false, xlabel: "", ylabel: "", pad: [14, 16, 34, 48] },
        opts
      );
      this.series = [];
      this.heat = null;
      this.resize();
      if ("ResizeObserver" in window) {
        new ResizeObserver(() => { this.resize(); this.render(); }).observe(canvas);
      }
      document.addEventListener("pinns:themechange", () => this.render());
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(rect.width, 200);
      this.h = Math.max(rect.height, 120);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw(series, opts) {
      if (opts) Object.assign(this.opts, opts);
      this.series = series || [];
      this.render();
    }

    /* values: Float64Array baris demi baris (ny × nx), y dari bawah ke atas */
    setHeatmap(values, nx, ny) {
      let lo = Infinity, hi = -Infinity;
      for (const v of values) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const off = document.createElement("canvas");
      off.width = nx; off.height = ny;
      const octx = off.getContext("2d");
      const img = octx.createImageData(nx, ny);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const v = values[j * nx + i];
          const t = hi > lo ? (v - lo) / (hi - lo) : 0;
          const [r, g, b] = Plot.colormap(t);
          const k = ((ny - 1 - j) * nx + i) * 4;
          img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      this.heat = off;
      this.render();
    }

    static colormap(t) {
      // navy → ungu → magenta → kuning lembut (rendah = gelap = baik)
      const stops = [[12, 16, 60], [67, 56, 202], [139, 92, 246], [217, 70, 239], [253, 224, 140]];
      const x = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
      const i = Math.min(Math.floor(x), stops.length - 2);
      const f = x - i;
      return stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f));
    }

    limits() {
      let [x0, x1] = this.opts.xlim;
      let y0, y1;
      if (Array.isArray(this.opts.ylim)) {
        [y0, y1] = this.opts.ylim;
      } else {
        y0 = Infinity; y1 = -Infinity;
        for (const s of this.series) {
          for (const v of s.y) {
            if (!Number.isFinite(v)) continue;
            if (this.opts.logY && v <= 0) continue;
            if (v < y0) y0 = v;
            if (v > y1) y1 = v;
          }
        }
        if (!Number.isFinite(y0)) { y0 = 0; y1 = 1; }
        if (this.opts.logY) {
          y0 = Math.floor(Math.log10(y0)); y1 = Math.ceil(Math.log10(y1));
          if (y1 === y0) y1 = y0 + 1;
          return [x0, x1, y0, y1];
        }
        const padY = (y1 - y0) * 0.08 || 0.5;
        y0 -= padY; y1 += padY;
      }
      if (this.opts.logY) return [x0, x1, Math.log10(y0), Math.log10(y1)];
      return [x0, x1, y0, y1];
    }

    render() {
      const { ctx, w, h } = this;
      const [pt, pr, pb, pl] = this.opts.pad;
      const [x0, x1, y0, y1] = this.limits();
      const X = (x) => pl + ((x - x0) / (x1 - x0)) * (w - pl - pr);
      const Y = (y) => {
        const v = this.opts.logY ? Math.log10(Math.max(y, 1e-300)) : y;
        return h - pb - ((v - y0) / (y1 - y0)) * (h - pt - pb);
      };
      this.X = X; this.Y = Y;

      ctx.clearRect(0, 0, w, h);
      const grid = cssVar("--border");
      const muted = cssVar("--muted");
      ctx.font = `11px ${cssVar("--font-mono") || "monospace"}`;

      if (this.heat) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.heat, pl, pt, w - pl - pr, h - pt - pb);
      }

      // Grid & label sumbu
      ctx.strokeStyle = grid;
      ctx.fillStyle = muted;
      ctx.lineWidth = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const t of niceTicks(x0, x1, Math.max(3, Math.round(w / 90)))) {
        const px = X(t);
        ctx.beginPath(); ctx.moveTo(px, pt); ctx.lineTo(px, h - pb); ctx.stroke();
        ctx.fillText(fmt(t), px, h - pb + 6);
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      if (this.opts.logY) {
        const stepE = Math.max(1, Math.ceil((y1 - y0) / 6));
        for (let e = y0; e <= y1; e += stepE) {
          const py = h - pb - ((e - y0) / (y1 - y0)) * (h - pt - pb);
          ctx.beginPath(); ctx.moveTo(pl, py); ctx.lineTo(w - pr, py); ctx.stroke();
          ctx.fillText("1e" + e, pl - 6, py);
        }
      } else {
        for (const t of niceTicks(y0, y1, Math.max(3, Math.round(h / 60)))) {
          const py = Y(t);
          ctx.beginPath(); ctx.moveTo(pl, py); ctx.lineTo(w - pr, py); ctx.stroke();
          ctx.fillText(fmt(t), pl - 6, py);
        }
      }
      if (this.opts.xlabel) {
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(this.opts.xlabel, w - pr, h - pb - 4);
      }
      if (this.opts.ylabel) {
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(this.opts.ylabel, pl + 6, pt + 2);
      }

      // Seri data (dipotong pada area plot)
      ctx.save();
      ctx.beginPath();
      ctx.rect(pl, pt, w - pl - pr, h - pt - pb);
      ctx.clip();
      for (const s of this.series) {
        const color = resolveColor(s.color);
        if (s.type === "points") {
          ctx.fillStyle = color;
          ctx.strokeStyle = s.stroke ? resolveColor(s.stroke) : "transparent";
          for (let i = 0; i < s.x.length; i++) {
            ctx.beginPath();
            ctx.arc(X(s.x[i]), Y(s.y[i]), s.r || 3, 0, Math.PI * 2);
            ctx.fill();
            if (s.stroke) ctx.stroke();
          }
        } else if (s.type === "marker") {
          ctx.fillStyle = color;
          ctx.strokeStyle = cssVar("--surface-solid");
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(X(s.x[0]), Y(s.y[0]), s.r || 7, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else {
          ctx.strokeStyle = color;
          ctx.lineWidth = s.width || 2.2;
          ctx.setLineDash(s.dash || []);
          ctx.lineJoin = "round";
          ctx.beginPath();
          let started = false;
          for (let i = 0; i < s.x.length; i++) {
            const yv = s.y[i];
            if (!Number.isFinite(yv) || (this.opts.logY && yv <= 0)) { started = false; continue; }
            const px = X(s.x[i]), py = Y(yv);
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();

      // Bingkai
      ctx.strokeStyle = cssVar("--border-strong");
      ctx.strokeRect(pl + 0.5, pt + 0.5, w - pl - pr - 1, h - pt - pb - 1);
    }

    /* Koordinat data dari posisi pointer (untuk game yang bisa diklik) */
    toData(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const [pt, pr, pb, pl] = this.opts.pad;
      const [x0, x1, y0, y1] = this.limits();
      const px = clientX - rect.left, py = clientY - rect.top;
      return {
        x: x0 + ((px - pl) / (this.w - pl - pr)) * (x1 - x0),
        y: y0 + ((this.h - pb - py) / (this.h - pt - pb)) * (y1 - y0)
      };
    }
  }

  window.PINNs = Object.assign(window.PINNs || {}, { Plot, linspace });

  function linspace(a, b, n) {
    return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  }
})();
