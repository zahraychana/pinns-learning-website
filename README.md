# PINNs Learning Website

A simple static website for learning **Physics-Informed Neural Networks (PINNs)**, with study material, exercises, and references.

🌐 **Result:** (https://pinnsweb.infinityfree.io/)

## Features

- **Study material**: PINNs explained step by step.
- **Exercises**: practice problems with result images.
- **References**: papers and sources for further reading.
- **Responsive**: works on both desktop and mobile.

## Topics

1. Feedforward Neural Networks
2. Differential Equations
3. PINNs: Forward Problems
4. PINNs: Inverse Problems

## Pages

| File | Description |
|---|---|
| `index.html` | Home page |
| `materi.html` | Study material |
| `latihan.html` | Exercises and results |
| `reference.html` | References |

## Project Structure

```
pinns-learning-website/
├── index.html
├── materi.html
├── latihan.html
├── reference.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── assets/
    └── images/
```

## Tech Stack

- HTML5
- CSS3
- JavaScript (vanilla, no frameworks)

## Getting Started

**Option 1:** Open `index.html` in your browser.

**Option 2:** Run a local server:

```bash
git clone https://github.com/zahraychana/pinns-learning-website.git
cd pinns-learning-website
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy with GitHub Pages

1. Go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then click **Save**.

## License

This project is licensed under the [MIT License](LICENSE).
