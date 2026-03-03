

## Universal Multi-Agent Coordination Platform

A developer tool for creating, configuring, and monitoring AI agents that coordinate via group chat — with a built-in **Code Review Pipeline** demo (Planner → Coder → Reviewer → Tester).

### Pages & Layout

**Sidebar navigation** with: Dashboard, Agents, Pipelines, Live Session, Settings

### 1. Dashboard
- Overview cards: active agents, running sessions, completed tasks
- Recent session history with status indicators
- Quick-launch button for the Code Review Pipeline demo

### 2. Agent Manager
- List of configured agents (cards with avatar, name, role, status)
- Create/edit agent dialog: name, role description, system prompt, available tools (checkboxes)
- Pre-built agents: **Planner**, **Coder**, **Reviewer**, **Tester** — each with tailored prompts
- Delete/duplicate agents

### 3. Pipeline Builder
- Visual representation of agent pipeline (horizontal flow: Planner → Coder → Reviewer → Tester)
- Drag to reorder agents in the pipeline
- Configure pipeline settings (max rounds, timeout, auto-approve)

### 4. Live Session (Core Feature)
- **Group chat view**: All agents and the user share a single chat thread
- Each agent message has a colored avatar/badge showing which agent is speaking
- **Coordination flow**: User submits a task (e.g., "Build a login form") → Planner breaks it down → Coder writes code → Reviewer critiques → Tester validates
- Real-time streaming responses from AI (using Lovable AI gateway)
- Agent "thinking" indicators while processing
- Ability to pause/resume the pipeline, or inject human messages mid-flow
- Collapsible reasoning/tool-call traces per message

### 5. Settings
- Default model selection
- Token/cost tracking display

### Backend (Lovable Cloud)
- **Edge function**: Orchestrates the multi-agent loop — takes the conversation history, determines which agent speaks next based on the pipeline order, calls Lovable AI with that agent's system prompt, streams the response back
- Agent turn logic: round-robin through pipeline stages, with the ability to loop back (e.g., Reviewer sends back to Coder)

### Design
- Dark theme, developer-focused aesthetic
- Monospace fonts for code blocks in chat
- Color-coded agent badges (blue=Planner, green=Coder, orange=Reviewer, red=Tester)
- Smooth streaming animations in the chat

### Pre-loaded Demo
The app ships with 4 pre-configured agents and a sample Code Review Pipeline ready to run, so users can immediately see multi-agent coordination in action.

