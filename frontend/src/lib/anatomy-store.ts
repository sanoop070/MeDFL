import { useSyncExternalStore } from "react";
import type { OrganId } from "./organs";

type State = { activeOrgan: OrganId; source: "nav" | "scroll" | "chat" };

let state: State = { activeOrgan: "brain", source: "nav" };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setActiveOrgan(organ: OrganId, source: State["source"] = "nav") {
  if (state.activeOrgan === organ && state.source === source) return;
  state = { activeOrgan: organ, source };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function useAnatomy() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, setActiveOrgan };
}
