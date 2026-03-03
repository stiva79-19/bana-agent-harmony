export type AgentRole = "planner" | "coder" | "reviewer" | "tester" | "custom";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  tools: string[];
  color: string;
  icon: string;
  active: boolean;
}

export interface PipelineConfig {
  id: string;
  name: string;
  agents: string[]; // agent IDs in order
  maxRounds: number;
  timeout: number; // seconds
  autoApprove: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  agentId?: string;
  agentName?: string;
  agentRole?: AgentRole;
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  reasoning?: string;
}

export interface Session {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: "running" | "completed" | "paused" | "failed";
  messages: ChatMessage[];
  startedAt: Date;
  completedAt?: Date;
  currentAgentIndex: number;
  currentRound: number;
}

export const AGENT_COLORS: Record<AgentRole, string> = {
  planner: "agent-planner",
  coder: "agent-coder",
  reviewer: "agent-reviewer",
  tester: "agent-tester",
  custom: "primary",
};

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "planner-1",
    name: "Planner",
    role: "planner",
    description: "Breaks down tasks into actionable steps and coordinates the workflow",
    systemPrompt: `You are a senior software architect and project planner. When given a task:
1. Break it down into clear, actionable steps
2. Identify dependencies between steps
3. Assign each step to the appropriate agent (Coder, Reviewer, or Tester)
4. Provide a concise execution plan

Be specific and technical. Output a numbered plan.`,
    tools: ["analyze_requirements", "create_plan"],
    color: "agent-planner",
    icon: "🧠",
    active: true,
  },
  {
    id: "coder-1",
    name: "Coder",
    role: "coder",
    description: "Writes clean, well-structured code based on the plan",
    systemPrompt: `You are an expert software developer. When given a coding task:
1. Write clean, production-ready code
2. Follow best practices and design patterns
3. Include error handling and edge cases
4. Add brief inline comments for complex logic

Output code in markdown code blocks with the appropriate language tag.`,
    tools: ["write_code", "refactor_code"],
    color: "agent-coder",
    icon: "💻",
    active: true,
  },
  {
    id: "reviewer-1",
    name: "Reviewer",
    role: "reviewer",
    description: "Reviews code for quality, bugs, and best practices",
    systemPrompt: `You are a meticulous code reviewer. When reviewing code:
1. Check for bugs, security issues, and edge cases
2. Evaluate code quality and adherence to best practices
3. Suggest specific improvements with examples
4. If the code needs changes, clearly state what needs to be fixed

Rate the code: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.`,
    tools: ["review_code", "suggest_fix"],
    color: "agent-reviewer",
    icon: "🔍",
    active: true,
  },
  {
    id: "tester-1",
    name: "Tester",
    role: "tester",
    description: "Validates code with test cases and quality checks",
    systemPrompt: `You are a QA engineer and testing specialist. When given code to test:
1. Write comprehensive test cases (unit, integration, edge cases)
2. Identify potential failure points
3. Verify the code meets the original requirements
4. Report any issues found with clear reproduction steps

Output test code in markdown code blocks.`,
    tools: ["write_tests", "run_tests"],
    color: "agent-tester",
    icon: "🧪",
    active: true,
  },
];

export const DEFAULT_PIPELINE: PipelineConfig = {
  id: "code-review-pipeline",
  name: "Code Review Pipeline",
  agents: ["planner-1", "coder-1", "reviewer-1", "tester-1"],
  maxRounds: 3,
  timeout: 120,
  autoApprove: false,
};

export const AVAILABLE_TOOLS = [
  "analyze_requirements",
  "create_plan",
  "write_code",
  "refactor_code",
  "review_code",
  "suggest_fix",
  "write_tests",
  "run_tests",
  "search_docs",
  "execute_command",
];
