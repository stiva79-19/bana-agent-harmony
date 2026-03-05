/**
 * Step-by-step setup guide shown when the user hasn't configured an API key.
 * Replaces the empty "No API key" warning with a proper onboarding flow.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Key, Play, Bot, CheckCircle2 } from "lucide-react";
import { loadApiKeys, getDefaultKey } from "@/lib/api-keys";

const steps = [
  {
    n: 1,
    icon: Key,
    title: "Add an API key",
    desc: "Go to Settings and add your OpenAI, Anthropic, Gemini, or any other key.",
    action: "Go to Settings",
    to: "/settings",
    done: false,
  },
  {
    n: 2,
    icon: Bot,
    title: "Choose your agents",
    desc: "Optionally assign different models to different agents in Settings.",
    action: null,
    to: null,
    done: false,
  },
  {
    n: 3,
    icon: Play,
    title: "Launch a session",
    desc: 'Type a task like "Build a login form" and watch the agents collaborate.',
    action: null,
    to: null,
    done: false,
  },
];

export function SetupGuide() {
  const navigate = useNavigate();
  const store = loadApiKeys();
  const hasKey = !!getDefaultKey(store);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 py-8 max-w-sm mx-auto text-center"
    >
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Get started in 3 steps</h2>
      <p className="text-sm text-muted-foreground mb-8">
        No account needed. Your API keys stay in your browser.
      </p>

      <div className="w-full space-y-3 text-left">
        {steps.map((step, i) => {
          const isDone = step.n === 1 && hasKey;
          const Icon = step.icon;
          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                isDone
                  ? "border-green-800/40 bg-green-950/20"
                  : "border-border bg-card/50"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                isDone ? "bg-green-900/40" : "bg-secondary"
              }`}>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{step.n}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? "text-green-300" : "text-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                {step.action && step.to && !isDone && (
                  <Button
                    size="sm"
                    className="mt-3 h-7 text-xs gap-1.5"
                    onClick={() => navigate(step.to!)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {step.action}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {hasKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-3 rounded-xl border border-green-800/40 bg-green-950/20 w-full text-center"
        >
          <p className="text-xs text-green-300">
            ✓ API key configured — type a task below to start!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
