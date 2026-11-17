<div align="center">

# ⚡ Pingly

**A fast, private HTTP client in your browser: send requests, inspect responses, copy as cURL.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-8b5cf6?style=flat-square)

</div>

## ✨ Features

- All common methods: `GET POST PUT PATCH DELETE HEAD OPTIONS`
- Query **params** and **headers** editors with per-row enable/disable
- JSON / text **body** with one-click beautify, **Bearer** auth
- Response viewer: status pill, time, size, **syntax-highlighted JSON**, raw view, headers
- **Copy as cURL** and **Copy as fetch**
- **History** of your last 30 requests (click to restore), stored only in your browser
- Dark / light theme, `Ctrl/⌘ + Enter` to send, 30 s timeout
- Zero dependencies, no build step, works offline (except for the APIs you call)

## 🚀 Run it

```bash
git clone https://github.com/SimaKogan/pingly.git
cd pingly
python3 -m http.server 8000     # then open http://localhost:8000
```

**Deploy on GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`.

## ⚠️ About CORS

Pingly runs in the browser, so it can only call APIs that allow cross-origin requests (CORS), such as
`jsonplaceholder.typicode.com`. Requests to servers that don't send CORS headers will fail with a network error.
That is a browser rule, not a bug.

## 🗺 Roadmap

- AI assistant: describe a request in plain language and Pingly fills it in; explain a response
- Collections and environment variables
- Import from cURL

## 👩‍💻 Author

**Sima Kogan**: AI Engineer · Full Stack Developer · [GitHub](https://github.com/SimaKogan)

## 📄 License

MIT © Sima Kogan
