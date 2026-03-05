import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Settings, AlertTriangle } from "lucide-react";
import { ChatMessage, DEFAULT_AGENTS } from "@/lib/agents";
import { AnimatePresence } from "framer-motion";
import { sessionStore, useSessionMessages } from "@/lib/session-store";
import { loadApiKeys, getDefaultKey } from "@/lib/api-keys";
import { runPipeline } from "@/lib/pipeline-runner";
import { useNavigate } from "react-router-dom";
import { AgentMessage } from "@/components/session/AgentMessage";
import { ExamplePrompts } from "@/components/session/ExamplePrompts";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SetupGuide } from "@/components/SetupGuide";

const ThinkingIndicator = ({ agentName }: { agentName: string }) => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground">{agentName} is thinking…</span>
  </div>
);

export default function Session() {
  const navigate = useNavigate();
  const { messages, isRunning, thinkingAgent } = useSessionMessages();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messageMapRef = useRef<Map<string, ChatMessage>>(new Map());
  const agents = DEFAULT_AGENTS;

  const apiKeyStore = loadApiKeys();
  const hasKey = !!getDefaultKey(apiKeyStore);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingAgent]);

  const handleMessage = (msg: ChatMessage) => {
    const existing = messageMapRef.current.get(msg.id);
    if (!existing) {
      messageMapRef.current.set(msg.id, msg);
      sessionStore.addMessage(msg);
    } else {
      messageMapRef.current.set(msg.id, msg);
      sessionStore.setMessages(
        sessionStore.messages.map((m) => (m.id === msg.id ? msg : m)),
      );
    }
  };

  const handleSend = async (text?: string) => {
    const task = (text ?? input).trim();
    if (!task || isRunning) return;
    if (!hasKey) {
      setError("Please add an API key in Settings first.");
      return;
    }

    setError(null);
    messageMapRef.current.clear();
    setInput("");
    sessionStore.setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runPipeline({
        task,
        agents,
        apiKeyStore,
        onMessage: handleMessage,
        onThinking: (name) => sessionStore.setThinkingAgent(name),
        signal: controller.signal,
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setError((e as Error).message);
      }
    } finally {
      sessionStore.setRunning(false);
      sessionStore.setThinkingAgent(null);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    sessionStore.setRunning(false);
    sessionStore.setThinkingAgent(null);
  };

  const handleReset = () => {
    handleStop();
    sessionStore.reset();
    messageMapRef.current.clear();
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <SessionHeader isRunning={isRunning} onStop={handleStop} onReset={handleReset} />

      {/* No API key warning */}
      {!hasKey && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg border border-yellow-800/40 bg-yellow-950/30 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300 flex-1">
            No API key configured. Add one in Settings to start real AI sessions.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-yellow-300 hover:text-yellow-200"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-800/40 bg-red-950/30 p-3">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 ? (
          !hasKey ? (
            <SetupGuide />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
              <div>
                <div className="flex -space-x-3 mb-4 justify-center">
                  {agents.map((a) => (
                    <div
                      key={a.id}
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-lg border-2 border-card`}
                      style={{ background: `var(--${a.color}, hsl(var(--primary)))` }}
                    >
                      {a.icon}
                    </div>
                  ))}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Ready to collaborate</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Describe a coding task and watch 4 agents work together.
                </p>
                <Badge variant="outline" className="mt-3 text-green-400 border-green-800/40 bg-green-950/20 text-xs">
                  ✓ API key ready
                </Badge>
              </div>
              <ExamplePrompts onSelect={(p) => handleSend(p)} />
            </div>
          )
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <AgentMessage key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
        )}

        {thinkingAgent && <ThinkingIndicator agentName={thinkingAgent} />}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              !hasKey
                ? "Add an API key in Settings to start…"
                : isRunning
                ? "Agents are working…"
                : 'Describe a task, e.g. "Build a login form with validation"'
            }
            disabled={isRunning || !hasKey}
            rows={1}
            className="resize-none bg-background text-sm min-h-[40px]"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isRunning || !hasKey}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
