import { describe, it, expect, beforeEach } from "vitest";
import {
  loadApiKeys,
  saveApiKeys,
  clearApiKeys,
  maskApiKey,
  getDefaultKey,
  getKeyForAgent,
  type ApiKeyConfig,
  type ApiKeyStore,
} from "../lib/api-keys";

const makeKey = (overrides: Partial<ApiKeyConfig> = {}): ApiKeyConfig => ({
  id: "key-1",
  provider: "openai",
  apiKey: "sk-test1234567890abcd",
  model: "gpt-4o-mini",
  label: "Test Key",
  ...overrides,
});

const makeStore = (overrides: Partial<ApiKeyStore> = {}): ApiKeyStore => ({
  keys: [makeKey()],
  defaultKeyId: "key-1",
  agentAssignments: [],
  ...overrides,
});

describe("maskApiKey", () => {
  it("masks middle of long keys", () => {
    expect(maskApiKey("sk-test1234567890abcd")).toBe("sk-t••••••••abcd");
  });

  it("returns placeholder for short keys", () => {
    expect(maskApiKey("short")).toBe("••••••••");
  });

  it("handles exactly 8 chars", () => {
    expect(maskApiKey("12345678")).toBe("••••••••");
  });
});

describe("loadApiKeys / saveApiKeys", () => {
  beforeEach(() => clearApiKeys());

  it("returns empty store when nothing saved", () => {
    const store = loadApiKeys();
    expect(store.keys).toHaveLength(0);
    expect(store.defaultKeyId).toBeNull();
    expect(store.agentAssignments).toEqual([]);
  });

  it("round-trips correctly", () => {
    const store = makeStore();
    saveApiKeys(store);
    const loaded = loadApiKeys();
    expect(loaded.keys).toHaveLength(1);
    expect(loaded.keys[0].id).toBe("key-1");
    expect(loaded.defaultKeyId).toBe("key-1");
  });

  it("fills missing agentAssignments on load", () => {
    // Simulate old format without agentAssignments
    localStorage.setItem(
      "agent_harmony_keys",
      JSON.stringify({ keys: [makeKey()], defaultKeyId: "key-1" }),
    );
    const loaded = loadApiKeys();
    expect(loaded.agentAssignments).toEqual([]);
  });
});

describe("getDefaultKey", () => {
  it("returns null for empty store", () => {
    expect(getDefaultKey({ keys: [], defaultKeyId: null, agentAssignments: [] })).toBeNull();
  });

  it("returns key matching defaultKeyId", () => {
    const store = makeStore();
    expect(getDefaultKey(store)?.id).toBe("key-1");
  });

  it("falls back to first key if defaultKeyId not found", () => {
    const store = makeStore({ defaultKeyId: "nonexistent" });
    expect(getDefaultKey(store)?.id).toBe("key-1");
  });
});

describe("getKeyForAgent", () => {
  it("returns default key when no assignment", () => {
    const store = makeStore();
    expect(getKeyForAgent(store, "planner-1")?.id).toBe("key-1");
  });

  it("returns assigned key when assignment exists", () => {
    const key2 = makeKey({ id: "key-2", label: "Key 2" });
    const store = makeStore({
      keys: [makeKey(), key2],
      agentAssignments: [{ agentId: "planner-1", keyId: "key-2" }],
    });
    expect(getKeyForAgent(store, "planner-1")?.id).toBe("key-2");
  });

  it("falls back to default if assigned keyId is invalid", () => {
    const store = makeStore({
      agentAssignments: [{ agentId: "planner-1", keyId: "nonexistent" }],
    });
    expect(getKeyForAgent(store, "planner-1")?.id).toBe("key-1");
  });

  it("returns default for unassigned agent", () => {
    const store = makeStore({
      agentAssignments: [{ agentId: "coder-1", keyId: "key-1" }],
    });
    expect(getKeyForAgent(store, "tester-1")?.id).toBe("key-1");
  });
});
