import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const models = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", desc: "Fast, balanced" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Best reasoning" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Cost-effective" },
  { id: "openai/gpt-5", name: "GPT-5", desc: "Powerful all-rounder" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", desc: "Fast & affordable" },
];

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState(models[0].id);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure platform defaults</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Default Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {models.map((model) => (
              <label
                key={model.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel === model.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{model.id}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Usage & Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">Total Requests</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">Tokens Used</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">$0.00</p>
                <p className="text-xs text-muted-foreground mt-1">Estimated Cost</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Usage tracking will be available once connected to Lovable Cloud.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
