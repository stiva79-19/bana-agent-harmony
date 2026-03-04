import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Pause, Play, RotateCcw, ChevronDown, Bot, Settings, AlertTriangle } from "lucide-react";
import { ChatMessage, AgentRole, DEFAULT_AGENTS } from "@/lib/agents";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { sessionStore, useSessionMessages } from "@/lib/session-store";
import { loadApiKeys, getDefaultKey } from "@/lib/api-keys";
import { runPipeline } from "@/lib/pipeline-runner";
import { useNavigate } from "react-router-dom";

const roleColorMap: Record<AgentRole | "user", string> = {
  planner: "bg-agent-planner text-white",
  coder: "bg-agent-coder text-white",
  reviewer: "bg-agent-reviewer text-white",
  tester: "bg-agent-tester text-white",
  custom: "bg-primary text-primary-foreground",
  user: "bg-agent-user text-white",
};

const roleBorderMap: Record<AgentRole | "user", string> = {
  planner: "border-l-agent-planner",
  coder: "border-l-agent-coder",
  reviewer: "border-l-agent-reviewer",
  tester: "border-l-agent-tester",
  custom: "border-l-primary",
  user: "border-l-agent-user",
};

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
  const agents = DEFAULT_AGENTS;

  const apiKeyStore = loadApiKeys();
  const hasKey = !!getDefaultKey(apiKeyStore);

  const setIsRunning = (val: boolean) => sessionStore.setRunning(val);
  const setThinkingAgent = (val: string | null) => sessionStore.setThinkingAgent(val);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingAgent]);

  // Track streaming messages — update in place
  const messageMapRef = useRef<Map<string, ChatMessage>>(new Map());

  const handleMessage = (msg: ChatMessage) => {
    const existing = messageMapRef.current.get(msg.id);
    if (!existing) {
      messageMapRef.current.set(msg.id, msg);
      sessionStore.addMessage(msg);
    } else {
      messageMapRef.current.set(msg.id, msg);
      sessionStore.setMessages(
        sessionStore.messages.map((m) => (m.id === msg.id ? msg : m))
      );
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;
    if (!hasKey) {
      setError("Please add an API key in Settings first.");
      return;
    }

    setError(null);
    messageMapRef.current.clear();
    const task = input.trim();
    setInput("");
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runPipeline({
        task,
        agents,
        apiKeyStore,
        onMessage: handleMessage,
        onThinking: setThinkingAgent,
        signal: controller.signal,
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setError((e as Error).message);
      }
    } finally {
      setIsRunning(false);
      setThinkingAgent(null);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setThinkingAgent(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetSession = () => {
    handleStop();
    sessionStore.reset();
    messageMapRef.current.clear();
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Live Session</span>
          <span className="text-xs text-muted-foreground">— Code Review Pipeline</span>
          {isRunning && (
            <Badge variant="outline" className="bg-agent-coder/20 text-agent-coder text-[10px] ml-2">
              Running
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          {isRunning ? (
            <Button variant="ghost" size="sm" onClick={handleStop} className="h-7 text-xs">
              <Pause className="h-3 w-3 mr-1" />
              Stop
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={resetSession} className="h-7 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex -space-x-3 mb-4">
              {agents.map((a) => (
                <div
                  key={a.id}
                  className={`h-12 w-12 rounded-full ${roleColorMap[a.role]} flex items-center justify-center text-lg border-2 border-card`}
                >
                  {a.icon}
                </div>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Start a Group Chat Session</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Submit a coding task and watch the agents collaborate: Planner → Coder → Reviewer → Tester
            </p>
            {hasKey && (
              <Badge variant="outline" className="mt-3 text-green-400 border-green-800/40 bg-green-950/20 text-xs">
                ✓ API key ready
              </Badge>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-l-2 ${roleBorderMap[msg.agentRole || "user"]} pl-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-6 w-6 rounded-full ${roleColorMap[msg.agentRole || "user"]} flex items-center justify-center text-xs`}>
                  {msg.role === "user" ? "👤" : agents.find((a) => a.id === msg.agentId)?.icon || "🤖"}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {msg.role === "user" ? "You" : msg.agentName}
                </span>
                {msg.agentRole && (
                  <Badge variant="outline" className={`text-[10px] ${roleColorMap[msg.agentRole]} border-0 h-4`}>
                    {msg.agentRole}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 ml-8">
                <ReactMarkdown
                  components={{
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <pre className="bg-secondary rounded-md p-3 overflow-x-auto my-2">
                          <code className={`${className} text-xs font-mono text-foreground`} {...props}>{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono text-foreground" {...props}>{children}</code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1 text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                    ),
                  }}
                >
                  {msg.content || "▍"}
                </ReactMarkdown>
              </div>
              {msg.reasoning && (
                <Collapsible className="ml-8 mt-1">
                  <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="h-3 w-3" />
                    Reasoning trace
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono bg-secondary/50 p-2 rounded">
                      {msg.reasoning}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {thinkingAgent && <ThinkingIndicator agentName={thinkingAgent} />}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !hasKey
                ? "Add an API key in Settings to start…"
                : isRunning
                ? "Agents are working…"
                : 'Describe a task, e.g. "Build a login form with validation"'
            }
            disabled={isRunning}
            rows={1}
            className="resize-none bg-background text-sm min-h-[40px]"
          />
          <Button
            onClick={handleSend}
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
