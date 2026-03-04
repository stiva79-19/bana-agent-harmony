import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, Trash2, CheckCircle2, XCircle, Loader2, ShieldCheck, Star } from "lucide-react";
import {
  Provider,
  ApiKeyConfig,
  ApiKeyStore,
  loadApiKeys,
  saveApiKeys,
  maskApiKey,
  PROVIDER_LABELS,
  PROVIDER_BASE_URLS,
  getDefaultModel,
  AGENT_ROLE_SUGGESTED_PROVIDER,
} from "@/lib/api-keys";
import { testApiKey } from "@/lib/ai-client";
import { getCapabilities, type Capabilities } from "@/lib/executor";
import { DEFAULT_AGENTS } from "@/lib/agents";

const PROVIDERS: Provider[] = ["openai", "anthropic", "google", "openrouter", "kimi", "custom"];

export default function SettingsPage() {
  const [store, setStore] = useState<ApiKeyStore>({ keys: [], defaultKeyId: null, agentAssignments: [] });
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [checkingCaps, setCheckingCaps] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [adding, setAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});

  useEffect(() => {
    setStore(loadApiKeys());
    // check execution capabilities on mount
    setCheckingCaps(true);
    getCapabilities().then((c) => { setCaps(c); setCheckingCaps(false); });
  }, []);

  useEffect(() => {
    if (provider !== "custom") {
      setBaseUrlInput("");
      setModelInput(getDefaultModel(provider));
    } else {
      setBaseUrlInput("");
      setModelInput("");
    }
  }, [provider]);

  const persist = (next: ApiKeyStore) => {
    setStore(next);
    saveApiKeys(next);
  };

  const handleAdd = () => {
    if (!apiKeyInput.trim()) return;
    setAdding(true);
    const newKey: ApiKeyConfig = {
      id: `key-${Date.now()}`,
      provider,
      apiKey: apiKeyInput.trim(),
      baseUrl: baseUrlInput.trim() || undefined,
      model: modelInput.trim() || getDefaultModel(provider),
      label: labelInput.trim() || PROVIDER_LABELS[provider],
    };
    const next: ApiKeyStore = {
      keys: [...store.keys, newKey],
      defaultKeyId: store.defaultKeyId ?? newKey.id,
    };
    persist(next);
    setApiKeyInput("");
    setLabelInput("");
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    const keys = store.keys.filter((k) => k.id !== id);
    const defaultKeyId =
      store.defaultKeyId === id ? (keys[0]?.id ?? null) : store.defaultKeyId;
    persist({ keys, defaultKeyId });
  };

  const handleSetDefault = (id: string) => {
    persist({ ...store, defaultKeyId: id });
  };

  const handleTest = async (key: ApiKeyConfig) => {
    setTestingId(key.id);
    const result = await testApiKey(key);
    setTestResults((prev) => ({ ...prev, [key.id]: result }));
    setTestingId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage API keys and platform configuration</p>
      </div>

      {/* Security Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-3 rounded-lg border border-green-800/40 bg-green-950/30 p-4">
          <ShieldCheck className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-300">Your API keys are safe</p>
            <p className="text-xs text-green-400/80 mt-1">
              Keys are stored only in your browser&apos;s localStorage. They are <strong>never sent to any server</strong>. All AI calls are made directly from your browser to the AI provider.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Add Key */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Provider</Label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      provider === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {PROVIDER_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key input */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Custom base URL */}
            {provider === "custom" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Base URL (OpenAI compatible)</Label>
                <Input
                  placeholder="http://localhost:11434/v1"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Model override */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Model (optional, uses default if empty)</Label>
              <Input
                placeholder={getDefaultModel(provider)}
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Label (optional)</Label>
              <Input
                placeholder={PROVIDER_LABELS[provider]}
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="text-sm"
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!apiKeyInput.trim() || adding || (provider === "custom" && !baseUrlInput.trim())}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Key
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Saved Keys */}
      {store.keys.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Saved API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {store.keys.map((key) => {
                const isDefault = store.defaultKeyId === key.id;
                const testResult = testResults[key.id];
                const isTesting = testingId === key.id;
                return (
                  <div
                    key={key.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isDefault ? "border-primary/40 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">{key.label}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {PROVIDER_LABELS[key.provider]}
                        </Badge>
                        {isDefault && (
                          <Badge className="text-[10px] bg-primary/20 text-primary border-0 shrink-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{maskApiKey(key.apiKey)}</p>
                      {key.model && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{key.model}</p>
                      )}
                      {testResult && (
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                          {testResult.ok ? (
                            <><CheckCircle2 className="h-3 w-3" /> Connected</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> {testResult.error?.slice(0, 60)}</>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleSetDefault(key.id)}
                          title="Set as default"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTest(key)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => handleDelete(key.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Agent Model Assignment */}
      {store.keys.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Agent Model Assignment</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a different API key to each agent. Each agent can use the model it&apos;s best at.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEFAULT_AGENTS.map((agent) => {
                const assignment = store.agentAssignments.find((a) => a.agentId === agent.id);
                const currentKeyId = assignment?.keyId ?? null;
                const suggestedProvider = AGENT_ROLE_SUGGESTED_PROVIDER[agent.role];

                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-base shrink-0">
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{agent.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{agent.role}</Badge>
                        {!currentKeyId && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                            suggested: {PROVIDER_LABELS[suggestedProvider]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                    </div>
                    <select
                      value={currentKeyId ?? ""}
                      onChange={(e) => {
                        const keyId = e.target.value || null;
                        const assignments = store.agentAssignments.filter((a) => a.agentId !== agent.id);
                        if (keyId) assignments.push({ agentId: agent.id, keyId });
                        persist({ ...store, agentAssignments: assignments });
                      }}
                      className="text-xs bg-secondary border border-border rounded-md px-2 py-1.5 text-foreground shrink-0 max-w-[160px]"
                    >
                      <option value="">Default key</option>
                      {store.keys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label} ({k.model || getDefaultModel(k.provider)})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Assign <strong>Claude</strong> to Planner, <strong>Codex/GPT</strong> to Coder, <strong>Gemini</strong> to Reviewer, <strong>Kimi</strong> to Tester for the best multi-model results.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Execution Engine */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              ⚡ Execution Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              After the Coder agent writes code, the Executor automatically runs it and passes the result to the Reviewer. No extra setup required — uses the best available engine.
            </p>

            {checkingCaps ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking local server…
              </div>
            ) : caps ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Detected engines (priority order):</p>
                {[
                  { key: "claude", label: "Claude CLI", note: "Best — uses your claude key" },
                  { key: "codex", label: "Codex CLI", note: "OpenAI codex CLI" },
                  { key: "node", label: "Local Node.js", note: "JS/TS — no key needed" },
                  { key: "python", label: "Local Python", note: "Python — no key needed" },
                  { key: "bash", label: "Local Bash", note: "Shell scripts" },
                ].map(({ key, label, note }) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/40">
                    <div>
                      <span className="text-sm text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{note}</span>
                    </div>
                    {caps[key as keyof Capabilities] ? (
                      <Badge className="bg-green-900/40 text-green-400 border-0 text-[10px]">✓ Available</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Not found</Badge>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/40">
                  <div>
                    <span className="text-sm text-foreground">Piston API</span>
                    <span className="text-xs text-muted-foreground ml-2">Cloud fallback — 75+ languages, free, no key</span>
                  </div>
                  <Badge className="bg-blue-900/40 text-blue-400 border-0 text-[10px]">☁️ Always on</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md border border-yellow-800/40 bg-yellow-950/20 p-3">
                  <p className="text-xs text-yellow-300 font-medium">Local server not running</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Run <code className="font-mono bg-black/30 px-1 rounded">npm start</code> (instead of <code className="font-mono bg-black/30 px-1 rounded">npm run dev</code>) to enable local code execution.
                  </p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Piston API (cloud) is still active as fallback.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setCheckingCaps(true);
                    getCapabilities().then((c) => { setCaps(c); setCheckingCaps(false); });
                  }}
                >
                  Retry detection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Providers Reference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Supported Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROVIDERS.map((p) => (
              <div key={p} className="flex items-center justify-between text-sm py-1">
                <span className="text-foreground">{PROVIDER_LABELS[p]}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {p === "custom" ? "any OpenAI-compat endpoint" : PROVIDER_BASE_URLS[p]}
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-2">
              You can also use local models (Ollama, LM Studio) via Custom endpoint.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
