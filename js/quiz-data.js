/* ==========================================================================
   quiz-data.js — bank soal pilihan ganda beserta pembahasan.
   m: modul, q: pertanyaan, o: opsi, a: indeks jawaban benar, e: pembahasan.
   Rumus memakai sintaks KaTeX \( ... \).
   ========================================================================== */
window.PINNS_QUESTIONS = [
  /* ---------------- Modul 1 ---------------- */
  {
    m: "modul-1",
    q: "Jika \\(f(x)=x^2\\) dan \\(g(x)=x+1\\), berapakah \\((f\\circ g)(2)\\)?",
    o: ["5", "9", "6", "4"],
    a: 1,
    e: "\\((f\\circ g)(2)=f(g(2))=f(3)=3^2=9\\). Hitung fungsi dalam (\\(g\\)) lebih dulu, baru fungsi luar (\\(f\\))."
  },
  {
    m: "modul-1",
    q: "Pernyataan mana yang paling tepat tentang feedforward neural network?",
    o: [
      "Fungsi linear tunggal dengan banyak input",
      "Fungsi komposit dari banyak fungsi linear dan nonlinear",
      "Algoritma optimasi untuk mencari minimum",
      "Metode diskretisasi berbasis grid"
    ],
    a: 1,
    e: "Slide: a feedforward neural network is a composite function of multiple variables, consisting of many linear and nonlinear functions."
  },
  {
    m: "modul-1",
    q: "Mengapa fungsi aktivasi harus nonlinear?",
    o: [
      "Agar perhitungan lebih cepat",
      "Agar jumlah parameter berkurang",
      "Tanpa nonlinearitas, komposisi layer tetap menjadi fungsi linear",
      "Agar output selalu positif"
    ],
    a: 2,
    e: "Komposisi fungsi linear tetap linear. Jaringan sedalam apa pun tanpa aktivasi nonlinear setara dengan satu fungsi linear dan tidak mampu mendekati kurva rumit."
  },
  {
    m: "modul-1",
    q: "Pada jaringan 2 → 2 → 1 di slide (\\(w_1,\\dots,w_6,b_1,b_2,b_3\\)), berapa jumlah trainable parameters?",
    o: ["6", "7", "9", "12"],
    a: 2,
    e: "Ada 6 weight (\\(w_1\\)–\\(w_6\\)) dan 3 bias (\\(b_1\\)–\\(b_3\\)), total 9. Weight dan bias sama-sama disebut trainable parameters."
  },
  {
    m: "modul-1",
    q: "Nama lain feedforward neural network menurut slide adalah …",
    o: [
      "Recurrent network dan convolutional network",
      "Multilayer perceptron dan fully connected network",
      "Spectral network dan finite network",
      "Residual network dan transformer"
    ],
    a: 1,
    e: "Feedforward neural network = multilayer perceptron = fully connected network."
  },
  {
    m: "modul-1",
    q: "Jaringan 2 input, 4 hidden layer @20 node, 1 output dengan konvensi \\(H_\\ell=f(H_{\\ell-1}W_\\ell+B_\\ell)\\). Berapa ukuran \\(W_2\\)?",
    o: ["2 × 20", "20 × 20", "20 × 1", "1 × 20"],
    a: 1,
    e: "\\(W_\\ell\\) berukuran (neuron layer sebelumnya) × (neuron layer ini). Antara hidden layer 1 dan 2: 20 × 20."
  },
  {
    m: "modul-1",
    q: "Berapa ukuran \\(W_5\\) pada jaringan yang sama (layer terakhir ke output \\(u\\))?",
    o: ["20 × 1", "1 × 20", "20 × 20", "2 × 1"],
    a: 0,
    e: "Dari 20 neuron hidden layer ke-4 menuju 1 output: \\(W_5\\) berukuran 20 × 1, dan \\(B_5\\) berukuran 1 × 1."
  },
  {
    m: "modul-1",
    q: "Total parameter jaringan 2–20–20–20–20–1 adalah …",
    o: ["1281", "1341", "1600", "1361"],
    a: 1,
    e: "\\((2\\cdot20+20)+3(20\\cdot20+20)+(20\\cdot1+1)=60+1260+21=1341\\)."
  },
  {
    m: "modul-1",
    q: "Pada gradient descent \\(W_{new}=W_{old}-\\mu\\nabla L(W)\\), apa yang terjadi jika \\(\\mu\\) terlalu besar?",
    o: [
      "Konvergensi selalu lebih cepat",
      "Langkah bisa melompati minimum sehingga berosilasi atau divergen",
      "Loss menjadi tepat nol",
      "Gradien menjadi nol"
    ],
    a: 1,
    e: "Learning rate \\(\\mu\\) yang terlalu besar membuat langkah melewati lembah minimum, sehingga loss bisa berosilasi atau bahkan membesar (divergen)."
  },
  {
    m: "modul-1",
    q: "BFGS termasuk metode optimasi jenis apa?",
    o: ["Metode orde nol (tanpa turunan)", "Quasi-Newton", "Metode beda hingga", "Metode Monte Carlo"],
    a: 1,
    e: "BFGS adalah metode quasi-Newton: ia membangun aproksimasi matriks Hessian dari perubahan gradien antar-iterasi."
  },
  {
    m: "modul-1",
    q: "Pada contoh regresi \\(u(x)=\\sin(4\\pi x)\\), titik kolokasinya \\(x_k=0.01\\times k\\), \\(k=0,\\dots,100\\). Ada berapa titik?",
    o: ["100", "99", "101", "50"],
    a: 2,
    e: "\\(k\\) berjalan dari 0 sampai 100 sehingga ada 101 titik, termasuk kedua ujung \\(x=0\\) dan \\(x=1\\)."
  },
  {
    m: "modul-1",
    q: "Mengapa komputasi bentuk matriks (\\(XW+B\\)) lebih disukai?",
    o: [
      "Mengurangi jumlah parameter",
      "Dapat dihitung paralel/teroptimasi dan memproses banyak titik sekaligus",
      "Menghilangkan kebutuhan fungsi aktivasi",
      "Membuat jaringan menjadi linear"
    ],
    a: 1,
    e: "Perkalian matriks dieksekusi sangat efisien (BLAS/GPU). Dengan \\(X\\) berukuran \\(N\\times2\\), semua \\(N\\) titik dihitung dalam satu operasi."
  },

  /* ---------------- Modul 2 ---------------- */
  {
    m: "modul-2",
    q: "Persamaan Bratu \\(u_{xx}+Ce^{u}=0\\) termasuk …",
    o: ["PDE linear", "ODE nonlinear", "ODE linear", "PDE bergantung waktu"],
    a: 1,
    e: "Hanya ada satu variabel bebas \\(x\\) (ODE) dan suku \\(e^{u}\\) membuatnya nonlinear."
  },
  {
    m: "modul-2",
    q: "Pada persamaan Burgers \\(u_t+uu_x-\\frac{0.01}{\\pi}u_{xx}=0\\), suku \\(uu_x\\) disebut …",
    o: ["Difusi/viskositas", "Konveksi nonlinear", "Syarat awal", "Suku sumber"],
    a: 1,
    e: "\\(uu_x\\) adalah suku konveksi nonlinear yang dapat membentuk shock. Suku \\(\\frac{0.01}{\\pi}u_{xx}\\) adalah difusi (viskositas)."
  },
  {
    m: "modul-2",
    q: "Syarat awal (initial condition) persamaan Burgers pada slide adalah …",
    o: ["\\(u(x,0)=\\sin(\\pi x)\\)", "\\(u(x,0)=-\\sin(\\pi x)\\)", "\\(u(x,0)=0\\)", "\\(u(0,t)=-\\sin(\\pi t)\\)"],
    a: 1,
    e: "\\(u(x,0)=-\\sin(\\pi x)\\) dengan syarat batas \\(u(-1,t)=u(1,t)=0\\)."
  },
  {
    m: "modul-2",
    q: "Manakah yang merupakan metode time integration?",
    o: ["Finite element method", "Spectral method", "Runge–Kutta", "Finite difference method"],
    a: 2,
    e: "Euler, Runge–Kutta, dan ode45 adalah metode integrasi waktu. FDM, FEM, dan spektral dipakai untuk diskretisasi ruang."
  },
  {
    m: "modul-2",
    q: "Rumus beda hingga pusat untuk \\(u_{xx}(x_k)\\) adalah …",
    o: [
      "\\(\\dfrac{u_{k+1}-u_{k-1}}{2h}\\)",
      "\\(\\dfrac{u_{k+1}-2u_k+u_{k-1}}{h^2}\\)",
      "\\(\\dfrac{u_{k+1}-u_k}{h}\\)",
      "\\(\\dfrac{u_{k+1}+2u_k+u_{k-1}}{h^2}\\)"
    ],
    a: 1,
    e: "Menjumlahkan deret Taylor \\(u_{k+1}\\) dan \\(u_{k-1}\\) memberi \\((u_{k+1}-2u_k+u_{k-1})/h^2\\) dengan galat \\(\\mathcal O(h^2)\\)."
  },
  {
    m: "modul-2",
    q: "Jika galat FDM berorde \\(\\mathcal O(h^2)\\) dan jumlah subinterval \\(n\\) digandakan, galat kira-kira …",
    o: ["Tetap", "Menjadi setengah", "Menjadi seperempat", "Menjadi dua kali"],
    a: 2,
    e: "\\(h=1/n\\) menjadi setengah, maka \\(h^2\\) menjadi seperempat."
  },
  {
    m: "modul-2",
    q: "Pada FDM Bratu dengan \\(n=100\\), berapa banyak unknowns?",
    o: ["100", "101", "99", "98"],
    a: 2,
    e: "Unknowns \\(u_k\\) untuk \\(k=1,\\dots,99\\). Nilai \\(u_0=u_{100}=0\\) sudah diketahui dari syarat batas."
  },
  {
    m: "modul-2",
    q: "Algoritma yang dipakai slide untuk menyelesaikan sistem nonlinear FDM adalah …",
    o: ["BFGS", "Adam", "Levenberg–Marquardt", "Euler"],
    a: 2,
    e: "Slide: Optimization: the Levenberg–Marquardt algorithm."
  },
  {
    m: "modul-2",
    q: "Pada Levenberg–Marquardt \\((J^\\top J+\\mu I)\\delta=-J^\\top F\\), jika \\(\\mu\\to0\\) metode ini mendekati …",
    o: ["Gradient descent", "Gauss–Newton", "Metode Euler", "Random search"],
    a: 1,
    e: "Dengan \\(\\mu\\to0\\) diperoleh \\(J^\\top J\\,\\delta=-J^\\top F\\), yaitu langkah Gauss–Newton. Dengan \\(\\mu\\) besar, langkahnya mirip gradient descent."
  },
  {
    m: "modul-2",
    q: "Pada solusi analitik Bratu \\(C=2\\), nilai \\(\\theta\\) yang dipakai adalah …",
    o: ["\\(\\approx 0.5894\\)", "\\(\\approx 1.5708\\)", "\\(\\approx 2.1268\\)", "\\(\\approx 3.5138\\)"],
    a: 0,
    e: "\\(\\theta\\approx0.589387763469351\\), akar terkecil dari \\(4\\theta=\\sqrt{2C}\\cosh\\theta\\). Akar besar ≈ 2.1268 memberi solusi cabang atas."
  },

  /* ---------------- Modul 3 ---------------- */
  {
    m: "modul-3",
    q: "Apa unknowns pada PINN untuk masalah maju (forward problem)?",
    o: ["Nilai \\(u_k\\) di setiap titik grid", "Bobot jaringan \\(W\\)", "Titik kolokasi", "Syarat batas"],
    a: 1,
    e: "Solusi direpresentasikan oleh \\(u(x,t,W)\\), sehingga yang dicari adalah bobot \\(W\\)."
  },
  {
    m: "modul-3",
    q: "\\(MSE_i\\) pada loss PINN mengukur …",
    o: [
      "Kecocokan dengan data observasi",
      "Pelanggaran persamaan diferensial di titik interior",
      "Pelanggaran syarat batas",
      "Jumlah parameter jaringan"
    ],
    a: 1,
    e: "\\(MSE_i\\) adalah PDE residual pada \\(n_i\\) titik interior, sedangkan \\(MSE_b\\) adalah residual syarat batas/awal."
  },
  {
    m: "modul-3",
    q: "Pada perhitungan turunan, nilai awal \\(X_x\\) untuk \\(X=[x\\;\\;t]\\) adalah …",
    o: ["[0 1]", "[1 0]", "[0 0]", "[1 1]"],
    a: 1,
    e: "\\(\\partial x/\\partial x=1\\) dan \\(\\partial t/\\partial x=0\\), sehingga \\(X_x=[1\\;0]\\). Sejalan dengan itu, \\(X_t=[0\\;1]\\) dan \\(X_{xx}=[0\\;0]\\)."
  },
  {
    m: "modul-3",
    q: "Rumus yang benar untuk \\(H_{1,xx}\\) adalah …",
    o: [
      "\\(\\sigma'(h_1)\\cdot h_{1,xx}\\)",
      "\\(\\sigma''(h_1)\\cdot h_{1,x}^2+\\sigma'(h_1)\\cdot h_{1,xx}\\)",
      "\\(\\sigma''(h_1)\\cdot h_{1,xx}\\)",
      "\\(\\sigma'(h_1)^2\\cdot h_{1,x}\\)"
    ],
    a: 1,
    e: "Turunkan \\(H_{1,x}=\\sigma'(h_1)h_{1,x}\\) dengan aturan hasil kali: \\(\\sigma''(h_1)h_{1,x}^2+\\sigma'(h_1)h_{1,xx}\\)."
  },
  {
    m: "modul-3",
    q: "Mengapa ReLU kurang cocok untuk PINN yang memuat \\(u_{xx}\\)?",
    o: [
      "ReLU terlalu lambat dihitung",
      "Turunan kedua ReLU nol hampir di mana-mana",
      "ReLU tidak bisa bernilai positif",
      "ReLU hanya untuk klasifikasi"
    ],
    a: 1,
    e: "ReLU linear sepotong-sepotong, sehingga \\(\\sigma''=0\\) (kecuali di 0). Akibatnya \\(u_{xx}\\) dari jaringan ReLU nyaris selalu nol."
  },
  {
    m: "modul-3",
    q: "Pada contoh PINN Bratu, berapa nilai \\(n_i\\) dan \\(n_b\\)?",
    o: ["\\(n_i=100,\\;n_b=1\\)", "\\(n_i=99,\\;n_b=2\\)", "\\(n_i=101,\\;n_b=0\\)", "\\(n_i=2,\\;n_b=99\\)"],
    a: 1,
    e: "99 titik interior acak di \\((0,1)\\) dan 2 titik batas \\(x=0\\) dan \\(x=1\\)."
  },
  {
    m: "modul-3",
    q: "Fungsi \\(\\alpha\\) pada \\(L(W)=MSE_i+\\alpha MSE_b\\) adalah …",
    o: ["Learning rate", "Menyeimbangkan kedua suku loss", "Jumlah iterasi", "Parameter fisika yang dicari"],
    a: 1,
    e: "\\(\\alpha\\) memberi bobot relatif pada residual batas agar optimizer tidak mengabaikan salah satu suku."
  },
  {
    m: "modul-3",
    q: "Manakah yang BUKAN kelebihan PINNs menurut slide?",
    o: ["Mesh-free", "Automatic differentiation", "Selalu lebih cepat dari FDM untuk semua masalah", "Unified framework"],
    a: 2,
    e: "Slide menyebut mesh-free, efficient inverse problems, automatic differentiation, unified framework, dan hard constraint. PINN tidak selalu lebih cepat dari FDM; untuk masalah maju sederhana FDM sering lebih cepat."
  },
  {
    m: "modul-3",
    q: "Dengan hard constraint \\(u(x)=x(1-x)N(x)\\) untuk Bratu, apa yang terjadi pada \\(MSE_b\\)?",
    o: ["Menjadi lebih besar", "Tidak diperlukan karena \\(u(0)=u(1)=0\\) otomatis", "Harus dikalikan 2", "Diganti MSE data"],
    a: 1,
    e: "Faktor \\(x(1-x)\\) membuat syarat batas selalu terpenuhi apa pun \\(N(x)\\), sehingga loss cukup \\(MSE_i\\)."
  },
  {
    m: "modul-3",
    q: "Tanda \\(\\cdot\\) pada \\(H_{1,x}=\\sigma'(h_1)\\cdot h_{1,x}\\) menyatakan …",
    o: ["Perkalian matriks", "Perkalian elemen demi elemen (Hadamard)", "Produk silang", "Komposisi fungsi"],
    a: 1,
    e: "Fungsi aktivasi diterapkan per elemen, sehingga turunannya juga dikalikan per elemen (Hadamard product)."
  },
  {
    m: "modul-3",
    q: "Loss PINN Bratu pada hasil slide adalah sekitar …",
    o: ["\\(3.81\\times10^{-6}\\)", "\\(2.47\\times10^{-7}\\)", "\\(9.15\\times10^{-8}\\)", "\\(1.00\\times10^{-2}\\)"],
    a: 1,
    e: "Forward PINN Bratu: \\(2.47038\\times10^{-7}\\). Nilai \\(3.81\\times10^{-6}\\) milik regresi \\(\\sin(4\\pi x)\\), dan \\(9.15\\times10^{-8}\\) milik masalah invers."
  },

  /* ---------------- Modul 4 ---------------- */
  {
    m: "modul-4",
    q: "Pada inverse problem, apa yang dicari?",
    o: ["Hanya solusi \\(u\\)", "Hanya syarat batas", "Parameter \\(\\lambda\\) sekaligus solusi \\(u\\)", "Jumlah titik kolokasi"],
    a: 2,
    e: "Tujuan: identify \\(\\lambda\\) while simultaneously approximating the solution \\(u\\)."
  },
  {
    m: "modul-4",
    q: "Pada contoh invers \\(u_{xx}+\\lambda_1e^{\\lambda_2u/2}=0\\), nilai sebenarnya adalah …",
    o: ["\\(\\lambda_1=2,\\;\\lambda_2=1\\)", "\\(\\lambda_1=1,\\;\\lambda_2=2\\)", "\\(\\lambda_1=1,\\;\\lambda_2=1\\)", "\\(\\lambda_1=2,\\;\\lambda_2=2\\)"],
    a: 1,
    e: "\\(\\lambda_1=1\\) dan \\(\\lambda_2=2\\), sehingga persamaan menjadi \\(u_{xx}+e^{u}=0\\) (\\(C=1\\))."
  },
  {
    m: "modul-4",
    q: "Apa yang \"diberikan\" (given) pada masalah invers di slide?",
    o: ["\\(\\{x_k,u(x_k)\\}\\), k = 1,…,n", "Nilai \\(\\lambda_1\\) dan \\(\\lambda_2\\)", "Bobot jaringan", "Solusi analitik lengkap"],
    a: 0,
    e: "Diberikan observasi parsial solusi: pasangan \\((x_k,u(x_k))\\)."
  },
  {
    m: "modul-4",
    q: "Suku \\(MSE_{data}\\) bergantung pada …",
    o: ["\\(W\\) saja", "\\(\\lambda_1,\\lambda_2\\) saja", "\\(W,\\lambda_1,\\lambda_2\\)", "Tidak bergantung apa pun"],
    a: 0,
    e: "\\(MSE_{data}=\\frac1n\\sum(u(x_k,W)-u_{true}(x_k))^2\\) hanya bergantung pada \\(W\\). Parameter \\(\\lambda\\) muncul di \\(MSE_{de}\\)."
  },
  {
    m: "modul-4",
    q: "Mengapa loss ditulis sebagai \\(F=[F_{de};F_{data}]\\)?",
    o: [
      "Agar bisa diselesaikan sebagai masalah least squares dengan Levenberg–Marquardt",
      "Agar jumlah data berkurang",
      "Agar tidak perlu menghitung turunan",
      "Agar \\(\\lambda\\) menjadi konstanta"
    ],
    a: 0,
    e: "LM bekerja pada vektor residual \\(F\\) dan Jacobian-nya, meminimalkan \\(\\|F\\|^2\\)."
  },
  {
    m: "modul-4",
    q: "Turunan \\(\\partial F_{de,k}/\\partial\\lambda_1\\) adalah …",
    o: ["\\(e^{\\lambda_2u_k/2}\\)", "\\(\\lambda_1e^{\\lambda_2u_k/2}\\)", "\\(\\frac{u_k}{2}e^{\\lambda_2u_k/2}\\)", "0"],
    a: 0,
    e: "\\(F_{de,k}=u_{xx,k}+\\lambda_1e^{\\lambda_2u_k/2}\\) linear terhadap \\(\\lambda_1\\), sehingga turunannya \\(e^{\\lambda_2u_k/2}\\)."
  },
  {
    m: "modul-4",
    q: "Loss akhir masalah invers pada slide adalah …",
    o: ["\\(9.1483\\times10^{-8}\\)", "\\(2.47038\\times10^{-7}\\)", "\\(3.80874\\times10^{-6}\\)", "\\(1.0\\times10^{-3}\\)"],
    a: 0,
    e: "Inverse PINN Bratu mencapai loss \\(9.1483\\times10^{-8}\\) dengan \\(\\lambda_1\\to1\\) dan \\(\\lambda_2\\to2\\)."
  },
  {
    m: "modul-4",
    q: "Mengapa PINN dianggap efisien untuk masalah invers?",
    o: [
      "Karena tidak memerlukan data sama sekali",
      "Karena parameter cukup ditambahkan sebagai variabel optimasi dan dioptimasi bersama \\(W\\)",
      "Karena hanya bekerja untuk ODE",
      "Karena tidak memerlukan syarat batas"
    ],
    a: 1,
    e: "Tidak perlu berulang kali menyelesaikan masalah maju untuk setiap tebakan \\(\\lambda\\). Semua unknowns dioptimasi sekaligus."
  },
  {
    m: "modul-4",
    q: "Jika \\(\\lambda_1=1,\\lambda_2=2\\) disubstitusikan, residual \\(F_{de}\\) untuk data yang tepat bernilai …",
    o: ["1", "0", "\\(e^{u}\\)", "\\(-e^{u}\\)"],
    a: 1,
    e: "Solusi sebenarnya memenuhi \\(u_{xx}+e^{u}=0\\), sehingga residualnya nol."
  },
  {
    m: "modul-4",
    q: "Optimizer yang dipakai slide untuk masalah invers adalah …",
    o: ["BFGS", "Levenberg–Marquardt", "Gradient descent murni", "Runge–Kutta"],
    a: 1,
    e: "Slide: Optimization: the Levenberg–Marquardt algorithm."
  }
];
