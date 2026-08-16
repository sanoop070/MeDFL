/**
 * Centralized MeDFL API layer.
 * All network access to the FastAPI backend goes through this module.
 */

export const API_BASE_URL =
  (import.meta.env['VITE_API_URL'] as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  kind: "network" | "timeout" | "http" | "parse";

  constructor(message: string, kind: ApiError["kind"], status = 0) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function describeError(error: unknown): { title: string; detail: string } {
  if (error instanceof ApiError) {
    if (error.kind === "network" || error.kind === "timeout") {
      return {
        title: "MeDFL backend unavailable.",
        detail: `Make sure the FastAPI server is running at ${API_BASE_URL}.`,
      };
    }
    if (error.status === 404) {
      return { title: "Not found.", detail: "The requested resource does not exist in the knowledge base." };
    }
    if (error.status === 422) {
      return { title: "Invalid request.", detail: "The backend rejected the submitted parameters." };
    }
    if (error.status >= 500) {
      return { title: "Backend error.", detail: "The MeDFL server failed to process this request." };
    }
    return { title: "Request failed.", detail: error.message };
  }
  return { title: "Unexpected error.", detail: "Something went wrong while contacting MeDFL." };
}

const DEFAULT_TIMEOUT = 20000;

async function request<T>(
  path: string,
  init: RequestInit & { timeout?: number } = {},
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError("Request timed out", "timeout");
    }
    throw new ApiError("Network request failed", "network");
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, "http", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Malformed response payload", "parse", response.status);
  }
}

/* ---------------------------------- types --------------------------------- */

export type SymptomsResponse = { symptoms?: string[]; count?: number } | string[];

export type PredictionItem = { disease: string; confidence: number };

export type PredictionResponse = {
  prediction?: string;
  confidence?: number;
  top_predictions?: Array<{ disease?: string; name?: string; confidence?: number; probability?: number }>;
  [key: string]: unknown;
};

export type NormalizedPrediction = {
  prediction: string;
  confidence: number;
  top: PredictionItem[];
  symptoms: string[];
  raw: unknown;
};

export type DiseaseSearchResponse = { count?: number; diseases?: string[] } | string[];

export type DiseaseDetails = {
  disease: string;
  description?: string;
  medications?: string[];
  diet?: string[];
  precautions?: string[];
  workouts?: string[];
  [key: string]: unknown;
};

export type ChatContext = {
  page: string;
  disease?: string;
  prediction?: string;
  confidence?: number;
  topPredictions?: string[];
  organ?: string;
};

export type ChatResponse = { reply?: string; message?: string; response?: string; answer?: string };

/* --------------------------------- helpers -------------------------------- */

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/,(?![^(]*\))/)
      .map((v) => v.replace(/^[\s['"]+|[\s\]'"]+$/g, ""))
      .filter(Boolean);
  }
  return [];
}

function normalizeConfidence(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? n * 100 : n;
}

/* ------------------------------- endpoints -------------------------------- */

export async function fetchSymptoms(search?: string): Promise<string[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await request<SymptomsResponse>(`/api/symptoms${query}`);
  if (Array.isArray(data)) return data.map(String);
  return toStringList(data.symptoms);
}

export async function predict(symptoms: string[]): Promise<NormalizedPrediction> {
  const data = await request<PredictionResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify({ symptoms }),
  });

  const rawTop = Array.isArray(data.top_predictions) ? data.top_predictions : [];
  const top: PredictionItem[] = rawTop
    .map((item) => ({
      disease: String(item.disease ?? item.name ?? ""),
      confidence: normalizeConfidence(item.confidence ?? item.probability),
    }))
    .filter((i) => i.disease);

  const prediction = String(data.prediction ?? top[0]?.disease ?? "");
  const confidence = data.confidence != null ? normalizeConfidence(data.confidence) : (top[0]?.confidence ?? 0);

  return { prediction, confidence, top: top.length ? top : prediction ? [{ disease: prediction, confidence }] : [], symptoms, raw: data };
}

export async function searchDiseases(search: string): Promise<string[]> {
  const data = await request<DiseaseSearchResponse>(
    `/api/diseases/search?search=${encodeURIComponent(search)}`,
  );
  if (Array.isArray(data)) return data.map(String);
  return toStringList(data.diseases);
}

export async function fetchDisease(disease: string): Promise<DiseaseDetails> {
  const data = await request<DiseaseDetails>(`/api/diseases/${encodeURIComponent(disease)}`);
  return {
    ...data,
    disease: String(data.disease ?? disease),
    medications: toStringList(data.medications),
    diet: toStringList(data.diet),
    precautions: toStringList(data.precautions),
    workouts: toStringList(data.workouts),
  };
}

/**
 * Chat endpoint. Architected so streaming can be added later without touching
 * the UI: `onToken` receives incremental tokens when the backend streams.
 */
export async function sendChatMessage(
  message: string,
  context: ChatContext,
  options: { onToken?: (token: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  options.signal?.addEventListener("abort", () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error)?.name === "AbortError") throw new ApiError("Request timed out", "timeout");
    throw new ApiError("Network request failed", "network");
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, "http", response.status);
  }

  const contentType = response.headers.get("content-type") ?? "";

  // Streaming path (text/event-stream or text/plain chunks).
  if (response.body && !contentType.includes("application/json")) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const token = chunk.replace(/^data:\s?/gm, "").replace(/\n\n$/, "");
      full += token;
      options.onToken?.(token);
    }
    return full.trim();
  }

  const data = (await response.json()) as ChatResponse;
  const reply = data.reply ?? data.message ?? data.response ?? data.answer ?? "";
  if (!reply) throw new ApiError("Empty response from assistant", "parse", response.status);
  options.onToken?.(reply);
  return reply;
}
