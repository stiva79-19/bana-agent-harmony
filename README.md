# 🤖 Agent Harmony

**Open-source multi-agent orchestration UI** — Watch AI agents collaborate in real time.

Submit a task, and a pipeline of specialized agents (Planner → Coder → Reviewer → Tester) work together using your own API key. No backend, no data collection — everything runs in your browser.

![Agent Harmony](https://img.shields.io/badge/status-beta-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

---

## ✨ Features

- 🧠 **Multi-agent pipeline** — Planner, Coder, Reviewer, Tester collaborate sequentially
- 🔑 **Bring your own API key** — OpenAI, Anthropic, Google Gemini, OpenRouter, or any OpenAI-compatible endpoint (Ollama, LM Studio, Groq, etc.)
- 🔒 **100% client-side** — API keys stored only in your browser's localStorage, never sent to any server
- ⚡ **Streaming responses** — See each agent's output token by token in real time
- 🛑 **Interruptible** — Stop the pipeline at any time
- 🎨 **Dark UI** — Built with shadcn/ui + Tailwind

---

## 🚀 Quick Start

### Option 1 — One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/stiva79-19/bana-agent-harmony/main/install.sh | bash
```

### Option 2 — Manual

```bash
# Clone
git clone https://github.com/stiva79-19/bana-agent-harmony.git
cd bana-agent-harmony

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:8080** in your browser.

> **First time?** Go to **Settings** and add your API key. The app will guide you.

---

## 🔑 Supported Providers

| Provider | API Key Source | Notes |
|---|---|---|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | GPT-4o, GPT-4o-mini, etc. |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com) | Claude 3.5 Haiku, Sonnet |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | Gemini 2.0 Flash, Pro |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | 200+ models via one key |
| **Custom** | — | Any OpenAI-compatible endpoint |

**Local models** (no API key needed):
- [Ollama](https://ollama.ai) → `http://localhost:11434/v1`
- [LM Studio](https://lmstudio.ai) → `http://localhost:1234/v1`

---

## 🏗️ Architecture

```
src/
├── lib/
│   ├── api-keys.ts        # Secure localStorage key management
│   ├── ai-client.ts       # Real AI calls with streaming (all providers)
│   ├── pipeline-runner.ts # Agent pipeline execution
│   ├── agents.ts          # Agent definitions & system prompts
│   └── session-store.ts   # Global session state
├── pages/
│   ├── Index.tsx          # Dashboard
│   ├── Session.tsx        # Live agent chat
│   ├── Agents.tsx         # Agent configuration
│   ├── Pipelines.tsx      # Pipeline configuration
│   └── SettingsPage.tsx   # API key management
└── components/
    ├── AppSidebar.tsx
    └── ui/                # shadcn/ui components
```

---

## 🔒 Security & Privacy

- **API keys never leave your browser.** All AI calls are made directly from your browser to the AI provider (OpenAI, Anthropic, etc.).
- Keys are stored in `localStorage` under the key `agent_harmony_keys`.
- This app has no backend, no analytics, no tracking.
- To remove all data: open DevTools → Application → Local Storage → delete `agent_harmony_keys`.

---

## 🛠️ Development

```bash
npm run dev      # Start dev server (port 8080)
npm run build    # Production build
npm run preview  # Preview production build
npm run test     # Run tests
npm run lint     # Lint
```

**Tech stack:** Vite · React 18 · TypeScript (strict) · Tailwind CSS · shadcn/ui · Framer Motion

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome!

Ideas for contribution:
- New agent roles (Designer, DevOps, Security, etc.)
- Custom pipeline builder UI
- Export session as markdown/PDF
- Parallel agent execution
- Local model auto-detection

---

## 📄 License

MIT — see [LICENSE](LICENSE)
