import { useState, useCallback } from "react";
import { Agent, PipelineConfig, Session, DEFAULT_AGENTS, DEFAULT_PIPELINE } from "./agents";

// Simple hook-based store for agents
export function useAgentStore() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);

  const addAgent = useCallback((agent: Agent) => {
    setAgents((prev) => [...prev, agent]);
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const duplicateAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const agent = prev.find((a) => a.id === id);
      if (!agent) return prev;
      const newAgent = { ...agent, id: `${agent.role}-${Date.now()}`, name: `${agent.name} (Copy)` };
      return [...prev, newAgent];
    });
  }, []);

  return { agents, addAgent, updateAgent, deleteAgent, duplicateAgent, setAgents };
}

export function usePipelineStore() {
  const [pipelines, setPipelines] = useState<PipelineConfig[]>([DEFAULT_PIPELINE]);

  const addPipeline = useCallback((pipeline: PipelineConfig) => {
    setPipelines((prev) => [...prev, pipeline]);
  }, []);

  const updatePipeline = useCallback((id: string, updates: Partial<PipelineConfig>) => {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deletePipeline = useCallback((id: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { pipelines, addPipeline, updatePipeline, deletePipeline };
}

export function useSessionStore() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const createSession = useCallback((pipeline: PipelineConfig): Session => {
    const session: Session = {
      id: `session-${Date.now()}`,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      status: "running",
      messages: [],
      startedAt: new Date(),
      currentAgentIndex: 0,
      currentRound: 1,
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    return session;
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<Session>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setActiveSession((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  }, []);

  return { sessions, activeSession, setActiveSession, createSession, updateSession };
}
