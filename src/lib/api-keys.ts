export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "kimi"
  | "custom";

export interface ApiKeyConfig {
  id: string;
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  label?: string;
}

export interface AgentModelAssignment {
  agentId: string;
  keyId: string | null; // null = use default
}

export interface ApiKeyStore {
  keys: ApiKeyConfig[];
  defaultKeyId: string | null;
  agentAssignments: AgentModelAssignment[]; // per-agent key overrides
}

const STORAGE_KEY = "agent_harmony_keys";

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
  kimi: "moonshot-v1-8k",
  custom: "gpt-4o-mini",
};

export const PROVIDER_BASE_URLS: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
  openrouter: "https://openrouter.ai/api/v1",
  kimi: "https://api.moonshot.cn/v1",
  custom: "",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  openrouter: "OpenRouter",
  kimi: "Kimi (Moonshot AI)",
  custom: "Custom (OpenAI compat.)",
};

// Suggested model per provider for each agent role
export const PROVIDER_SUGGESTED_MODELS: Record<Provider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "o4-mini"],
  anthropic: [
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
    "claude-sonnet-4-5",
  ],
  google: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  openrouter: ["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "google/gemini-flash-1.5"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k", "kimi-latest"],
  custom: [],
};

export const AGENT_ROLE_SUGGESTED_PROVIDER: Record<string, Provider> = {
  planner: "anthropic",   // Claude best at planning & reasoning
  coder: "openai",        // Codex/GPT best at coding
  reviewer: "google",     // Gemini's wide context good for review
  tester: "kimi",         // Kimi fast & cheap for test generation
  custom: "openai",
};

export function getDefaultModel(provider: Provider): string {
  return DEFAULT_MODELS[provider];
}

export function loadApiKeys(): ApiKeyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { keys: [], defaultKeyId: null, agentAssignments: [] };
    const parsed = JSON.parse(raw) as ApiKeyStore;
    return { agentAssignments: [], ...parsed };
  } catch {
    return { keys: [], defaultKeyId: null, agentAssignments: [] };
  }
}

export function saveApiKeys(store: ApiKeyStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultKey(store: ApiKeyStore): ApiKeyConfig | null {
  if (!store.keys.length) return null;
  if (store.defaultKeyId) {
    const key = store.keys.find((k) => k.id === store.defaultKeyId);
    if (key) return key;
  }
  return store.keys[0];
}

/** Get the key assigned to a specific agent, falling back to default */
export function getKeyForAgent(store: ApiKeyStore, agentId: string): ApiKeyConfig | null {
  const assignment = store.agentAssignments.find((a) => a.agentId === agentId);
  if (assignment?.keyId) {
    const key = store.keys.find((k) => k.id === assignment.keyId);
    if (key) return key;
  }
  return getDefaultKey(store);
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
