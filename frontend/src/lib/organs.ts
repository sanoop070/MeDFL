export type OrganId =
  | "brain"
  | "lungs"
  | "heart"
  | "liver"
  | "stomach"
  | "gallbladder"
  | "kidneys"
  | "pancreas"
  | "intestines"
  | "bladder";

export type Organ = {
  id: OrganId;
  name: string;
  system: string;
  description: string;
  aiConnection: string;
  /** Focus point in body-space (y up, body centered on origin). */
  focus: [number, number, number];
  accent: "cyan" | "violet" | "magenta" | "primary" | "signal";
};

export const ORGANS: Organ[] = [
  {
    id: "brain",
    name: "Brain",
    system: "Nervous",
    description:
      "The brain coordinates sensory input, cognition, and the regulation of nearly every system in the body.",
    aiConnection: "MeDFL can explore patterns associated with neurological and cognitive symptoms.",
    focus: [0, 1.46, 0],
    accent: "violet",
  },
  {
    id: "lungs",
    name: "Lungs",
    system: "Respiratory",
    description:
      "The lungs exchange oxygen and carbon dioxide between the air and the bloodstream with every breath.",
    aiConnection: "MeDFL can explore patterns associated with respiratory symptoms.",
    focus: [0, 0.74, 0],
    accent: "cyan",
  },
  {
    id: "heart",
    name: "Heart",
    system: "Cardiovascular",
    description:
      "The heart is a muscular organ responsible for circulating blood throughout the body.",
    aiConnection: "MeDFL can explore patterns associated with cardiovascular symptoms.",
    focus: [-0.06, 0.66, 0],
    accent: "magenta",
  },
  {
    id: "liver",
    name: "Liver",
    system: "Hepatic",
    description:
      "The liver filters blood, metabolises nutrients and medication, and produces bile for digestion.",
    aiConnection: "MeDFL can explore patterns associated with hepatic and metabolic symptoms.",
    focus: [0.14, 0.36, 0],
    accent: "primary",
  },
  {
    id: "stomach",
    name: "Stomach",
    system: "Digestive",
    description:
      "The stomach breaks down food using acid and enzymes before passing it into the small intestine.",
    aiConnection: "MeDFL can explore patterns associated with upper digestive symptoms.",
    focus: [-0.14, 0.34, 0],
    accent: "cyan",
  },
  {
    id: "gallbladder",
    name: "Gallbladder",
    system: "Biliary",
    description: "The gallbladder stores and concentrates bile produced by the liver.",
    aiConnection: "MeDFL can explore patterns associated with biliary symptoms.",
    focus: [0.15, 0.27, 0],
    accent: "signal",
  },
  {
    id: "kidneys",
    name: "Kidneys",
    system: "Renal",
    description:
      "The kidneys filter waste from the blood, balance fluids, and regulate blood pressure.",
    aiConnection: "MeDFL can explore patterns associated with renal and urinary symptoms.",
    focus: [0, 0.17, 0],
    accent: "primary",
  },
  {
    id: "pancreas",
    name: "Pancreas",
    system: "Endocrine / Digestive",
    description:
      "The pancreas releases digestive enzymes and the hormones that regulate blood sugar.",
    aiConnection: "MeDFL can explore patterns associated with metabolic and endocrine symptoms.",
    focus: [0, 0.25, 0],
    accent: "violet",
  },
  {
    id: "intestines",
    name: "Intestines",
    system: "Digestive",
    description:
      "The intestines absorb nutrients and water, and host a large part of the body's immune activity.",
    aiConnection: "MeDFL can explore patterns associated with lower digestive symptoms.",
    focus: [0, 0.0, 0],
    accent: "cyan",
  },
  {
    id: "bladder",
    name: "Bladder",
    system: "Urinary",
    description: "The bladder stores urine produced by the kidneys until it is released.",
    aiConnection: "MeDFL can explore patterns associated with urinary symptoms.",
    focus: [0, -0.24, 0],
    accent: "magenta",
  },
];

export const ORGAN_MAP: Record<OrganId, Organ> = Object.fromEntries(
  ORGANS.map((o) => [o.id, o]),
) as Record<OrganId, Organ>;

const ORGAN_KEYWORDS: Array<[OrganId, RegExp]> = [
  ["brain", /\b(brain|neuro|cognitive|migraine|headache|mental|anxiety|depress|schizo|panic)\w*/i],
  ["heart", /\b(heart|cardio|cardiac|chest pain|blood pressure|hypertension)\w*/i],
  ["lungs", /\b(lung|respirat|breath|asthma|pneumonia|cough|bronch)\w*/i],
  ["liver", /\b(liver|hepat|jaundice|cirrhosis)\w*/i],
  ["stomach", /\b(stomach|gastr|nausea|ulcer|indigestion)\w*/i],
  ["gallbladder", /\b(gallbladder|gall|bile|biliary|cholecyst)\w*/i],
  ["kidneys", /\b(kidney|renal|nephr|urinary tract)\w*/i],
  ["pancreas", /\b(pancrea|diabet|insulin|blood sugar)\w*/i],
  ["intestines", /\b(intestin|bowel|colon|diarrh|constipat|ibs|crohn)\w*/i],
  ["bladder", /\b(bladder|urin|cystitis)\w*/i],
];

/** Best-effort keyword mapping used to link chat/disease context to anatomy. */
export function detectOrgan(text: string): OrganId | null {
  for (const [id, re] of ORGAN_KEYWORDS) {
    if (re.test(text)) return id;
  }
  return null;
}
