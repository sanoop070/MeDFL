import type { ChatContext } from "@/lib/api";

export function greetingFor(context: ChatContext): string {
  if (context.page === "disease" && context.disease) {
    return `I can help you understand ${titleCase(context.disease)}. What would you like to know?`;
  }
  if (context.page === "prediction" && context.prediction) {
    return `I can help you interpret the model output for ${titleCase(context.prediction)}${
      context.confidence != null ? ` (${context.confidence.toFixed(2)}% confidence)` : ""
    }. Remember this is an AI-generated prediction, not a diagnosis.`;
  }
  if (context.page === "symptoms") {
    return "I can help you describe symptoms accurately and explain what the analysis does. What are you experiencing?";
  }
  if (context.page === "privacy") {
    return "I can explain how Federated Learning keeps raw patient data local. Where should we start?";
  }
  return "Hello. I'm your MeDFL assistant. I can help you understand symptoms, diseases, predictions, health concepts, Federated Learning, and privacy.";
}

export function suggestionsFor(context: ChatContext): string[] {
  if (context.page === "disease" && context.disease) {
    return [
      "Explain this condition",
      "What are common symptoms?",
      "Explain the treatment information",
      "Explain this simply",
    ];
  }
  if (context.page === "prediction") {
    return [
      "Explain my prediction",
      "Why did the model choose this?",
      "What does confidence mean?",
      "Explain the other predictions",
      "What should I discuss with a doctor?",
    ];
  }
  if (context.page === "symptoms") {
    return ["How should I describe symptoms?", "What does the model analyse?", "Is my data private?"];
  }
  if (context.page === "privacy") {
    return ["What is Federated Learning?", "How is raw data protected?", "How is the global model built?"];
  }
  return [
    "What is Federated Learning?",
    "How does MeDFL protect my data?",
    "Explain how symptom analysis works",
  ];
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
