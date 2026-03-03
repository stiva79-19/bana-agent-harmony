import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, GitBranch, MessageSquare, Play, Clock, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionMessages } from "@/lib/session-store";
import { DEFAULT_AGENTS, AgentRole } from "@/lib/agents";

const stats = [
  { label: "Active Agents", value: "4", icon: Bot, color: "text-agent-planner" },
  { label: "Pipelines", value: "1", icon: GitBranch, color: "text-agent-coder" },
  { label: "Sessions Today", value: "0", icon: MessageSquare, color: "text-agent-reviewer" },
  { label: "Tasks Completed", value: "0", icon: CheckCircle2, color: "text-agent-tester" },
];

const recentSessions = [
  { id: "demo-1", pipeline: "Code Review Pipeline", status: "completed" as const, time: "2 hours ago", task: "Build a login form" },
  { id: "demo-2", pipeline: "Code Review Pipeline", status: "failed" as const, time: "5 hours ago", task: "Implement search API" },
  { id: "demo-3", pipeline: "Code Review Pipeline", status: "completed" as const, time: "1 day ago", task: "Create dashboard layout" },
];

const statusColors = {
  running: "bg-agent-coder/20 text-agent-coder",
  completed: "bg-agent-coder/20 text-agent-coder",
  paused: "bg-agent-reviewer/20 text-agent-reviewer",
  failed: "bg-agent-tester/20 text-agent-tester",
};

const statusIcons = {
  running: Clock,
  completed: CheckCircle2,
  paused: Clock,
  failed: AlertCircle,
};

const roleColorMap: Record<AgentRole | "user", string> = {
  planner: "bg-agent-planner",
  coder: "bg-agent-coder",
  reviewer: "bg-agent-reviewer",
  tester: "bg-agent-tester",
  custom: "bg-primary",
  user: "bg-agent-user",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { messages, isRunning, thinkingAgent } = useSessionMessages();
  const recentAgentMessages = messages.filter((m) => m.role === "assistant").slice(-6);
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your multi-agent coordination platform
          </p>
        </div>
        <Button
          onClick={() => navigate("/session")}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Play className="h-4 w-4" />
          Launch Demo Pipeline
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Launch */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-card border-border overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-agent-planner/10 via-agent-coder/10 via-agent-reviewer/10 to-agent-tester/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {["🧠", "💻", "🔍", "🧪"].map((emoji, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-lg"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Code Review Pipeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Planner → Coder → Reviewer → Tester
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Submit a coding task and watch 4 AI agents collaborate in a group chat to plan, code, review, and test it.
              </p>
              <Button onClick={() => navigate("/session")} className="gap-2">
                <Play className="h-4 w-4" />
                Start Session
              </Button>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentSessions.map((session) => {
                const StatusIcon = statusIcons[session.status];
                return (
                  <div key={session.id} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${statusColors[session.status].split(" ")[1]}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.task}</p>
                        <p className="text-xs text-muted-foreground">{session.pipeline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={statusColors[session.status]}>
                        {session.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{session.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Agent Activity Feed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-foreground">Live Agent Activity</CardTitle>
                {isRunning && (
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-agent-coder opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-agent-coder" />
                    </span>
                    <span className="text-xs text-agent-coder font-medium">Live</span>
                  </span>
                )}
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/session")} className="text-xs h-7">
                  Open Session →
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentAgentMessages.length === 0 && !thinkingAgent ? (
              <div className="px-6 py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Henüz aktif ajan konuşması yok.</p>
                <p className="text-xs text-muted-foreground mt-1">Bir oturum başlatın ve ajanların birbirleri ile konuşmasını izleyin.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {recentAgentMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 px-6 py-3 hover:bg-accent/20 transition-colors"
                    >
                      <div className={`h-7 w-7 rounded-full ${roleColorMap[msg.agentRole || "user"]} flex items-center justify-center text-xs shrink-0 mt-0.5`}>
                        {DEFAULT_AGENTS.find((a) => a.id === msg.agentId)?.icon || "🤖"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-foreground">{msg.agentName}</span>
                          <Badge variant="outline" className={`text-[10px] ${roleColorMap[msg.agentRole || "user"]} text-white border-0 h-4`}>
                            {msg.agentRole}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {msg.content.replace(/[#*`>]/g, "").slice(0, 120)}…
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {thinkingAgent && (
                  <div className="flex items-center gap-3 px-6 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{thinkingAgent} düşünüyor…</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
