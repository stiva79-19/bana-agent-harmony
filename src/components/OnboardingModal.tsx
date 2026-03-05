import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Key, Play, CheckCircle2, ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "agent_harmony_onboarded";

const steps = [
  {
    icon: "🤖",
    title: "Welcome to Agent Harmony",
    desc: "Watch a team of AI agents collaborate in real time — Planner, Coder, Reviewer, and Tester work together on your tasks.",
    detail: "Each agent has a specialized role. Together they plan, write, review, and test code — just like a real software team.",
  },
  {
    icon: "🔑",
    title: "Bring Your Own API Key",
    desc: "Your keys stay in your browser. Nothing is sent to any server — all AI calls go directly from your device to the provider.",
    detail: "Supports OpenAI, Anthropic, Google Gemini, OpenRouter, Kimi, and any OpenAI-compatible endpoint (Ollama, LM Studio, etc.).",
  },
  {
    icon: "🚀",
    title: "Launch Your First Session",
    desc: "Describe a coding task — like \"Build a login form with validation\" — and watch the agents collaborate in real time.",
    detail: "You can assign different models to different agents. Use GPT for coding, Claude for planning, Gemini for reviewing.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setOpen(true);
  }, []);

  const finish = (goToSettings = false) => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    if (goToSettings) navigate("/settings");
  };

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-secondary">
              <motion.div
                className="h-1 bg-primary"
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-6">
              {/* Close */}
              <button
                onClick={() => finish(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-4"
                >
                  <div className="text-5xl mb-2">{current.icon}</div>
                  <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
                  <p className="text-sm text-foreground/80 leading-relaxed">{current.desc}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/40 rounded-lg p-3">
                    {current.detail}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step dots */}
              <div className="flex justify-center gap-2 mt-6">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {isLast ? (
                  <Button onClick={() => finish(true)} className="flex-1 gap-2">
                    <Key className="h-4 w-4" />
                    Add API Key
                  </Button>
                ) : (
                  <Button onClick={() => setStep((s) => s + 1)} className="flex-1 gap-2">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isLast && (
                <button
                  onClick={() => finish(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
