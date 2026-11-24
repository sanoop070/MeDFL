export interface OrganRegion {
  id: string;
  label: string;
  sublabel: string;
  category: "Neuro" | "Cardio" | "Lung" | "GI" | "Endocrine" | "Infectious" | "Joints" | "All";
  symptoms: { id: string; name: string }[];
}

export const ORGAN_REGIONS: OrganRegion[] = [
  {
    id: "neuro",
    label: "NEURO",
    sublabel: "Head & Central Nervous",
    category: "Neuro",
    symptoms: [
      { id: "throbbing_headache", name: "Throbbing Headache" },
      { id: "visual_aura_photophobia", name: "Visual Aura / Photophobia" },
      { id: "dizziness_vertigo", name: "Dizziness / Vertigo" },
      { id: "blurred_vision", name: "Blurred Vision" },
      { id: "peripheral_tingling_numbness", name: "Peripheral Tingling / Numbness" },
    ],
  },
  {
    id: "cardio_lung",
    label: "CHEST\nHEART / LUNG",
    sublabel: "Cardiovascular & Pulmonary",
    category: "Cardio",
    symptoms: [
      { id: "sharp_chest_pain", name: "Sharp Chest Pain" },
      { id: "chest_tightness_angina", name: "Chest Tightness / Angina" },
      { id: "palpitations", name: "Palpitations" },
      { id: "shortness_of_breath", name: "Shortness of Breath" },
      { id: "cough", name: "Cough" },
    ],
  },
  {
    id: "gi_endo",
    label: "ABDOMEN\nGI / ENDO",
    sublabel: "Gastrointestinal & Metabolic",
    category: "GI",
    symptoms: [
      { id: "nausea_vomiting", name: "Nausea & Vomiting" },
      { id: "abdominal_pain", name: "Abdominal Pain" },
      { id: "excessive_hunger", name: "Excessive Hunger (Polyphagia)" },
      { id: "polyuria", name: "Frequent Urination (Polyuria)" },
      { id: "acid_reflux", name: "Acid Reflux / Heartburn" },
    ],
  },
  {
    id: "joints_limbs",
    label: "JOINTS / LIMBS",
    sublabel: "Musculoskeletal & Mobility",
    category: "Joints",
    symptoms: [
      { id: "joint_pain", name: "Joint Pain" },
      { id: "muscle_aches", name: "Muscle Aches (Myalgia)" },
      { id: "neck_stiffness", name: "Neck Stiffness" },
      { id: "swollen_joints", name: "Swollen Joints" },
    ],
  },
  {
    id: "systemic",
    label: "⚡ SYSTEMIC / INFECTIOUS",
    sublabel: "Immune, Vitals & Infectious",
    category: "Infectious",
    symptoms: [
      { id: "high_fever", name: "High Fever" },
      { id: "fatigue", name: "Fatigue & Malaise" },
      { id: "chills", name: "Chills / Rigors" },
      { id: "skin_rash", name: "Erythematous Skin Rash" },
      { id: "sore_throat", name: "Sharp Throat Pain" },
    ],
  },
];
