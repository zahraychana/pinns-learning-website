/* ==========================================================================
   nn.js — inti numerik yang dipakai widget & game (berjalan penuh di browser)
   - Solusi analitik persamaan Bratu (kedua cabang solusi)
   - Finite Difference Method (FDM) + Newton untuk Bratu
   - Jaringan saraf dangkal (1 hidden layer, tanh) dengan turunan analitik
     terhadap input (u, u_x, u_xx) dan terhadap parameter → dipakai untuk
     regresi biasa maupun PINN (soft / hard constraint)
   - Optimizer Adam dan generator acak ber-seed
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- Generator acak ber-seed (mulberry32) ---------- */
  function rng(seed = 1) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.normal = () => {
      const u = Math.max(next(), 1e-12), v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return next;
  }

  /* ---------- Persamaan Bratu: u'' + C e^u = 0, u(0)=u(1)=0 ----------
     Solusi analitik: u(x) = 2 ln( cosh θ / cosh(θ(1 − 2x)) ),
     dengan θ memenuhi 4θ = √(2C) cosh θ.
     Ada 2 akar (cabang bawah & atas) bila C < C_c ≈ 3.513830719,
     1 akar bila C = C_c, dan tidak ada solusi bila C > C_c. */
  const BRATU_CRITICAL = 3.513830719125162;

  function bratuThetas(C) {
    if (C <= 0) return [];
    const k = Math.sqrt(2 * C);
    const f = (t) => 4 * t - k * Math.cosh(t);
    const tStar = Math.asinh(4 / k); // titik maksimum f
    if (f(tStar) < 0) return [];
    const bisect = (lo, hi) => {
      let flo = f(lo);
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2, fm = f(mid);
        if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
      }
      return (lo + hi) / 2;
    };
    let hi = tStar + 1;
    while (f(hi) > 0) hi += 1;
    return [bisect(0, tStar), bisect(tStar, hi)];
  }

  const bratuExact = (x, theta) =>
    2 * Math.log(Math.cosh(theta) / Math.cosh(theta * (1 - 2 * x)));

  /* ---------- FDM + Newton untuk Bratu ----------
     (u_{k+1} − 2u_k + u_{k−1})/h² + C e^{u_k} = 0, k = 1..n−1
     Jacobian tridiagonal → diselesaikan dengan algoritma Thomas. */
  function solveBratuFDM(n, C, { maxIter = 50, tol = 1e-12, guess = 0 } = {}) {
    const h = 1 / n, m = n - 1;
    const u = new Float64Array(n + 1);
    for (let k = 1; k < n; k++) u[k] = guess * 4 * (k * h) * (1 - k * h);
    const F = new Float64Array(m), a = new Float64Array(m), b = new Float64Array(m), c = new Float64Array(m);
    let iter = 0, norm = Infinity;
    for (; iter < maxIter; iter++) {
      for (let i = 0; i < m; i++) {
        const k = i + 1;
        F[i] = (u[k + 1] - 2 * u[k] + u[k - 1]) / (h * h) + C * Math.exp(u[k]);
        a[i] = 1 / (h * h);
        b[i] = -2 / (h * h) + C * Math.exp(u[k]);
        c[i] = 1 / (h * h);
      }
      norm = Math.sqrt(F.reduce((s, v) => s + v * v, 0) / m);
      if (norm < tol) break;
      // Selesaikan J δ = −F (Thomas)
      const cp = new Float64Array(m), dp = new Float64Array(m);
      cp[0] = c[0] / b[0];
      dp[0] = -F[0] / b[0];
      for (let i = 1; i < m; i++) {
        const den = b[i] - a[i] * cp[i - 1];
        cp[i] = c[i] / den;
        dp[i] = (-F[i] - a[i] * dp[i - 1]) / den;
      }
      const d = new Float64Array(m);
      d[m - 1] = dp[m - 1];
      for (let i = m - 2; i >= 0; i--) d[i] = dp[i] - cp[i] * d[i + 1];
      for (let i = 0; i < m; i++) u[i + 1] += d[i];
      if (!u.every(Number.isFinite)) break;
    }
    const x = Array.from({ length: n + 1 }, (_, k) => k * h);
    return { x, u: Array.from(u), iter, residual: norm, converged: norm < 1e-8 };
  }

  /* ---------- Optimizer Adam ---------- */
  class Adam {
    constructor(size, lr = 0.01, b1 = 0.9, b2 = 0.999, eps = 1e-8) {
      Object.assign(this, { lr, b1, b2, eps, t: 0 });
      this.m = new Float64Array(size);
      this.v = new Float64Array(size);
    }
    step(params, grad) {
      this.t++;
      const { b1, b2, eps, lr } = this;
      const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let i = 0; i < params.length; i++) {
        this.m[i] = b1 * this.m[i] + (1 - b1) * grad[i];
        this.v[i] = b2 * this.v[i] + (1 - b2) * grad[i] * grad[i];
        params[i] -= (lr * (this.m[i] / c1)) / (Math.sqrt(this.v[i] / c2) + eps);
      }
    }
  }

  /* ---------- Jaringan dangkal: N(x) = Σ v_j tanh(w_j x + b_j) + c ----------
     Susunan parameter: [v_1..v_H, w_1..w_H, b_1..b_H, c] */
  class ShallowNet {
    constructor(H = 20, seed = 7, { wScale = 4, vScale = 0.3 } = {}) {
      this.H = H;
      this.P = 3 * H + 1;
      this.p = new Float64Array(this.P);
      const r = rng(seed);
      for (let j = 0; j < H; j++) {
        this.p[j] = r.normal() * vScale;
        this.p[H + j] = r.normal() * wScale;
        this.p[2 * H + j] = (r() * 2 - 1) * wScale * 0.6;
      }
    }

    value(x) {
      const { H, p } = this;
      let s = p[3 * H];
      for (let j = 0; j < H; j++) s += p[j] * Math.tanh(p[H + j] * x + p[2 * H + j]);
      return s;
    }

    /* N, N_x, N_xx beserta gradiennya terhadap semua parameter */
    full(x, out) {
      const { H, p } = this;
      const { gN, gNx, gNxx } = out;
      let N = p[3 * H], Nx = 0, Nxx = 0;
      for (let j = 0; j < H; j++) {
        const v = p[j], w = p[H + j], b = p[2 * H + j];
        const t = Math.tanh(w * x + b);
        const s1 = 1 - t * t;
        const s2 = -2 * t * s1;
        const s3 = -2 * s1 * (1 - 3 * t * t);
        N += v * t;
        Nx += v * w * s1;
        Nxx += v * w * w * s2;
        gN[j] = t;            gN[H + j] = v * s1 * x;                 gN[2 * H + j] = v * s1;
        gNx[j] = w * s1;      gNx[H + j] = v * (s1 + w * s2 * x);     gNx[2 * H + j] = v * w * s2;
        gNxx[j] = w * w * s2; gNxx[H + j] = v * (2 * w * s2 + w * w * s3 * x); gNxx[2 * H + j] = v * w * w * s3;
      }
      gN[3 * H] = 1; gNx[3 * H] = 0; gNxx[3 * H] = 0;
      out.N = N; out.Nx = Nx; out.Nxx = Nxx;
      return out;
    }

    buffers() {
      return { gN: new Float64Array(this.P), gNx: new Float64Array(this.P), gNxx: new Float64Array(this.P) };
    }
  }

  /* ---------- Regresi: min mean (N(x_k) − y_k)² ---------- */
  class Regressor {
    constructor({ H = 20, seed = 3, lr = 0.01, xs, ys, wScale = 6 }) {
      this.net = new ShallowNet(H, seed, { wScale, vScale: 0.4 });
      this.opt = new Adam(this.net.P, lr);
      this.xs = xs; this.ys = ys;
      this.grad = new Float64Array(this.net.P);
      this.iter = 0;
      this.loss = this.computeLoss();
    }
    computeLoss() {
      let s = 0;
      for (let k = 0; k < this.xs.length; k++) { const e = this.net.value(this.xs[k]) - this.ys[k]; s += e * e; }
      return s / this.xs.length;
    }
    train(steps = 1) {
      const { net, xs, ys, grad } = this;
      const { H, p } = net;
      const n = xs.length;
      for (let it = 0; it < steps; it++) {
        grad.fill(0);
        let L = 0;
        for (let k = 0; k < n; k++) {
          const x = xs[k];
          let u = p[3 * H];
          const ts = new Float64Array(H);
          for (let j = 0; j < H; j++) { ts[j] = Math.tanh(p[H + j] * x + p[2 * H + j]); u += p[j] * ts[j]; }
          const e = u - ys[k];
          L += e * e;
          const g = (2 * e) / n;
          for (let j = 0; j < H; j++) {
            const s1 = 1 - ts[j] * ts[j];
            grad[j] += g * ts[j];
            grad[H + j] += g * p[j] * s1 * x;
            grad[2 * H + j] += g * p[j] * s1;
          }
          grad[3 * H] += g;
        }
        this.loss = L / n;
        this.opt.step(p, grad);
        this.iter++;
      }
      this.loss = this.computeLoss();
      return this.loss;
    }
  }

  /* ---------- PINN untuk Bratu: u_xx + C e^u = 0, u(0)=u(1)=0 ----------
     soft constraint : u = N(x),           L = MSE_i + α·MSE_b
     hard constraint : u = x(1 − x)·N(x),  L = MSE_i (syarat batas otomatis) */
  class BratuPINN {
    constructor({ H = 10, C = 2, ni = 99, alpha = 1, lr = 0.01, hard = false, seed = 11, sampling = "random" }) {
      Object.assign(this, { C, alpha, hard });
      this.net = new ShallowNet(H, seed, { wScale: 2, vScale: 0.2 });
      this.opt = new Adam(this.net.P, lr);
      const r = rng(seed + 101);
      this.xi = Array.from({ length: ni }, (_, k) =>
        sampling === "grid" ? (k + 1) / (ni + 1) : 0.0005 + r() * 0.999
      ).sort((a, b) => a - b);
      this.xb = [0, 1];
      this.buf = this.net.buffers();
      this.grad = new Float64Array(this.net.P);
      this.du = new Float64Array(this.net.P);
      this.duxx = new Float64Array(this.net.P);
      this.iter = 0;
      this.history = [];
      this.evaluate();
    }

    /* u, u_xx dan gradien keduanya pada titik x */
    point(x) {
      const o = this.net.full(x, this.buf);
      const { du, duxx } = this;
      const P = this.net.P;
      if (!this.hard) {
        for (let i = 0; i < P; i++) { du[i] = o.gN[i]; duxx[i] = o.gNxx[i]; }
        return { u: o.N, uxx: o.Nxx };
      }
      const g = x * (1 - x), g1 = 1 - 2 * x, g2 = -2;
      for (let i = 0; i < P; i++) {
        du[i] = g * o.gN[i];
        duxx[i] = g2 * o.gN[i] + 2 * g1 * o.gNx[i] + g * o.gNxx[i];
      }
      return { u: g * o.N, uxx: g2 * o.N + 2 * g1 * o.Nx + g * o.Nxx };
    }

    uAt(x) {
      const n = this.net.value(x);
      return this.hard ? x * (1 - x) * n : n;
    }

    evaluate() {
      let Li = 0, Lb = 0;
      for (const x of this.xi) { const { u, uxx } = this.point(x); const r = uxx + this.C * Math.exp(u); Li += r * r; }
      Li /= this.xi.length;
      if (!this.hard) { for (const x of this.xb) { const u = this.uAt(x); Lb += u * u; } Lb /= this.xb.length; }
      this.mseI = Li; this.mseB = Lb;
      this.loss = Li + this.alpha * Lb;
      return this.loss;
    }

    train(steps = 1) {
      const P = this.net.P;
      const { grad, du, duxx, C } = this;
      for (let s = 0; s < steps; s++) {
        grad.fill(0);
        const ni = this.xi.length;
        for (const x of this.xi) {
          const { u, uxx } = this.point(x);
          const eu = C * Math.exp(u);
          const r = uxx + eu;
          if (!Number.isFinite(r)) continue;
          const g = (2 * r) / ni;
          for (let i = 0; i < P; i++) grad[i] += g * (duxx[i] + eu * du[i]);
        }
        if (!this.hard) {
          const nb = this.xb.length;
          for (const x of this.xb) {
            const { u } = this.point(x);
            const g = (2 * this.alpha * u) / nb;
            for (let i = 0; i < P; i++) grad[i] += g * du[i];
          }
        }
        this.opt.step(this.net.p, grad);
        this.iter++;
      }
      this.evaluate();
      this.history.push([this.iter, this.loss]);
      return this.loss;
    }
  }

  window.PINNs = Object.assign(window.PINNs || {}, {
    rng, bratuThetas, bratuExact, BRATU_CRITICAL, solveBratuFDM, Adam, ShallowNet, Regressor, BratuPINN
  });
  if (typeof module !== "undefined") module.exports = window.PINNs;
})();
