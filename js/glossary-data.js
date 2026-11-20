/* ==========================================================================
   glossary-data.js — glosarium istilah teknis (dipakai di Referensi & Arena)
   t: istilah, id: padanan Indonesia, d: definisi singkat, m: modul terkait
   ========================================================================== */
window.PINNS_GLOSSARY = [
  { t: "Composite function", id: "fungsi komposit", m: 1, d: "Fungsi yang dibentuk dengan menerapkan suatu fungsi pada output fungsi lain: (f∘g)(x) = f(g(x))." },
  { t: "Feedforward neural network", id: "jaringan saraf umpan maju", m: 1, d: "Fungsi komposit dari banyak fungsi linear dan nonlinear; informasi mengalir satu arah dari input ke output. Sama dengan MLP / fully connected network." },
  { t: "Activation function", id: "fungsi aktivasi", m: 1, d: "Fungsi nonlinear (tanh, ReLU, sigmoid) yang diterapkan pada output linear tiap neuron agar jaringan bisa memodelkan pola nonlinear." },
  { t: "Weight & bias", id: "bobot & bias", m: 1, d: "Parameter yang dapat dilatih: weight mengalikan input, bias menggeser hasil. Bersama-sama disebut trainable parameters." },
  { t: "Hidden layer", id: "lapisan tersembunyi", m: 1, d: "Lapisan neuron di antara input dan output; setiap layer menghitung H = f(H_prev W + B)." },
  { t: "Forward pass", id: "propagasi maju", m: 1, d: "Proses menghitung output jaringan dari input, layer demi layer." },
  { t: "Loss function", id: "fungsi kerugian", m: 1, d: "Ukuran seberapa buruk model; dalam materi ini berupa mean squared error (MSE) yang ingin diminimalkan." },
  { t: "Gradient descent", id: "penurunan gradien", m: 1, d: "Optimasi iteratif W_new = W_old − μ∇L(W); melangkah berlawanan arah gradien." },
  { t: "Learning rate", id: "laju belajar", m: 1, d: "Ukuran langkah μ pada gradient descent; terlalu kecil lambat, terlalu besar divergen." },
  { t: "BFGS", id: "metode quasi-Newton", m: 1, d: "Algoritma quasi-Newton (Broyden–Fletcher–Goldfarb–Shanno) yang membangun aproksimasi Hessian dari perubahan gradien." },
  { t: "ODE", id: "persamaan diferensial biasa", m: 2, d: "Persamaan diferensial dengan turunan terhadap satu variabel bebas, misalnya persamaan Bratu u_xx + Ce^u = 0." },
  { t: "PDE", id: "persamaan diferensial parsial", m: 2, d: "Persamaan diferensial dengan turunan parsial terhadap dua variabel bebas atau lebih, misalnya persamaan Burgers dalam x dan t." },
  { t: "Boundary condition", id: "syarat batas", m: 2, d: "Nilai solusi yang ditetapkan di tepi domain, misalnya u(0) = u(1) = 0." },
  { t: "Initial condition", id: "syarat awal", m: 2, d: "Nilai solusi pada waktu awal t = 0, misalnya u(x,0) = −sin(πx) pada Burgers." },
  { t: "Finite difference method", id: "metode beda hingga", m: 2, d: "Metode numerik yang mengganti turunan dengan selisih nilai pada titik-titik grid, misalnya u_xx ≈ (u_{k+1} − 2u_k + u_{k−1})/h²." },
  { t: "Finite element method", id: "metode elemen hingga", m: 2, d: "Metode numerik yang membagi domain menjadi elemen kecil dan mendekati solusi dengan fungsi basis lokal." },
  { t: "Spectral method", id: "metode spektral", m: 2, d: "Metode yang menuliskan solusi sebagai jumlah fungsi basis global seperti deret Fourier atau polinomial Chebyshev." },
  { t: "Runge–Kutta", id: "metode Runge–Kutta", m: 2, d: "Keluarga metode integrasi waktu berorde tinggi untuk ODE; ode45 di MATLAB adalah salah satunya." },
  { t: "Jacobian", id: "matriks Jacobi", m: 2, d: "Matriks turunan parsial J = ∂F/∂u dari vektor residual terhadap unknowns." },
  { t: "Levenberg–Marquardt", id: "algoritma LM", m: 2, d: "Algoritma least squares (JᵀJ + μI)δ = −JᵀF yang memadukan gradient descent dan Gauss–Newton." },
  { t: "PINNs", id: "jaringan saraf berbasis fisika", m: 3, d: "Physics-Informed Neural Networks: neural network yang dilatih agar memenuhi persamaan diferensial dan syarat batas/awal." },
  { t: "Collocation points", id: "titik kolokasi", m: 3, d: "Titik-titik di domain tempat residual persamaan atau syarat batas dievaluasi untuk menyusun loss." },
  { t: "PDE residual", id: "residual PDE", m: 3, d: "Nilai sisa ketika solusi tebakan dimasukkan ke persamaan; idealnya nol. Rata-rata kuadratnya adalah MSE_i." },
  { t: "Automatic differentiation", id: "diferensiasi otomatis", m: 3, d: "Penghitungan turunan eksak (hingga presisi mesin) dengan menerapkan chain rule pada setiap operasi elementer." },
  { t: "Chain rule", id: "aturan rantai", m: 3, d: "Aturan turunan fungsi komposit: d/dx f(g(x)) = f′(g(x))·g′(x)." },
  { t: "Hard constraint", id: "kendala keras", m: 3, d: "Memaksakan syarat batas/awal langsung pada struktur jaringan, misalnya u = x(1−x)N(x), sehingga MSE_b tidak diperlukan." },
  { t: "Mesh-free", id: "tanpa mesh", m: 3, d: "Tidak memerlukan grid atau mesh terstruktur; titik kolokasi boleh diambil acak." },
  { t: "Inverse problem", id: "masalah invers", m: 4, d: "Menentukan parameter persamaan yang tidak diketahui (misalnya λ) dari data observasi sambil mengaproksimasi solusi." },
  { t: "Parameter estimation", id: "estimasi parameter", m: 4, d: "Nama lain inverse problem: mengestimasi konstanta fisika dari data." },
  { t: "Least squares", id: "kuadrat terkecil", m: 4, d: "Meminimalkan jumlah kuadrat residual ‖F‖²; pada PINN invers F = [F_de; F_data]." }
];
