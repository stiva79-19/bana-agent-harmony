import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Pause, Play, RotateCcw, ChevronDown, Bot } from "lucide-react";
import { ChatMessage, AgentRole, DEFAULT_AGENTS } from "@/lib/agents";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [thinkingAgent, setThinkingAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agents = DEFAULT_AGENTS;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingAgent]);

  const simulateAgentResponse = async (agentIndex: number, userTask: string, allMessages: ChatMessage[]) => {
    const agent = agents[agentIndex];
    if (!agent) return;

    setThinkingAgent(agent.name);

    // Simulate thinking delay
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

    const responses: Record<AgentRole, string> = {
      planner: `## Task Breakdown\n\nAnalyzing: **"${userTask}"**\n\n### Steps:\n1. **Define component structure** — Identify required components and their hierarchy\n2. **Implement core logic** — Write the main functionality with proper state management\n3. **Add styling** — Apply consistent design system styles\n4. **Error handling** — Add validation and error states\n\n> Assigning Step 1-2 to **Coder**, then **Reviewer** for quality check.`,
      coder: "## Implementation\n\n```tsx\nimport { useState } from 'react';\nimport { Button } from '@/components/ui/button';\nimport { Input } from '@/components/ui/input';\n\nexport function LoginForm() {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setLoading(true);\n    try {\n      // Authentication logic here\n      await authenticate(email, password);\n    } catch (err) {\n      console.error('Login failed:', err);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <Input\n        type=\"email\"\n        value={email}\n        onChange={(e) => setEmail(e.target.value)}\n        placeholder=\"Email\"\n      />\n      <Input\n        type=\"password\"\n        value={password}\n        onChange={(e) => setPassword(e.target.value)}\n        placeholder=\"Password\"\n      />\n      <Button type=\"submit\" disabled={loading}>\n        {loading ? 'Signing in...' : 'Sign In'}\n      </Button>\n    </form>\n  );\n}\n```\n\nComponent implements email/password login with loading state and error handling.",
      reviewer: '## Code Review\n\n**Rating: REQUEST_CHANGES**\n\n### Issues Found:\n1. ⚠️ **Missing input validation** — No email format check or password length requirement\n2. ⚠️ **No error display** — User won\'t see why login failed\n3. 🔒 **Security** — Should add rate limiting consideration\n\n### Suggested Fix:\n```tsx\nconst [error, setError] = useState<string | null>(null);\n\nif (!email.includes("@")) {\n  setError("Invalid email format");\n  return;\n}\n```\n\n> Sending back to **Coder** for fixes.',
      tester: "## Test Results\n\n```typescript\ndescribe('LoginForm', () => {\n  it('renders email and password inputs', () => {\n    render(<LoginForm />);\n    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();\n    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();\n  });\n\n  it('shows loading state on submit', async () => {\n    render(<LoginForm />);\n    fireEvent.click(screen.getByText('Sign In'));\n    expect(screen.getByText('Signing in...')).toBeInTheDocument();\n  });\n\n  it('validates email format', () => {\n    // Test with invalid email\n  });\n});\n```\n\n✅ 2/3 tests passing\n❌ 1 test needs implementation after Coder fixes validation",
      custom: "Processing task...",
    };

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      content: responses[agent.role],
      timestamp: new Date(),
      reasoning: `Agent ${agent.name} processed the conversation context and generated a response based on its ${agent.role} role.`,
    };

    setThinkingAgent(null);
    setMessages((prev) => [...prev, msg]);

    // Continue pipeline
    if (agentIndex < agents.length - 1 && !isPaused) {
      await simulateAgentResponse(agentIndex + 1, userTask, [...allMessages, msg]);
    } else {
      setIsRunning(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const task = input.trim();
    setInput("");
    setIsRunning(true);
    setIsPaused(false);

    await simulateAgentResponse(0, task, newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetSession = () => {
    setMessages([]);
    setIsRunning(false);
    setIsPaused(false);
    setThinkingAgent(null);
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
          {isRunning && (
            <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)} className="h-7 text-xs">
              {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={resetSession} className="h-7 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

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
          </div>
        )}

        <AnimatePresence>
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
                  {msg.content}
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
            placeholder={isRunning ? "Agents are working... you can inject a message" : 'Describe a task, e.g. "Build a login form with validation"'}
            rows={1}
            className="resize-none bg-background text-sm min-h-[40px]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
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
