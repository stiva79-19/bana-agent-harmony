import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Pencil, Bot } from "lucide-react";
import { Agent, AgentRole, AVAILABLE_TOOLS, DEFAULT_AGENTS, AGENT_COLORS } from "@/lib/agents";
import { motion } from "framer-motion";

const roleOptions: AgentRole[] = ["planner", "coder", "reviewer", "tester", "custom"];

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "custom" as AgentRole,
    description: "",
    systemPrompt: "",
    tools: [] as string[],
  });

  const openCreate = () => {
    setEditingAgent(null);
    setForm({ name: "", role: "custom", description: "", systemPrompt: "", tools: [] });
    setDialogOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      role: agent.role,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingAgent) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? { ...a, ...form, color: AGENT_COLORS[form.role] }
            : a
        )
      );
    } else {
      const newAgent: Agent = {
        id: `${form.role}-${Date.now()}`,
        ...form,
        color: AGENT_COLORS[form.role],
        icon: form.role === "planner" ? "🧠" : form.role === "coder" ? "💻" : form.role === "reviewer" ? "🔍" : form.role === "tester" ? "🧪" : "🤖",
        active: true,
      };
      setAgents((prev) => [...prev, newAgent]);
    }
    setDialogOpen(false);
  };

  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const duplicateAgent = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      setAgents((prev) => [...prev, { ...agent, id: `${agent.role}-${Date.now()}`, name: `${agent.name} (Copy)` }]);
    }
  };

  const toggleTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool) ? prev.tools.filter((t) => t !== tool) : [...prev.tools, tool],
    }));
  };

  const roleColorMap: Record<AgentRole, string> = {
    planner: "bg-agent-planner/20 text-agent-planner border-agent-planner/30",
    coder: "bg-agent-coder/20 text-agent-coder border-agent-coder/30",
    reviewer: "bg-agent-reviewer/20 text-agent-reviewer border-agent-reviewer/30",
    tester: "bg-agent-tester/20 text-agent-tester border-agent-tester/30",
    custom: "bg-primary/20 text-primary border-primary/30",
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and manage your AI agents</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card border-border hover:border-primary/20 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${roleColorMap[agent.role]}`}>
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColorMap[agent.role]}`}>
                        {agent.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(agent)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateAgent(agent.id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAgent(agent.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {agent.tools.map((tool) => (
                    <span key={tool} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {tool}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingAgent ? "Edit Agent" : "Create Agent"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure the agent's role, prompt, and available tools.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 bg-background" />
              </div>
              <div>
                <Label className="text-foreground">Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AgentRole }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-foreground">Description</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1 bg-background" />
            </div>
            <div>
              <Label className="text-foreground">System Prompt</Label>
              <Textarea
                value={form.systemPrompt}
                onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                rows={5}
                className="mt-1 font-mono text-xs bg-background"
              />
            </div>
            <div>
              <Label className="text-foreground">Tools</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <label key={tool} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={form.tools.includes(tool)} onCheckedChange={() => toggleTool(tool)} />
                    <span className="font-mono text-xs">{tool}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingAgent ? "Save Changes" : "Create Agent"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
