import { Agent, ChatMessage } from "./agents";
import { ApiKeyStore, getDefaultKey as _getDefaultKey, getKeyForAgent } from "./api-keys";
import { callAI, AiMessage } from "./ai-client";
import { extractCodeBlocks, executeCode, ENGINE_LABELS, isCloudEngine, PISTON_PRIVACY_NOTE } from "./executor";

export interface RunPipelineParams {
  task: string;
  agents: Agent[];
  apiKeyStore: ApiKeyStore;
  onMessage: (msg: ChatMessage) => void;
  onThinking: (agentName: string | null) => void;
  signal?: AbortSignal;
  enableExecution?: boolean; // run code after Coder step
}

function buildHistory(messages: ChatMessage[]): AiMessage[] {
  return messages
    .filter((m) => m.role === "assistant" || m.role === "user")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.agentName ? `[${m.agentName}]: ${m.content}` : m.content,
    }));
}

export async function runPipeline(params: RunPipelineParams): Promise<void> {
  const { task, agents, apiKeyStore, onMessage, onThinking, signal, enableExecution = true } = params;
  if (!_getDefaultKey(apiKeyStore)) throw new Error("No API key configured. Please add one in Settings.");

  const activeAgents = agents.filter((a) => a.active);
  if (!activeAgents.length) throw new Error("No active agents in pipeline.");

  const history: ChatMessage[] = [];

  // Add user task message
  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: task,
    timestamp: new Date(),
  };
  history.push(userMsg);
  onMessage(userMsg);

  for (const agent of activeAgents) {
    if (signal?.aborted) break;

    // Pick the key assigned to this agent (falls back to default)
    const apiKey = getKeyForAgent(apiKeyStore, agent.id);
    if (!apiKey) continue;

    onThinking(agent.name);

    // Build context: system prompt + full history
    const contextMessages: AiMessage[] = [
      { role: "system", content: agent.systemPrompt },
      ...buildHistory(history),
    ];

    let fullText = "";
    const msgId = `${agent.id}-${Date.now()}`;

    // Create placeholder message
    const placeholder: ChatMessage = {
      id: msgId,
      role: "assistant",
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      content: "",
      timestamp: new Date(),
    };
    onMessage(placeholder);

    try {
      fullText = await callAI({
        apiKey,
        messages: contextMessages,
        onChunk: (chunk) => {
          fullText += chunk;
          // Update message with streaming content
          onMessage({
            ...placeholder,
            content: fullText,
          });
        },
        signal,
      });
    } catch (e) {
      if (signal?.aborted) break;
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        content: `Error: ${(e as Error).message}`,
        timestamp: new Date(),
      };
      history.push(errMsg);
      onMessage(errMsg);
      onThinking(null);
      throw e;
    }

    const finalMsg: ChatMessage = {
      ...placeholder,
      content: fullText,
    };
    history.push(finalMsg);
    onThinking(null);

    // After Coder step: auto-execute code blocks
    if (enableExecution && agent.role === "coder" && !signal?.aborted) {
      const blocks = extractCodeBlocks(fullText);
      if (blocks.length > 0) {
        onThinking("⚡ Executor");
        const block = blocks[0]; // run first code block
        const result = await executeCode(block.code, block.language);
        const engineLabel = ENGINE_LABELS[result.engine] || result.engine;

        const execMsg: ChatMessage = {
          id: `exec-${Date.now()}`,
          role: "assistant",
          agentId: "executor",
          agentName: "Executor",
          agentRole: "custom",
          content: [
            `**${engineLabel} · ${block.language}**`,
            `\`\`\`\n${result.output || "(no output)"}\n\`\`\``,
            result.error ? `\n⚠️ stderr:\n\`\`\`\n${result.error}\n\`\`\`` : "",
            isCloudEngine(result.engine) ? `\n> ℹ️ ${PISTON_PRIVACY_NOTE}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          timestamp: new Date(),
        };
        history.push(execMsg);
        onMessage(execMsg);
        onThinking(null);
      }
    }

    // Small pause between agents for readability
    if (!signal?.aborted) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}
