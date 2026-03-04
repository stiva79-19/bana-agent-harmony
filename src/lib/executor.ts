/**
 * Browser-side executor client.
 * Tries local execution server first, falls back to Piston API.
 */

const LOCAL_SERVER = "http://localhost:3001";
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

export interface ExecutionResult {
  output: string;
  error: string | null;
  engine: "claude" | "codex" | "local" | "piston" | "unavailable";
  language: string;
}

export interface Capabilities {
  claude: boolean;
  codex: boolean;
  python: boolean;
  node: boolean;
  bash: boolean;
  pistonFallback: boolean;
}

let _localAvailable: boolean | null = null;
let _capabilities: Capabilities | null = null;

async function checkLocalServer(): Promise<boolean> {
  if (_localAvailable !== null) return _localAvailable;
  try {
    const res = await fetch(`${LOCAL_SERVER}/api/capabilities`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      _capabilities = data.capabilities;
      _localAvailable = true;
      return true;
    }
  } catch {}
  _localAvailable = false;
  return false;
}

export async function getCapabilities(): Promise<Capabilities | null> {
  await checkLocalServer();
  return _capabilities;
}

// Extract code blocks from agent messages
export function extractCodeBlocks(text: string): Array<{ code: string; language: string }> {
  const blocks: Array<{ code: string; language: string }> = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "javascript",
      code: match[2].trim(),
    });
  }
  return blocks;
}

async function runWithPiston(code: string, language: string): Promise<ExecutionResult> {
  const langMap: Record<string, { language: string; version: string }> = {
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
  };

  const mapped = langMap[language] || { language: "javascript", version: "18.15.0" };

  const res = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...mapped, files: [{ content: code }] }),
  });

  if (!res.ok) throw new Error(`Piston error ${res.status}`);
  const data = await res.json();
  const output = data.run?.stdout?.trim() || data.run?.stderr?.trim() || "(no output)";
  return { output, error: data.run?.stderr?.trim() || null, engine: "piston", language };
}

export async function executeCode(
  code: string,
  language = "javascript",
  preferredEngine?: string,
): Promise<ExecutionResult> {
  // Try local server first
  const hasLocal = await checkLocalServer();
  if (hasLocal) {
    try {
      const res = await fetch(`${LOCAL_SERVER}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, engine: preferredEngine }),
        signal: AbortSignal.timeout(35000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          output: data.output,
          error: data.error,
          engine: data.engine,
          language: data.language || language,
        };
      }
    } catch {}
  }

  // Fallback: Piston API (no key needed)
  try {
    return await runWithPiston(code, language);
  } catch (e) {
    return {
      output: "",
      error: (e as Error).message,
      engine: "unavailable",
      language,
    };
  }
}

export const ENGINE_LABELS: Record<string, string> = {
  claude: "⚡ Claude CLI",
  codex: "⚡ Codex CLI",
  local: "⚡ Local",
  piston: "☁️ Piston",
  unavailable: "❌ Failed",
};
