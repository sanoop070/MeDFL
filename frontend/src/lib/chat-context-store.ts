import { useEffect, useSyncExternalStore } from "react";
import type { ChatContext } from "./api";

let context: ChatContext = { page: "home" };
let open = false;
let seed: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

type Snapshot = { context: ChatContext; open: boolean; seed: string | null };
let snapshot: Snapshot = { context, open, seed };

function commit() {
  snapshot = { context, open, seed };
  emit();
}

export function setPageContext(next: ChatContext) {
  context = next;
  commit();
}

export function openChat(question?: string) {
  open = true;
  seed = question ?? null;
  commit();
}

export function closeChat() {
  open = false;
  commit();
}

export function consumeSeed() {
  seed = null;
  snapshot = { context, open, seed };
}

const getSnapshot = () => snapshot;

export function useChatStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Declarative helper for pages to publish their context to MeDFL AI. */
export function usePageChatContext(next: ChatContext) {
  const key = JSON.stringify(next);
  useEffect(() => {
    setPageContext(JSON.parse(key) as ChatContext);
  }, [key]);
}
