import { useSyncExternalStore } from "react";
import type { NormalizedPrediction } from "./api";

let result: NormalizedPrediction | null = null;
const listeners = new Set<() => void>();

export function setPredictionResult(next: NormalizedPrediction | null) {
  result = next;
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => result;

export function usePredictionResult() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
