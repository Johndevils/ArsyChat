# Arsychat Ai - Multi-Model Parallel Workspace

**Arsychat Ai** is a high-performance, production-ready frontend interface designed for side-by-side AI model comparison. It allows users to send a single prompt and receive simultaneous responses from four different AI engines (**GLM, Kimi, DeepSeek, and Qwen**) using parallel asynchronous architecture.

## 🚀 Key Features

*   **Parallel Processing:** Sends 4 independent asynchronous GET requests simultaneously without blocking the UI.
*   **ChatGPT-Style UX:** Modern dark-mode interface with a fixed bottom input and auto-expanding textarea.
*   **Markdown Support:** Full rendering of code blocks, tables, and formatting using `marked.js`.
*   **Responsive Grid:** Intelligently switches from a 4-column desktop layout to a scrollable mobile view.
*   **Zero Dependencies:** Built with pure Vanilla JavaScript and Tailwind CSS (CDN)—no build steps required.
*   **Error Handling:** Per-model error catching ensures that if one API fails, the others continue to render.

## 🛠️ Tech Stack

- **HTML5:** Semantic structure.
- **Tailwind CSS:** Modern, utility-first styling with glassmorphism effects.
- **Vanilla JavaScript:** Core logic, Fetch API, and DOM manipulation.
- **Marked.js:** High-speed Markdown parsing.
- **Google Fonts:** "Inter" and "Plus Jakarta Sans" for premium typography.

## 📂 Project Structure

```text
├── index.html          # Single-file application (Code, CSS, and JS)
└── README.md           # Documentation
```

## ⚙️ How It Works

The app utilizes the **Fetch API** to hit four specific endpoints using the `GET` method. Every submission follows this lifecycle:

1.  **Sanitization:** Encodes the user prompt to handle special characters (e.g., `?`, `&`, `#`) safely in the URL.
2.  **State Management:** Disables the UI and triggers 4 independent loading skeletons.
3.  **Concurrency:** Uses `Promise.allSettled` or individual async triggers to ensure maximum speed.
4.  **Parsing:** Dynamically converts the raw API strings/JSON into formatted HTML.

### API Endpoints Used:
- **GLM:** `.../api/glm/v1/chat/completions?prompt={query}`
- **KIMI:** `.../api/kimi/v1/chat/completions?prompt={query}`
- **DeepSeek:** `.../api/deepseek/v1/chat/completions?prompt={query}`
- **Qwen:** `.../api/qwen/v1/chat/completions?prompt={query}`

## 📝 Usage

1.  Copy the provided `index.html` code.
2.  Save it locally as `index.html`.
3.  Open the file in any modern web browser (Chrome, Edge, Safari, Firefox).
4.  Type your prompt in the box (e.g., *"Write a Hinglish blog post about AI"*) and hit Enter.

## 🛡️ Disclaimer

This is a frontend implementation. The availability of responses depends entirely on the status of the `arsychat-api.metaspace.workers.dev` endpoints. Ensure you have an active internet connection to load the Tailwind and Marked.js CDNs.

---
**Developed with focus on UI/UX & Performance.**
