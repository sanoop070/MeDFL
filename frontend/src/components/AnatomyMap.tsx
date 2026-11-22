import React from "react";

const REGIONS = [
  { id: "neuro", label: "Head & Neuro", cx: 110, cy: 38, r: 18, symptoms: ["headache", "dizziness", "blurred_vision"] },
  { id: "ent", label: "Throat & Airways", cx: 110, cy: 74, r: 12, symptoms: ["sore_throat", "cough"] },
  { id: "cardio", label: "Heart & Lungs", cx: 110, cy: 118, r: 24, symptoms: ["chest_pain", "palpitations", "shortness_of_breath"] },
  { id: "gi", label: "Abdomen & Metabolic", cx: 110, cy: 172, r: 22, symptoms: ["abdominal_pain", "nausea", "excessive_hunger", "polyuria"] },
  { id: "systemic", label: "Systemic & Joints", cx: 56, cy: 145, r: 15, symptoms: ["high_fever", "fatigue", "joint_pain"] },
];

export const AnatomyMap: React.FC<{
  selectedSymptoms: string[];
  onToggleSymptom: (s: string) => void;
}> = ({ selectedSymptoms, onToggleSymptom }) => (
  <div className="flex flex-col items-center gap-4">
    <svg viewBox="0 0 220 320" className="w-48 h-64 drop-shadow-[0_0_24px_rgba(16,185,129,0.22)]">
      <circle cx="110" cy="38" r="22" fill="#0d1912" stroke="#34d399" strokeWidth="1.5" />
      <path
        d="M84 68 Q110 60 136 68 L156 145 L142 150 L130 98 L130 198 L142 295 L122 295 L110 212 L98 295 L78 295 L90 198 L90 98 L78 150 L64 145 Z"
        fill="#0d1912"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      {REGIONS.map((reg) => {
        const active = reg.symptoms.some((s) => selectedSymptoms.includes(s));
        return (
          <g key={reg.id} className="cursor-pointer" onClick={() => onToggleSymptom(reg.symptoms[0])}>
            <circle
              cx={reg.cx}
              cy={reg.cy}
              r={reg.r}
              fill={active ? "rgba(16,185,129,0.45)" : "rgba(52,211,153,0.12)"}
              stroke={active ? "#6ee7b7" : "#10b981"}
              strokeWidth={active ? "2.5" : "1.2"}
            />
            <circle cx={reg.cx} cy={reg.cy} r="4" fill={active ? "#ffffff" : "#34d399"} />
          </g>
        );
      })}
    </svg>
    <div className="grid grid-cols-1 gap-2 w-full">
      {REGIONS.map((reg) => (
        <div key={reg.id} className="bg-black/40 border border-emerald-500/20 rounded-xl p-2.5">
          <div className="text-[11px] font-mono uppercase text-emerald-400 mb-1.5">{reg.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {reg.symptoms.map((sym) => (
              <button
                key={sym}
                onClick={() => onToggleSymptom(sym)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedSymptoms.includes(sym)
                    ? "bg-emerald-500 text-black font-semibold"
                    : "bg-white/5 text-gray-300 hover:bg-emerald-500/20"
                }`}
              >
                {sym.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
