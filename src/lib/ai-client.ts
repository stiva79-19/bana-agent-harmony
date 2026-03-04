import { ApiKeyConfig, PROVIDER_BASE_URLS, getDefaultModel } from "./api-keys";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallAiParams {
  apiKey: ApiKeyConfig;
  messages: AiMessage[];
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

async function callOpenAiCompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AiMessage[],
  headers: Record<string, string>,
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: !!onChunk,
      max_tokens: 2048,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Streaming
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const json = line.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return full;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: AiMessage[],
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      ...(onChunk ? { "anthropic-stream": "true" } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemMsg?.content,
      messages: chatMessages,
      stream: !!onChunk,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic error ${res.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const json = line.slice(6).trim();
      try {
        const parsed = JSON.parse(json);
        if (parsed.type === "content_block_delta") {
          const delta = parsed.delta?.text ?? "";
          if (delta) {
            full += delta;
            onChunk(delta);
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return full;
}

async function callGoogle(
  apiKey: string,
  model: string,
  messages: AiMessage[],
  onChunk?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const endpoint = onChunk
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      contents,
      generationConfig: { maxOutputTokens: 2048 },
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Google error ${res.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      try {
        const parsed = JSON.parse(json);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        // ignore
      }
    }
  }
  return full;
}

export async function callAI(params: CallAiParams): Promise<string> {
  const { apiKey, messages, onChunk, signal } = params;
  const model = apiKey.model || getDefaultModel(apiKey.provider);
  const baseUrl = apiKey.baseUrl || PROVIDER_BASE_URLS[apiKey.provider];

  switch (apiKey.provider) {
    case "anthropic":
      return callAnthropic(apiKey.apiKey, model, messages, onChunk, signal);
    case "google":
      return callGoogle(apiKey.apiKey, model, messages, onChunk, signal);
    // kimi uses OpenAI-compat endpoint at moonshot.cn
    case "kimi":
    default:
      return callOpenAiCompat(baseUrl, apiKey.apiKey, model, messages, {}, onChunk, signal);
  }
}

export async function testApiKey(apiKey: ApiKeyConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    await callAI({
      apiKey,
      messages: [{ role: "user", content: "Say OK" }],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
