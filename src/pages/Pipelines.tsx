import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Settings2 } from "lucide-react";
import { DEFAULT_AGENTS, DEFAULT_PIPELINE, PipelineConfig, Agent, AgentRole } from "@/lib/agents";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const roleColorMap: Record<AgentRole, string> = {
  planner: "bg-agent-planner/20 text-agent-planner border-agent-planner/40",
  coder: "bg-agent-coder/20 text-agent-coder border-agent-coder/40",
  reviewer: "bg-agent-reviewer/20 text-agent-reviewer border-agent-reviewer/40",
  tester: "bg-agent-tester/20 text-agent-tester border-agent-tester/40",
  custom: "bg-primary/20 text-primary border-primary/40",
};

export default function Pipelines() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<PipelineConfig>(DEFAULT_PIPELINE);
  const agents = DEFAULT_AGENTS;

  const pipelineAgents = pipeline.agents
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as Agent[];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Design agent coordination flows</p>
        </div>
        <Button onClick={() => navigate("/session")} className="gap-2">
          <Play className="h-4 w-4" />
          Run Pipeline
        </Button>
      </div>

      {/* Pipeline Flow Visualization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">{pipeline.name}</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {pipeline.maxRounds} rounds max
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-8 overflow-x-auto">
              {pipelineAgents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${roleColorMap[agent.role]} min-w-[120px]`}>
                    <span className="text-2xl">{agent.icon}</span>
                    <span className="text-sm font-medium">{agent.name}</span>
                    <span className="text-[10px] font-mono opacity-70">{agent.role}</span>
                  </div>
                  {i < pipelineAgents.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Loop indicator */}
            <div className="flex justify-center">
              <div className="text-xs text-muted-foreground border border-dashed border-border rounded-full px-3 py-1">
                ↩ Reviewer can loop back to Coder
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pipeline Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Settings2 className="h-4 w-4" />
              Pipeline Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground">Pipeline Name</Label>
                <Input
                  value={pipeline.name}
                  onChange={(e) => setPipeline((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <Label className="text-foreground">Max Rounds</Label>
                <Input
                  type="number"
                  value={pipeline.maxRounds}
                  onChange={(e) => setPipeline((p) => ({ ...p, maxRounds: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={10}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <Label className="text-foreground">Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={pipeline.timeout}
                  onChange={(e) => setPipeline((p) => ({ ...p, timeout: parseInt(e.target.value) || 60 }))}
                  min={30}
                  max={600}
                  className="mt-1 bg-background"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={pipeline.autoApprove}
                onCheckedChange={(checked) => setPipeline((p) => ({ ...p, autoApprove: checked }))}
              />
              <div>
                <Label className="text-foreground">Auto-approve</Label>
                <p className="text-xs text-muted-foreground">Automatically advance between agents without user confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
