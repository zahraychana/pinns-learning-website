# PINNsWEB: Mathematics Behind PINNs

Website belajar interaktif **Physics-Informed Neural Networks (PINNs)** untuk mahasiswa dan dosen,
berdasarkan materi *Mathematics Behind PINNs* oleh **Muhammad Luthfi Shahab** (ILMS 2026).

🌐 **Live:** https://pinnsweb.infinityfree.io/

## Fitur

- **Materi lengkap 4 modul**: Feedforward NN, Differential Equations, PINNs Forward, PINNs Inverse.
  Setiap modul memiliki tujuan belajar, penjelasan mendalam, intuisi, contoh hitung, ringkasan, istilah kunci, dan kuis.
- **9 simulasi interaktif**: fungsi komposit, fungsi aktivasi, forward pass, ukuran matriks, bifurkasi Bratu,
  laboratorium FDM, titik kolokasi, chain rule vs beda hingga, dan residual inverse problem.
- **6 mini game**: Fit the Wave, Gradient Descent Golf, PINN Lab (training PINN sungguhan di browser),
  Detektif λ, Pasangkan Istilah, dan Kuis Galaksi.
- **Latihan**: contoh kasus, kode MATLAB, grafik hasil, soal mandiri dengan pembahasan, dan kuis komprehensif (43 soal).
- **Referensi & glosarium** yang bisa dicari.
- **Tombol bahasa ID/EN** di header (terjemahan otomatis Google; rumus & kode tidak ikut diterjemahkan).
- Tema galaksi (navy–ungu) dengan **mode gelap/terang**, latar konstelasi jaringan saraf, responsif, dan aksesibel.

## Struktur folder

```
PINNsWEB/
├── index.html          Beranda
├── materi.html         Materi 4 modul + simulasi
├── latihan.html        Latihan, soal mandiri, kuis komprehensif
├── arena.html          Mini game
├── reference.html      Daftar pustaka, kode, glosarium
├── css/
│   └── style.css       Sistem desain (token warna, tema gelap/terang, komponen)
├── js/
│   ├── main.js         Tema, navigasi, latar jaringan, KaTeX, progres
│   ├── plot.js         Plotter kanvas ringan
│   ├── nn.js           Numerik: Bratu analitik, FDM-Newton, NN & PINN + Adam
│   ├── materi.js       Simulasi & navigasi halaman materi
│   ├── latihan.js      Tab latihan & lightbox
│   ├── arena.js        Logika mini game
│   ├── quiz.js         Mesin kuis
│   ├── quiz-data.js    Bank soal
│   ├── glossary-data.js Data glosarium
│   └── reference.js    Pencarian glosarium
├── assets/img/results/ Grafik hasil (WebP)
└── .github/workflows/deploy.yml   Auto-deploy ke InfinityFree via FTP
```

## Menjalankan secara lokal

```bash
python -m http.server 8000
```

Buka http://localhost:8000.

## Deploy

Setiap push ke branch `main` akan mengunggah website ke InfinityFree secara otomatis (lihat `.github/workflows/deploy.yml`).

## Kredit

- Materi & dosen: **Muhammad Luthfi Shahab**
- Desain & pengembangan: **zahraychana@gmail.com**

Lisensi: [MIT](LICENSE)
