export type Provider = "openai" | "anthropic" | "google" | "openrouter" | "custom";

export interface ApiKeyConfig {
  id: string;
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  label?: string;
}

export interface ApiKeyStore {
  keys: ApiKeyConfig[];
  defaultKeyId: string | null;
}

const STORAGE_KEY = "agent_harmony_keys";

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
  custom: "gpt-4o-mini",
};

export const PROVIDER_BASE_URLS: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
  openrouter: "https://openrouter.ai/api/v1",
  custom: "",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  openrouter: "OpenRouter",
  custom: "Custom (OpenAI compat.)",
};

export function getDefaultModel(provider: Provider): string {
  return DEFAULT_MODELS[provider];
}

export function loadApiKeys(): ApiKeyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { keys: [], defaultKeyId: null };
    return JSON.parse(raw) as ApiKeyStore;
  } catch {
    return { keys: [], defaultKeyId: null };
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

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
