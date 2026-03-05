import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ChatMessage, AgentRole, DEFAULT_AGENTS } from "@/lib/agents";

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

interface Props {
  msg: ChatMessage;
}

export function AgentMessage({ msg }: Props) {
  const role = msg.agentRole || "user";
  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-l-2 ${roleBorderMap[role]} pl-3`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-6 w-6 rounded-full ${roleColorMap[role]} flex items-center justify-center text-xs`}>
          {msg.role === "user"
            ? "👤"
            : DEFAULT_AGENTS.find((a) => a.id === msg.agentId)?.icon || "🤖"}
        </div>
        <span className="text-sm font-medium text-foreground">
          {msg.role === "user" ? "You" : msg.agentName}
        </span>
        {msg.agentRole && (
          <Badge
            variant="outline"
            className={`text-[10px] ${roleColorMap[msg.agentRole]} border-0 h-4`}
          >
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
                  <code className={`${className} text-xs font-mono text-foreground`} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code
                  className="bg-secondary px-1 py-0.5 rounded text-xs font-mono text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
            h2: ({ children }) => (
              <h2 className="text-base font-semibold mt-3 mb-1 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic">
                {children}
              </blockquote>
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
  );
}
