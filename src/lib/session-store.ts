import { ChatMessage } from "./agents";
import { useSyncExternalStore } from "react";

type Listener = () => void;

interface SessionState {
  messages: ChatMessage[];
  isRunning: boolean;
  thinkingAgent: string | null;
}

// Global singleton store for session messages, accessible across pages
class SessionStore {
  private _state: SessionState = {
    messages: [],
    isRunning: false,
    thinkingAgent: null,
  };
  private _listeners = new Set<Listener>();

  get messages() { return this._state.messages; }
  get isRunning() { return this._state.isRunning; }
  get thinkingAgent() { return this._state.thinkingAgent; }

  private setState(patch: Partial<SessionState>) {
    this._state = { ...this._state, ...patch };
    this._listeners.forEach((l) => l());
  }

  addMessage(msg: ChatMessage) {
    this.setState({ messages: [...this._state.messages, msg] });
  }

  setMessages(msgs: ChatMessage[]) {
    this.setState({ messages: msgs });
  }

  setRunning(val: boolean) {
    this.setState({ isRunning: val });
  }

  setThinkingAgent(name: string | null) {
    this.setState({ thinkingAgent: name });
  }

  reset() {
    this.setState({ messages: [], isRunning: false, thinkingAgent: null });
  }

  getSnapshot(): SessionState {
    return this._state;
  }

  subscribe(listener: Listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }
}

export const sessionStore = new SessionStore();

// Single subscribe call — all state in one snapshot (perf fix)
export function useSessionMessages() {
  const state = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.getSnapshot(),
  );
  return {
    messages: state.messages,
    isRunning: state.isRunning,
    thinkingAgent: state.thinkingAgent,
  };
}
