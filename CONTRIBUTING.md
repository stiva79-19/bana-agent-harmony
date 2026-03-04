# Contributing to Agent Harmony

Thanks for your interest! This project welcomes contributions of all kinds.

## Getting Started

```bash
git clone https://github.com/stiva79-19/bana-agent-harmony.git
cd bana-agent-harmony
npm install
npm run dev
```

## How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/your-feature`
3. **Make changes** — TypeScript strict, no `any`, `npm run build` must pass
4. **Commit**: `git commit -m "feat: describe what you did"`
5. **Push**: `git push origin feat/your-feature`
6. **Open a PR**

## Ideas for Contribution

- 🎭 **New agent roles** — Designer, DevOps, Security Auditor, Docs Writer
- 🔀 **Parallel agents** — run agents concurrently instead of sequentially
- 🎨 **Custom pipeline builder** — drag-and-drop agent ordering
- 📤 **Export** — save session as Markdown, PDF, or JSON
- 🌐 **i18n** — internationalization support
- 🔍 **Agent inspector** — view system prompts, token counts, latency
- 🤖 **Auto-detect local models** — ping Ollama/LM Studio and list available models

## Code Style

- TypeScript strict mode — no `any`
- Keep components small and focused
- No backend dependencies — this is a pure client-side app
- API keys must never leave the browser (no `fetch` to your own servers)

## Security

If you find a security issue, please open a private GitHub Security Advisory instead of a public issue.
