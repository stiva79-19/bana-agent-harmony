/**
 * Agent Harmony — Local Execution Server
 * Runs on port 3001. Bridges the browser to local CLI tools.
 * Auto-detects: claude, codex, python, node, bash
 * Falls back to Piston API if nothing is available locally.
 */

import express from "express";
import { exec, execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);
const app = express();
app.use(express.json({ limit: "1mb" }));

// CORS for local Vite dev server
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Capability Detection ─────────────────────────────────────────────────────

async function isAvailable(cmd) {
  try {
    await execAsync(`which ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

async function detectCapabilities() {
  const [hasClaude, hasCodex, hasPython, hasPython3, hasNode, hasBash] =
    await Promise.all([
      isAvailable("claude"),
      isAvailable("codex"),
      isAvailable("python"),
      isAvailable("python3"),
      isAvailable("node"),
      isAvailable("bash"),
    ]);

  return {
    claude: hasClaude,
    codex: hasCodex,
    python: hasPython || hasPython3,
    pythonCmd: hasPython3 ? "python3" : hasPython ? "python" : null,
    node: hasNode,
    bash: hasBash,
    pistonFallback: true, // always available
  };
}

let capabilities = null;

app.get("/api/capabilities", async (req, res) => {
  capabilities = await detectCapabilities();
  res.json({ ok: true, capabilities });
});

// ─── Execution Engines ────────────────────────────────────────────────────────

// Detect language from code block or filename
function detectLanguage(code, hint) {
  if (hint) return hint.toLowerCase();
  if (code.includes("def ") || code.includes("import ") && !code.includes("from '"))
    return "python";
  if (code.includes("func ") && code.includes("fmt.")) return "go";
  if (code.includes("fn main") || code.includes("println!")) return "rust";
  if (code.includes("#!/bin/bash") || code.startsWith("#!")) return "bash";
  return "javascript"; // default
}

// Extract code from markdown code block if present
function extractCode(text) {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (match) return { code: match[1].trim(), lang: text.match(/```(\w+)/)?.[1] };
  return { code: text.trim(), lang: null };
}

// Run via claude CLI
async function runWithClaude(code, language, timeout = 30000) {
  const prompt = `Run this ${language} code and show me only the output (no explanation):\n\`\`\`${language}\n${code}\n\`\`\``;
  const { stdout, stderr } = await execAsync(
    `echo ${JSON.stringify(prompt)} | claude --print --no-markdown`,
    { timeout }
  );
  return { output: stdout.trim(), engine: "claude", error: stderr || null };
}

// Run via codex CLI
async function runWithCodex(code, language, timeout = 30000) {
  const prompt = `Execute this ${language} code and return only the output:\n${code}`;
  const { stdout } = await execAsync(
    `echo ${JSON.stringify(prompt)} | codex --quiet`,
    { timeout }
  );
  return { output: stdout.trim(), engine: "codex", error: null };
}

// Run directly on local machine
async function runLocally(code, language, caps) {
  const tmpDir = join(tmpdir(), "agent-harmony");
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });

  const ext = { javascript: "js", python: "py", bash: "sh", typescript: "ts" }[language] || "txt";
  const tmpFile = join(tmpDir, `run_${Date.now()}.${ext}`);

  try {
    await writeFile(tmpFile, code, "utf8");

    let cmd;
    switch (language) {
      case "javascript":
      case "js":
        if (!caps.node) throw new Error("node not found");
        cmd = `node ${tmpFile}`;
        break;
      case "python":
      case "py":
        if (!caps.pythonCmd) throw new Error("python not found");
        cmd = `${caps.pythonCmd} ${tmpFile}`;
        break;
      case "bash":
      case "sh":
        if (!caps.bash) throw new Error("bash not found");
        cmd = `bash ${tmpFile}`;
        break;
      default:
        throw new Error(`Local execution not supported for: ${language}`);
    }

    const { stdout, stderr } = await execAsync(cmd, { timeout: 15000 });
    return { output: stdout.trim(), error: stderr.trim() || null, engine: "local" };
  } finally {
    unlink(tmpFile).catch(() => {});
  }
}

// Piston API fallback (no key needed)
async function runWithPiston(code, language) {
  const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

  const langMap = {
    javascript: { language: "javascript", version: "18.15.0" },
    js:         { language: "javascript", version: "18.15.0" },
    typescript: { language: "typescript", version: "5.0.3" },
    ts:         { language: "typescript", version: "5.0.3" },
    python:     { language: "python",     version: "3.10.0" },
    py:         { language: "python",     version: "3.10.0" },
    bash:       { language: "bash",       version: "5.2.0" },
    sh:         { language: "bash",       version: "5.2.0" },
    go:         { language: "go",         version: "1.16.2" },
    rust:       { language: "rust",       version: "1.50.0" },
    java:       { language: "java",       version: "15.0.2" },
    cpp:        { language: "c++",        version: "10.2.0" },
    c:          { language: "c",          version: "10.2.0" },
  };

  const mapped = langMap[language] || { language: "javascript", version: "18.15.0" };

  const res = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...mapped,
      files: [{ content: code }],
    }),
  });

  if (!res.ok) throw new Error(`Piston error ${res.status}`);
  const data = await res.json();
  const output = data.run?.stdout || data.run?.stderr || "(no output)";
  const error = data.run?.stderr || null;
  return { output: output.trim(), error, engine: "piston" };
}

// ─── Main Execute Endpoint ────────────────────────────────────────────────────

app.post("/api/execute", async (req, res) => {
  const { code: rawCode, language: langHint, engine: preferredEngine } = req.body;

  if (!rawCode) return res.status(400).json({ error: "No code provided" });

  const { code, lang } = extractCode(rawCode);
  const language = detectLanguage(code, langHint || lang);

  if (!capabilities) capabilities = await detectCapabilities();

  let result;
  const errors = [];

  // Try engines in priority order
  const engineOrder = preferredEngine
    ? [preferredEngine, "local", "piston"]
    : capabilities.claude
    ? ["claude", "local", "piston"]
    : capabilities.codex
    ? ["codex", "local", "piston"]
    : ["local", "piston"];

  for (const eng of [...new Set(engineOrder)]) {
    try {
      switch (eng) {
        case "claude":
          if (!capabilities.claude) continue;
          result = await runWithClaude(code, language);
          break;
        case "codex":
          if (!capabilities.codex) continue;
          result = await runWithCodex(code, language);
          break;
        case "local":
          result = await runLocally(code, language, capabilities);
          break;
        case "piston":
          result = await runWithPiston(code, language);
          break;
        default:
          continue;
      }
      break; // success
    } catch (e) {
      errors.push(`${eng}: ${e.message}`);
    }
  }

  if (!result) {
    return res.status(500).json({ error: "All execution engines failed", details: errors });
  }

  res.json({ ok: true, language, ...result, triedEngines: errors });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.EXECUTION_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚡ Agent Harmony Execution Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  detectCapabilities().then((caps) => {
    capabilities = caps;
    const available = Object.entries(caps)
      .filter(([k, v]) => v && k !== "pistonFallback" && k !== "pythonCmd")
      .map(([k]) => k);
    console.log(`   Available engines: ${available.join(", ")}, piston (fallback)`);
    console.log(``);
  });
});
