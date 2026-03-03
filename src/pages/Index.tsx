import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, GitBranch, MessageSquare, Play, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

export default function Dashboard() {
  const navigate = useNavigate();

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
    </div>
  );
}
