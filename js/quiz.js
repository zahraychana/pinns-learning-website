/* ==========================================================================
   quiz.js — mesin kuis pilihan ganda (dipakai di Materi, Latihan, Arena)
   - Opsi diacak setiap percobaan, umpan balik + pembahasan per soal
   - Ringkasan nilai & review jawaban salah, skor terbaik disimpan
   - Mode waktu (timer + nyawa) untuk Kuis Galaksi di Arena
   ========================================================================== */
(() => {
  "use strict";

  const KEYS = ["A", "B", "C", "D", "E"];

  function shuffle(arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickQuestions(module, count) {
    const bank = window.PINNS_QUESTIONS || [];
    const pool = module && module !== "all" ? bank.filter((q) => q.m === module) : bank;
    return shuffle(pool).slice(0, count || pool.length);
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  class Quiz {
    /**
     * @param {HTMLElement} root
     * @param {object} opts { module, count, timed, seconds, lives, storeKey, onFinish }
     */
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = Object.assign({ module: "all", count: 5, timed: false, seconds: 20, lives: 3 }, opts);
      this.start();
    }

    start() {
      this.questions = pickQuestions(this.opts.module, this.opts.count).map((q) => {
        const order = shuffle(q.o.map((_, i) => i));
        return { ...q, order, answerPos: order.indexOf(q.a) };
      });
      this.index = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.points = 0;
      this.lives = this.opts.lives;
      this.answers = [];
      this.renderQuestion();
    }

    math() {
      window.PINNs?.renderMath?.(this.root);
    }

    renderQuestion() {
      clearInterval(this.timer);
      const q = this.questions[this.index];
      const total = this.questions.length;
      this.root.innerHTML = "";

      const top = el("div", "quiz-top");
      top.append(el("span", "quiz-counter", `Soal ${this.index + 1}/${total}`));
      const prog = el("div", "progress");
      const bar = el("span");
      bar.style.width = `${(this.index / total) * 100}%`;
      prog.append(bar);
      top.append(prog);
      if (this.opts.timed) {
        this.hudTime = el("span", "hud-item", `⏱ <strong>${this.opts.seconds}</strong>s`);
        const hearts = "❤".repeat(this.lives) + "<span class='text-muted'>" + "♡".repeat(Math.max(0, this.opts.lives - this.lives)) + "</span>";
        top.append(this.hudTime, el("span", "hud-item", hearts), el("span", "hud-item", `⭐ <strong>${this.points}</strong>`));
      } else {
        top.append(el("span", "hud-item", `Benar: <strong>${this.score}</strong>`));
      }
      this.root.append(top);

      const qid = `q-${Math.random().toString(36).slice(2, 8)}`;
      const qText = el("p", "quiz-question", q.q);
      qText.id = qid;
      this.root.append(qText);
      const list = el("ul", "quiz-options");
      list.setAttribute("role", "list");
      list.setAttribute("aria-labelledby", qid);
      q.order.forEach((optIndex, pos) => {
        const li = el("li");
        const btn = el("button", "quiz-option", `<span class="key">${KEYS[pos]}</span><span>${q.o[optIndex]}</span>`);
        btn.type = "button";
        btn.addEventListener("click", () => this.answer(pos));
        li.append(btn);
        list.append(li);
      });
      this.root.append(list);
      this.feedback = el("div");
      this.feedback.setAttribute("aria-live", "polite");
      this.root.append(this.feedback);
      this.math();

      if (this.opts.timed) {
        this.timeLeft = this.opts.seconds;
        this.timer = setInterval(() => {
          this.timeLeft--;
          if (this.hudTime) this.hudTime.innerHTML = `⏱ <strong>${this.timeLeft}</strong>s`;
          if (this.timeLeft <= 0) this.answer(-1);
        }, 1000);
      }
    }

    answer(pos) {
      clearInterval(this.timer);
      const q = this.questions[this.index];
      const correct = pos === q.answerPos;
      const buttons = this.root.querySelectorAll(".quiz-option");
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === q.answerPos) b.classList.add("is-correct");
        else if (i === pos) b.classList.add("is-wrong");
      });

      if (correct) {
        this.score++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.points += 100 + (this.opts.timed ? this.timeLeft * 10 : 0) + (this.streak - 1) * 20;
      } else {
        this.streak = 0;
        if (this.opts.timed) this.lives--;
      }
      this.answers.push({ q, pos, correct });

      const title = correct ? "✅ Benar!" : pos === -1 ? "⏰ Waktu habis" : "❌ Kurang tepat";
      this.feedback.className = "quiz-feedback " + (correct ? "is-correct" : "is-wrong");
      this.feedback.innerHTML = `<strong>${title}</strong>${q.e}`;

      const last = this.index === this.questions.length - 1 || (this.opts.timed && this.lives <= 0);
      const next = el("button", "btn btn--primary", last ? "Lihat hasil" : "Soal berikutnya →");
      next.type = "button";
      next.addEventListener("click", () => {
        if (last) this.finish();
        else { this.index++; this.renderQuestion(); }
      });
      this.root.append(next);
      this.math();
      next.focus({ preventScroll: true });
    }

    finish() {
      clearInterval(this.timer);
      const total = this.questions.length;
      const answered = this.answers.length;
      const pct = Math.round((this.score / total) * 100);
      const key = this.opts.storeKey;
      let best = null;
      if (key && window.PINNs?.store) {
        const metric = this.opts.timed ? this.points : pct;
        best = Math.max(window.PINNs.store.get(key, 0), metric);
        window.PINNs.store.set(key, best);
      }

      const msg =
        pct >= 90 ? "Luar biasa! Pemahamanmu sudah sangat kuat. 🚀" :
        pct >= 70 ? "Bagus! Tinggal sedikit lagi untuk sempurna." :
        pct >= 50 ? "Lumayan. Ulas kembali bagian yang masih salah." :
        "Jangan menyerah! Baca ulang materinya lalu coba lagi.";

      this.root.innerHTML = "";
      const res = el("div", "quiz-result");
      res.append(el("span", "eyebrow", this.opts.timed ? "Kuis selesai" : "Hasil kuis"));
      if (this.opts.timed) {
        res.append(el("div", "quiz-score gradient-text", String(this.points)));
        res.append(el("p", "text-muted", `poin · ${this.score}/${answered} benar · streak terbaik ${this.bestStreak}` + (this.lives <= 0 ? " · nyawa habis" : "")));
      } else {
        res.append(el("div", "quiz-score gradient-text", `${pct}`));
        res.append(el("p", "text-muted", `${this.score} dari ${total} jawaban benar`));
      }
      res.append(el("p", "", msg));
      if (best !== null) res.append(el("p", "game-best", `Rekor terbaikmu: ${best}${this.opts.timed ? " poin" : ""}`));

      const wrong = this.answers.filter((a) => !a.correct);
      if (wrong.length) {
        const rev = el("div", "quiz-review");
        rev.append(el("h4", "", "Ulasan jawaban yang belum tepat"));
        const ol = el("ol");
        wrong.forEach(({ q }) => {
          ol.append(el("li", "", `<strong>${q.q}</strong><br>Jawaban: <span class="ok">${q.o[q.a]}</span><br><span class="text-muted">${q.e}</span>`));
        });
        rev.append(ol);
        res.append(rev);
      }
      const again = el("button", "btn btn--primary mt-1", "Coba lagi (soal diacak)");
      again.type = "button";
      again.addEventListener("click", () => this.start());
      res.append(again);
      this.root.append(res);
      this.math();
      if (pct >= 80) window.PINNs?.confetti?.();
      this.opts.onFinish?.({ score: this.score, total, pct, points: this.points });
    }
  }

  window.PINNs = Object.assign(window.PINNs || {}, { Quiz, shuffle });

  // Inisialisasi otomatis kuis statis: <div class="quiz" data-quiz="modul-1" data-count="5">
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz[data-quiz]").forEach((root) => {
      new Quiz(root, {
        module: root.dataset.quiz,
        count: Number(root.dataset.count) || 5,
        storeKey: "quiz-" + root.dataset.quiz
      });
    });
  });
})();
