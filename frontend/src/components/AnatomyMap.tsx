import React, { useState } from "react";
import { ORGAN_REGIONS, type OrganRegion } from "./anatomyData";

interface AnatomyMapProps {
  activeRegion: string | null;
  onSelectRegion: (regionId: string | null) => void;
  selectedSymptoms: string[];
  onToggleSymptom: (symptomId: string) => void;
}

type ViewMode = "body" | "brain" | "heart" | "lungs" | "digestive";

interface OrganHotspot {
  id: string;
  name: string;
  cx: number;
  cy: number;
  regionId: string;
  anatomicalLabel: string;
}

const BRAIN_HOTSPOTS: OrganHotspot[] = [
  { id: "throbbing_headache", name: "Throbbing Headache", cx: 105, cy: 95, regionId: "neuro", anatomicalLabel: "Frontal Cortex" },
  { id: "visual_aura_photophobia", name: "Visual Aura & Photophobia", cx: 165, cy: 115, regionId: "neuro", anatomicalLabel: "Occipital Lobe" },
  { id: "dizziness_vertigo", name: "Dizziness & Vertigo", cx: 145, cy: 165, regionId: "neuro", anatomicalLabel: "Cerebellum / Vestibular" },
  { id: "blurred_vision", name: "Blurred Vision", cx: 75, cy: 125, regionId: "neuro", anatomicalLabel: "Optic Chiasm" },
  { id: "insomnia", name: "Insomnia & Neural Fog", cx: 125, cy: 135, regionId: "neuro", anatomicalLabel: "Temporal Subcortex" },
];

const HEART_HOTSPOTS: OrganHotspot[] = [
  { id: "sharp_chest_pain", name: "Sharp Chest Pain", cx: 120, cy: 145, regionId: "cardio_lung", anatomicalLabel: "Left Ventricle" },
  { id: "chest_tightness_angina", name: "Chest Tightness / Angina", cx: 135, cy: 105, regionId: "cardio_lung", anatomicalLabel: "Coronary Artery" },
  { id: "palpitations", name: "Palpitations & Arrhythmia", cx: 95, cy: 90, regionId: "cardio_lung", anatomicalLabel: "Right Atrium / SA Node" },
  { id: "shortness_of_breath", name: "Breathlessness on Exertion", cx: 155, cy: 75, regionId: "cardio_lung", anatomicalLabel: "Aortic Arch" },
];

const LUNGS_HOTSPOTS: OrganHotspot[] = [
  { id: "cough", name: "Persistent Cough", cx: 125, cy: 45, regionId: "cardio_lung", anatomicalLabel: "Trachea & Carina" },
  { id: "shortness_of_breath", name: "Dyspnea / Air Hunger", cx: 80, cy: 110, regionId: "cardio_lung", anatomicalLabel: "Right Upper Lobe" },
  { id: "sharp_chest_pain", name: "Pleuritic Pain", cx: 170, cy: 125, regionId: "cardio_lung", anatomicalLabel: "Left Pleural Cavity" },
  { id: "chest_tightness_angina", name: "Bronchial Wheeze", cx: 105, cy: 155, regionId: "cardio_lung", anatomicalLabel: "Lower Bronchial Tree" },
];

const DIGESTIVE_HOTSPOTS: OrganHotspot[] = [
  { id: "acid_reflux", name: "Acid Reflux / Heartburn", cx: 125, cy: 75, regionId: "gi_endo", anatomicalLabel: "Gastroesophageal Junction" },
  { id: "nausea_vomiting", name: "Nausea & Gastric Stasis", cx: 105, cy: 115, regionId: "gi_endo", anatomicalLabel: "Gastric Body" },
  { id: "excessive_hunger", name: "Polyphagia / Metabolic", cx: 145, cy: 120, regionId: "gi_endo", anatomicalLabel: "Pancreatic Region" },
  { id: "abdominal_pain", name: "Abdominal Cramping", cx: 125, cy: 165, regionId: "gi_endo", anatomicalLabel: "Mesenteric Intestine" },
];

export const AnatomyMap: React.FC<AnatomyMapProps> = ({
  activeRegion,
  onSelectRegion,
  selectedSymptoms,
  onToggleSymptom,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("body");
  const [hoveredHotspot, setHoveredHotspot] = useState<OrganHotspot | null>(null);

  const activeRegionObj = ORGAN_REGIONS.find((r) => r.id === activeRegion);

  const getRegionActiveCount = (region: OrganRegion) => {
    return region.symptoms.filter((s) => selectedSymptoms.includes(s.id)).length;
  };

  const handleHotspotClick = (spot: OrganHotspot) => {
    onToggleSymptom(spot.id);
    onSelectRegion(spot.regionId);
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Top Header of Map */}
      <div className="flex items-center justify-between w-full mb-2.5 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-emerald-400 font-bold tracking-wider">3D ANATOMICAL ENGINE</span>
        </div>
        <button
          onClick={() => {
            setViewMode("body");
            onSelectRegion(null);
          }}
          className={`px-2.5 py-0.5 rounded-full border transition text-[10px] ${
            activeRegion === null && viewMode === "body"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium"
              : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
          }`}
        >
          {activeRegionObj ? activeRegionObj.label.replace("\n", " • ") : "Full Body (3D)"}
        </button>
      </div>

      {/* 3D Organ Focus Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1 w-full mb-3 px-1">
        {[
          { mode: "body" as ViewMode, label: "Full Body", icon: "👤", region: null },
          { mode: "brain" as ViewMode, label: "Brain (3D)", icon: "🧠", region: "neuro" },
          { mode: "heart" as ViewMode, label: "Heart (3D)", icon: "🫀", region: "cardio_lung" },
          { mode: "lungs" as ViewMode, label: "Lungs (3D)", icon: "🫁", region: "cardio_lung" },
          { mode: "digestive" as ViewMode, label: "GI (3D)", icon: "🧬", region: "gi_endo" },
        ].map((item) => {
          const isActive = viewMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => {
                setViewMode(item.mode);
                if (item.region) onSelectRegion(item.region);
                else onSelectRegion(null);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition flex items-center gap-1 border ${
                isActive
                  ? "bg-emerald-400 text-black border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
                  : "bg-black/40 text-gray-400 hover:text-gray-200 border-white/10 hover:border-emerald-500/30"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Animated Canvas / Viewport */}
      <div className="relative w-full h-[370px] rounded-2xl bg-gradient-to-b from-black/80 via-[#071109]/90 to-black/80 border border-emerald-500/25 flex items-center justify-center p-2 overflow-hidden shadow-[inset_0_0_30px_rgba(16,185,129,0.08)]">
        {/* Background Depth Grid & Ambient Rings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute w-64 h-64 rounded-full border border-emerald-500/10 pointer-events-none animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/15 pointer-events-none" />

        {/* Holographic Laser Scanline */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent pointer-events-none transition-all duration-1000"
          style={{
            animation: "hologramScan 4s ease-in-out infinite alternate",
          }}
        />

        {/* Active Hotspot Tooltip Banner */}
        {hoveredHotspot && (
          <div className="absolute top-2.5 left-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-black/90 border border-emerald-400/50 backdrop-blur-md flex items-center justify-between text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-fadeIn">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                {hoveredHotspot.anatomicalLabel}
              </div>
              <div className="text-white font-medium text-[11px]">{hoveredHotspot.name}</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedSymptoms.includes(hoveredHotspot.id)
                  ? "bg-emerald-500 text-black"
                  : "bg-white/10 text-gray-300"
              }`}
            >
              {selectedSymptoms.includes(hoveredHotspot.id) ? "Selected ✓" : "Click to Add +"}
            </span>
          </div>
        )}

        {/* ------------------- VIEW 1: FULL BODY HOLOGRAPHIC 3D SILHOUETTE ------------------- */}
        {viewMode === "body" && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 260 480"
              className="w-48 h-full drop-shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <defs>
                <linearGradient id="holoBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#08180e" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#040c07" stopOpacity="0.95" />
                </linearGradient>
                <radialGradient id="holoRing" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#050806" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Holographic 3D Head */}
              <ellipse
                cx="130"
                cy="52"
                rx="28"
                ry="34"
                fill="url(#holoBody)"
                stroke={activeRegion === "neuro" ? "#34d399" : "#10b98166"}
                strokeWidth={activeRegion === "neuro" ? "2.5" : "1.2"}
                className="transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setViewMode("brain");
                  onSelectRegion("neuro");
                }}
              />

              {/* Neural Synapses inside head */}
              <path
                d="M 120 40 Q 130 45 140 40 M 115 52 Q 130 56 145 52 M 122 64 Q 130 68 138 64"
                stroke="rgba(52,211,153,0.4)"
                strokeWidth="1"
                fill="none"
              />

              {/* 3D Torso & Limbs Silhouette */}
              <path
                d="M 88 92 
                   C 84 100, 72 130, 62 170 
                   C 58 185, 60 195, 66 195 
                   C 74 195, 84 165, 92 145 
                   L 92 245 
                   C 92 260, 96 270, 102 275
                   L 90 420 
                   C 88 435, 105 440, 114 425 
                   L 126 300 
                   L 134 300 
                   L 146 425 
                   C 155 440, 172 435, 170 420 
                   L 158 275 
                   C 164 270, 168 260, 168 245 
                   L 168 145 
                   C 176 165, 186 195, 194 195 
                   C 200 195, 202 185, 198 170 
                   C 188 130, 176 100, 172 92 
                   C 162 88, 148 86, 130 86 
                   C 112 86, 98 88, 88 92 Z"
                fill="url(#holoBody)"
                stroke="#10b98166"
                strokeWidth="1.2"
              />

              {/* Ribcage Wireframe Overlay */}
              <path
                d="M 108 120 Q 130 115 152 120 M 104 135 Q 130 130 156 135 M 102 150 Q 130 145 158 150 M 104 165 Q 130 160 156 165"
                stroke="rgba(52,211,153,0.22)"
                strokeWidth="1.2"
                fill="none"
              />

              {/* Spinal Central Axis */}
              <line
                x1="130"
                y1="86"
                x2="130"
                y2="270"
                stroke="rgba(52,211,153,0.3)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />

              {/* Hotspot 1: NEURO */}
              <g
                className="cursor-pointer group"
                onClick={() => {
                  setViewMode("brain");
                  onSelectRegion("neuro");
                }}
              >
                <circle cx="130" cy="52" r="14" fill="url(#holoRing)" className="animate-ping" opacity="0.6" />
                <rect
                  x="98"
                  y="40"
                  width="64"
                  height="24"
                  rx="12"
                  fill={activeRegion === "neuro" ? "#10b981" : "#0d1a12"}
                  stroke={activeRegion === "neuro" ? "#34d399" : "#10b98188"}
                  strokeWidth="1.5"
                />
                <text
                  x="130"
                  y="56"
                  textAnchor="middle"
                  fill={activeRegion === "neuro" ? "#000000" : "#34d399"}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  NEURO
                </text>
              </g>

              {/* Hotspot 2: CHEST (HEART / LUNG) */}
              <g
                className="cursor-pointer group"
                onClick={() => {
                  setViewMode("heart");
                  onSelectRegion("cardio_lung");
                }}
              >
                <circle cx="130" cy="140" r="18" fill="url(#holoRing)" className="animate-ping" opacity="0.6" />
                <rect
                  x="82"
                  y="120"
                  width="96"
                  height="40"
                  rx="10"
                  fill={activeRegion === "cardio_lung" ? "#10b981" : "#0d1a12"}
                  stroke={activeRegion === "cardio_lung" ? "#34d399" : "#10b98188"}
                  strokeWidth="1.5"
                />
                <text
                  x="130"
                  y="136"
                  textAnchor="middle"
                  fill={activeRegion === "cardio_lung" ? "#000000" : "#34d399"}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  CHEST
                </text>
                <text
                  x="130"
                  y="149"
                  textAnchor="middle"
                  fill={activeRegion === "cardio_lung" ? "#000000" : "#10b981"}
                  fontSize="8"
                  fontWeight="semibold"
                  fontFamily="monospace"
                >
                  HEART / LUNG
                </text>
              </g>

              {/* Hotspot 3: ABDOMEN (GI / ENDO) */}
              <g
                className="cursor-pointer group"
                onClick={() => {
                  setViewMode("digestive");
                  onSelectRegion("gi_endo");
                }}
              >
                <circle cx="130" cy="205" r="16" fill="url(#holoRing)" className="animate-ping" opacity="0.5" />
                <rect
                  x="85"
                  y="188"
                  width="90"
                  height="36"
                  rx="10"
                  fill={activeRegion === "gi_endo" ? "#10b981" : "#0d1a12"}
                  stroke={activeRegion === "gi_endo" ? "#34d399" : "#10b98188"}
                  strokeWidth="1.5"
                />
                <text
                  x="130"
                  y="203"
                  textAnchor="middle"
                  fill={activeRegion === "gi_endo" ? "#000000" : "#34d399"}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ABDOMEN
                </text>
                <text
                  x="130"
                  y="216"
                  textAnchor="middle"
                  fill={activeRegion === "gi_endo" ? "#000000" : "#10b981"}
                  fontSize="8"
                  fontWeight="semibold"
                  fontFamily="monospace"
                >
                  GI / ENDO
                </text>
              </g>

              {/* Hotspot 4: JOINTS / LIMBS */}
              <g
                className="cursor-pointer group"
                onClick={() => onSelectRegion(activeRegion === "joints_limbs" ? null : "joints_limbs")}
              >
                <rect
                  x="78"
                  y="315"
                  width="104"
                  height="28"
                  rx="10"
                  fill={activeRegion === "joints_limbs" ? "#10b981" : "#0d1a12"}
                  stroke={activeRegion === "joints_limbs" ? "#34d399" : "#10b98188"}
                  strokeWidth="1.5"
                />
                <text
                  x="130"
                  y="333"
                  textAnchor="middle"
                  fill={activeRegion === "joints_limbs" ? "#000000" : "#34d399"}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  JOINTS / LIMBS
                </text>
              </g>

              {/* Hotspot 5: SYSTEMIC / INFECTIOUS */}
              <g
                className="cursor-pointer group"
                onClick={() => onSelectRegion(activeRegion === "systemic" ? null : "systemic")}
              >
                <rect
                  x="52"
                  y="442"
                  width="156"
                  height="26"
                  rx="13"
                  fill={activeRegion === "systemic" ? "#10b981" : "#08150c"}
                  stroke={activeRegion === "systemic" ? "#34d399" : "#10b98188"}
                  strokeWidth="1.2"
                />
                <text
                  x="130"
                  y="459"
                  textAnchor="middle"
                  fill={activeRegion === "systemic" ? "#000000" : "#34d399"}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ⚡ SYSTEMIC / INFECTIOUS
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* ------------------- VIEW 2: REALISTIC 3D BRAIN MODEL ------------------- */}
        {viewMode === "brain" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <svg
              viewBox="0 0 240 220"
              className="w-56 h-52 drop-shadow-[0_15px_30px_rgba(236,72,153,0.2)]"
            >
              <defs>
                <radialGradient id="brain3D" cx="45%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="35%" stopColor="#e11d48" />
                  <stop offset="70%" stopColor="#881337" />
                  <stop offset="100%" stopColor="#3b0717" />
                </radialGradient>
                <radialGradient id="cerebellumGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#4c0519" />
                </radialGradient>
              </defs>

              {/* Brainstem */}
              <path
                d="M 130 160 C 130 185, 140 205, 145 210 L 125 210 C 122 195, 120 180, 118 165 Z"
                fill="#9f1239"
                stroke="#4c0519"
                strokeWidth="1.5"
              />

              {/* Cerebellum (posterior) */}
              <ellipse
                cx="145"
                cy="165"
                rx="35"
                ry="22"
                fill="url(#cerebellumGrad)"
                stroke="#fb7185"
                strokeWidth="1.5"
              />
              <path
                d="M 120 160 Q 145 168 170 160 M 125 170 Q 145 176 165 170"
                stroke="#4c0519"
                strokeWidth="1.2"
                fill="none"
              />

              {/* Cerebral Cortex (Main Body with realistic folds) */}
              <path
                d="M 60 135 
                   C 40 120, 35 90, 50 65 
                   C 65 40, 95 30, 125 32 
                   C 155 35, 185 45, 195 70 
                   C 205 95, 195 125, 180 145 
                   C 165 155, 145 160, 130 160 
                   C 115 160, 100 145, 85 148 
                   C 75 150, 65 145, 60 135 Z"
                fill="url(#brain3D)"
                stroke="#f43f5e"
                strokeWidth="2"
              />

              {/* Deep Sulci & Gyri (Brain Folds & Curves) */}
              <path
                d="M 55 75 Q 85 85 105 70 Q 135 60 155 75 Q 180 80 190 95"
                stroke="#881337"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 55 75 Q 85 85 105 70 Q 135 60 155 75 Q 180 80 190 95"
                stroke="#fda4af"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 75 100 Q 105 110 125 95 Q 145 90 170 110"
                stroke="#881337"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 75 100 Q 105 110 125 95 Q 145 90 170 110"
                stroke="#fda4af"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 65 125 Q 95 130 115 120 Q 140 125 165 135"
                stroke="#881337"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 95 45 Q 110 60 125 45 Q 140 55 165 48"
                stroke="#881337"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />

              {/* Interactive Radar Hotspots */}
              {BRAIN_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <g
                    key={spot.id}
                    className="cursor-pointer group"
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="10"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="7"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      stroke={isSelected ? "#34d399" : "#0d110f"}
                      strokeWidth="2"
                      className="shadow-lg transition-transform group-hover:scale-125"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="2.5"
                      fill={isSelected ? "#000000" : "#10b981"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ------------------- VIEW 3: REALISTIC 3D HEART MODEL ------------------- */}
        {viewMode === "heart" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <svg
              viewBox="0 0 240 220"
              className="w-56 h-52 drop-shadow-[0_15px_30px_rgba(239,68,68,0.25)] animate-pulse"
              style={{ animationDuration: "1.2s" }}
            >
              <defs>
                <radialGradient id="heartMuscle" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="40%" stopColor="#dc2626" />
                  <stop offset="75%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>
                <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="pulmonaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>

              {/* Superior Vena Cava & Pulmonary Trunk */}
              <rect x="75" y="25" width="22" height="45" rx="8" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
              <path
                d="M 125 50 Q 115 70 95 85 L 110 95 Q 130 75 140 55 Z"
                fill="url(#pulmonaryGrad)"
              />

              {/* Aortic Arch & Arterial Branches */}
              <path
                d="M 105 60 C 105 30, 155 25, 160 55 C 162 68, 150 85, 140 90 L 125 75 Z"
                fill="url(#aortaGrad)"
                stroke="#f87171"
                strokeWidth="1.5"
              />
              {/* Carotid Branches */}
              <rect x="120" y="16" width="7" height="18" rx="3" fill="#ef4444" />
              <rect x="132" y="14" width="7" height="20" rx="3" fill="#ef4444" />
              <rect x="144" y="18" width="7" height="18" rx="3" fill="#ef4444" />

              {/* Main Cardiac Muscular Body (Ventricles & Atria) */}
              <path
                d="M 85 85 
                   C 65 95, 60 120, 70 145 
                   C 80 170, 110 195, 125 208 
                   C 135 195, 175 155, 185 125 
                   C 192 100, 175 80, 150 82 
                   C 135 84, 120 90, 115 95 
                   C 105 88, 95 82, 85 85 Z"
                fill="url(#heartMuscle)"
                stroke="#fca5a5"
                strokeWidth="2"
              />

              {/* Anterior Interventricular Sulcus & Coronary Vessels */}
              <path
                d="M 120 95 Q 125 140 115 185"
                stroke="#7f1d1d"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 120 95 Q 125 140 115 185"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Branching capillaries */}
              <path
                d="M 122 125 Q 105 135 95 130 M 123 150 Q 140 160 150 155 M 118 165 Q 105 175 100 170"
                stroke="#fca5a5"
                strokeWidth="1"
                fill="none"
              />

              {/* Interactive Radar Hotspots */}
              {HEART_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <g
                    key={spot.id}
                    className="cursor-pointer group"
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="10"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="7"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      stroke={isSelected ? "#34d399" : "#0d110f"}
                      strokeWidth="2"
                      className="shadow-lg transition-transform group-hover:scale-125"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="2.5"
                      fill={isSelected ? "#000000" : "#10b981"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ------------------- VIEW 4: REALISTIC 3D LUNGS MODEL ------------------- */}
        {viewMode === "lungs" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <svg
              viewBox="0 0 240 220"
              className="w-56 h-52 drop-shadow-[0_15px_30px_rgba(244,63,94,0.22)]"
            >
              <defs>
                <radialGradient id="lungLeft" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="40%" stopColor="#e11d48" />
                  <stop offset="85%" stopColor="#881337" />
                  <stop offset="100%" stopColor="#4c0519" />
                </radialGradient>
                <radialGradient id="lungRight" cx="55%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="40%" stopColor="#e11d48" />
                  <stop offset="85%" stopColor="#881337" />
                  <stop offset="100%" stopColor="#4c0519" />
                </radialGradient>
              </defs>

              {/* Trachea with Cartilage Rings */}
              <path
                d="M 118 10 L 118 65 L 105 85 L 115 90 L 125 72 L 135 90 L 145 85 L 132 65 L 132 10 Z"
                fill="#fda4af"
                stroke="#e11d48"
                strokeWidth="1.5"
              />
              {[20, 30, 40, 50, 60].map((y) => (
                <line
                  key={y}
                  x1="118"
                  y1={y}
                  x2="132"
                  y2={y}
                  stroke="#be123c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}

              {/* Right Lung (3 lobes) */}
              <path
                d="M 112 75 
                   C 95 65, 65 80, 50 110 
                   C 38 135, 42 165, 55 185 
                   C 70 200, 95 195, 108 175 
                   C 115 155, 114 105, 112 75 Z"
                fill="url(#lungRight)"
                stroke="#fda4af"
                strokeWidth="1.8"
              />

              {/* Left Lung (2 lobes, cardiac notch) */}
              <path
                d="M 138 75 
                   C 155 65, 185 80, 200 110 
                   C 212 135, 205 165, 192 185 
                   C 178 200, 155 195, 142 165 
                   C 134 140, 136 105, 138 75 Z"
                fill="url(#lungLeft)"
                stroke="#fda4af"
                strokeWidth="1.8"
              />

              {/* Internal Bronchial Tree branches */}
              <path
                d="M 105 85 Q 85 105 75 140 M 85 115 Q 65 125 60 150 M 145 85 Q 165 105 175 140 M 165 115 Q 185 125 190 150"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
                fill="none"
              />

              {/* Interactive Radar Hotspots */}
              {LUNGS_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <g
                    key={spot.id}
                    className="cursor-pointer group"
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="10"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="7"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      stroke={isSelected ? "#34d399" : "#0d110f"}
                      strokeWidth="2"
                      className="shadow-lg transition-transform group-hover:scale-125"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="2.5"
                      fill={isSelected ? "#000000" : "#10b981"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ------------------- VIEW 5: REALISTIC 3D DIGESTIVE / GI MODEL ------------------- */}
        {viewMode === "digestive" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <svg
              viewBox="0 0 240 220"
              className="w-56 h-52 drop-shadow-[0_15px_30px_rgba(234,179,8,0.2)]"
            >
              <defs>
                <radialGradient id="stomachGrad" cx="45%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="40%" stopColor="#ca8a04" />
                  <stop offset="85%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#422006" />
                </radialGradient>
                <radialGradient id="liverGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>
              </defs>

              {/* Esophagus */}
              <rect x="120" y="15" width="12" height="55" rx="5" fill="#ca8a04" stroke="#a16207" strokeWidth="1.5" />

              {/* Liver Silhouette Contour */}
              <path
                d="M 60 70 C 85 55, 130 58, 145 75 C 135 95, 95 105, 65 95 Z"
                fill="url(#liverGrad)"
                stroke="#f87171"
                strokeWidth="1.2"
                opacity="0.8"
              />

              {/* Stomach Contour with J-shape curvature */}
              <path
                d="M 125 65 
                   C 105 65, 80 85, 85 115 
                   C 90 145, 125 155, 150 140 
                   C 165 125, 155 100, 140 95 
                   C 135 85, 132 75, 125 65 Z"
                fill="url(#stomachGrad)"
                stroke="#fef08a"
                strokeWidth="2"
              />

              {/* Intestinal Loops */}
              <path
                d="M 95 150 Q 120 160 145 150 Q 155 170 135 180 Q 115 170 95 180 Q 85 195 115 205 Q 145 200 155 185"
                stroke="#a16207"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 95 150 Q 120 160 145 150 Q 155 170 135 180 Q 115 170 95 180 Q 85 195 115 205 Q 145 200 155 185"
                stroke="#fef08a"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Interactive Radar Hotspots */}
              {DIGESTIVE_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <g
                    key={spot.id}
                    className="cursor-pointer group"
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="10"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="7"
                      fill={isSelected ? "#10b981" : "#ffffff"}
                      stroke={isSelected ? "#34d399" : "#0d110f"}
                      strokeWidth="2"
                      className="shadow-lg transition-transform group-hover:scale-125"
                    />
                    <circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r="2.5"
                      fill={isSelected ? "#000000" : "#10b981"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Region Symptom Chips if region is selected */}
      {activeRegionObj && (
        <div className="w-full mt-2.5 p-2.5 rounded-xl bg-black/50 border border-emerald-500/20 text-xs">
          <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 mb-1.5 uppercase">
            <span>{activeRegionObj.sublabel}</span>
            <span>{getRegionActiveCount(activeRegionObj)} active</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {activeRegionObj.symptoms.map((s) => {
              const isSelected = selectedSymptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggleSymptom(s.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    isSelected
                      ? "bg-emerald-500 text-black font-semibold shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : "bg-white/5 text-gray-300 hover:bg-emerald-500/15 border border-white/5"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show All Organ Systems Button */}
      <button
        onClick={() => {
          setViewMode("body");
          onSelectRegion(null);
        }}
        className="mt-3 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition font-medium flex items-center justify-center gap-1.5"
      >
        <span>Show All Organ Systems</span>
      </button>
    </div>
  );
};
