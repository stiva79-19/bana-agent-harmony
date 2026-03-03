import { ChatMessage } from "./agents";

type Listener = () => void;

// Global singleton store for session messages, accessible across pages
class SessionStore {
  private _messages: ChatMessage[] = [];
  private _isRunning = false;
  private _thinkingAgent: string | null = null;
  private _listeners = new Set<Listener>();

  get messages() { return this._messages; }
  get isRunning() { return this._isRunning; }
  get thinkingAgent() { return this._thinkingAgent; }

  addMessage(msg: ChatMessage) {
    this._messages = [...this._messages, msg];
    this.notify();
  }

  setMessages(msgs: ChatMessage[]) {
    this._messages = msgs;
    this.notify();
  }

  setRunning(val: boolean) {
    this._isRunning = val;
    this.notify();
  }

  setThinkingAgent(name: string | null) {
    this._thinkingAgent = name;
    this.notify();
  }

  reset() {
    this._messages = [];
    this._isRunning = false;
    this._thinkingAgent = null;
    this.notify();
  }

  subscribe(listener: Listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  private notify() {
    this._listeners.forEach((l) => l());
  }
}

export const sessionStore = new SessionStore();

// React hook to use the store
import { useSyncExternalStore } from "react";

export function useSessionMessages() {
  const messages = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.messages
  );
  const isRunning = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.isRunning
  );
  const thinkingAgent = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.thinkingAgent
  );
  return { messages, isRunning, thinkingAgent };
}
