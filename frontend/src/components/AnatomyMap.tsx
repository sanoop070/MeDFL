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
  topPercent: number;
  leftPercent: number;
  regionId: string;
  anatomicalLabel: string;
}

const BODY_HOTSPOTS = [
  { id: "neuro", label: "NEURO", sublabel: "Cerebral & Central Nervous", topPercent: 11, leftPercent: 50, organView: "brain" as ViewMode },
  { id: "cardio_lung", label: "CHEST\nHEART / LUNG", sublabel: "Cardiopulmonary & Thoracic", topPercent: 24, leftPercent: 50, organView: "heart" as ViewMode },
  { id: "gi_endo", label: "ABDOMEN\nGI / ENDO", sublabel: "Metabolic & Gastrointestinal", topPercent: 37, leftPercent: 50, organView: "digestive" as ViewMode },
  { id: "joints_limbs", label: "JOINTS / LIMBS", sublabel: "Musculoskeletal & Locomotor", topPercent: 58, leftPercent: 50, organView: "body" as ViewMode },
  { id: "systemic", label: "⚡ SYSTEMIC / INFECTIOUS", sublabel: "Immune, Vitals & Infectious", topPercent: 91, leftPercent: 50, organView: "body" as ViewMode },
];

const REAL_BRAIN_HOTSPOTS: OrganHotspot[] = [
  { id: "throbbing_headache", name: "Throbbing Headache", topPercent: 32, leftPercent: 44, regionId: "neuro", anatomicalLabel: "Frontal / Parietal Cortex" },
  { id: "visual_aura_photophobia", name: "Visual Aura & Photophobia", topPercent: 42, leftPercent: 72, regionId: "neuro", anatomicalLabel: "Occipital Visual Lobe" },
  { id: "dizziness_vertigo", name: "Dizziness & Vertigo", topPercent: 74, leftPercent: 62, regionId: "neuro", anatomicalLabel: "Cerebellum & Vestibular" },
  { id: "blurred_vision", name: "Blurred Vision", topPercent: 48, leftPercent: 28, regionId: "neuro", anatomicalLabel: "Optic Nerve Pathways" },
  { id: "insomnia", name: "Insomnia & Neural Fog", topPercent: 55, leftPercent: 52, regionId: "neuro", anatomicalLabel: "Temporal Subcortex" },
];

const REAL_HEART_HOTSPOTS: OrganHotspot[] = [
  { id: "sharp_chest_pain", name: "Sharp Chest Pain", topPercent: 68, leftPercent: 52, regionId: "cardio_lung", anatomicalLabel: "Myocardial Apex / Ventricle" },
  { id: "chest_tightness_angina", name: "Chest Tightness / Angina", topPercent: 48, leftPercent: 62, regionId: "cardio_lung", anatomicalLabel: "Coronary Artery Branch" },
  { id: "palpitations", name: "Palpitations & Arrhythmia", topPercent: 42, leftPercent: 36, regionId: "cardio_lung", anatomicalLabel: "Right Atrium / Sinus Node" },
  { id: "shortness_of_breath", name: "Breathlessness on Exertion", topPercent: 25, leftPercent: 68, regionId: "cardio_lung", anatomicalLabel: "Ascending Aorta & Arch" },
];

const REAL_LUNGS_HOTSPOTS: OrganHotspot[] = [
  { id: "cough", name: "Persistent Cough / Tracheitis", topPercent: 18, leftPercent: 48, regionId: "cardio_lung", anatomicalLabel: "Trachea & Carina" },
  { id: "shortness_of_breath", name: "Dyspnea / Air Hunger", topPercent: 46, leftPercent: 32, regionId: "cardio_lung", anatomicalLabel: "Right Pulmonary Lobe" },
  { id: "sharp_chest_pain", name: "Pleuritic Pain", topPercent: 48, leftPercent: 68, regionId: "cardio_lung", anatomicalLabel: "Left Pleural Cavity" },
  { id: "chest_tightness_angina", name: "Bronchial Wheezing", topPercent: 72, leftPercent: 38, regionId: "cardio_lung", anatomicalLabel: "Lower Basal Segment" },
];

const REAL_DIGESTIVE_HOTSPOTS: OrganHotspot[] = [
  { id: "acid_reflux", name: "Acid Reflux / Heartburn", topPercent: 32, leftPercent: 50, regionId: "gi_endo", anatomicalLabel: "Gastroesophageal Junction" },
  { id: "nausea_vomiting", name: "Nausea & Gastric Stasis", topPercent: 52, leftPercent: 42, regionId: "gi_endo", anatomicalLabel: "Gastric Body" },
  { id: "excessive_hunger", name: "Polyphagia / Metabolic", topPercent: 54, leftPercent: 60, regionId: "gi_endo", anatomicalLabel: "Pancreatic Region" },
  { id: "abdominal_pain", name: "Abdominal Pain", topPercent: 75, leftPercent: 50, regionId: "gi_endo", anatomicalLabel: "Intestinal Peristalsis" },
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
          <span className="text-emerald-400 font-bold tracking-wider">PHOTOREALISTIC 3D ANATOMY</span>
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
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition flex items-center gap-1 border ${
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

      {/* 3D Viewport Box */}
      <div className="relative w-full h-[400px] rounded-2xl bg-gradient-to-b from-[#050906] via-[#08120a] to-[#040805] border border-emerald-500/25 flex items-center justify-center p-2 overflow-hidden shadow-[inset_0_0_40px_rgba(16,185,129,0.08)]">
        {/* Background Depth Grid & Ambient Rings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute w-72 h-72 rounded-full border border-emerald-500/10 pointer-events-none animate-pulse" />
        <div className="absolute w-48 h-48 rounded-full border border-emerald-500/15 pointer-events-none" />

        {/* Laser Scanline */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none transition-all duration-1000 z-20"
          style={{
            animation: "hologramScan 4s ease-in-out infinite alternate",
          }}
        />

        {/* Active Hotspot Tooltip Banner */}
        {hoveredHotspot && (
          <div className="absolute top-2.5 left-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-black/95 border border-emerald-400/60 backdrop-blur-md flex items-center justify-between text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-fadeIn">
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

        {/* ------------------- VIEW 1: PHOTOREALISTIC 3D ANATOMICAL BODY MODEL ------------------- */}
        {viewMode === "body" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            {/* Ambient Cyan/Blue Backing Glow */}
            <div className="absolute w-60 h-72 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

            {/* Real 3D Muscular & Nervous Anatomy Render */}
            <div className="relative h-full w-full flex items-center justify-center">
              <img
                src="/assets/real_body.png"
                alt="Photorealistic 3D Human Body Anatomy"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_25px_rgba(6,182,212,0.35)] transition-transform duration-700 hover:scale-102"
              />

              {/* Interactive Region Hotspot Pills Overlay */}
              {BODY_HOTSPOTS.map((spot) => {
                const isActive = activeRegion === spot.id;
                return (
                  <div
                    key={spot.id}
                    style={{ top: `${spot.topPercent}%`, left: `${spot.leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                  >
                    <button
                      onClick={() => {
                        onSelectRegion(isActive ? null : spot.id);
                        if (spot.organView !== "body") {
                          setViewMode(spot.organView);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight whitespace-nowrap border transition-all duration-200 flex items-center gap-1 shadow-lg ${
                        isActive
                          ? "bg-emerald-400 text-black border-emerald-300 scale-110 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                          : "bg-black/85 text-emerald-300 border-emerald-500/50 hover:bg-emerald-950/80 hover:border-emerald-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-black" : "bg-emerald-400 animate-pulse"}`} />
                      <span>{spot.label.replace("\n", " ")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- VIEW 2: PHOTOREALISTIC 3D BRAIN ------------------- */}
        {viewMode === "brain" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <div className="absolute w-56 h-56 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />

            <div className="relative w-64 h-56 flex items-center justify-center">
              <img
                src="/assets/real_brain.png"
                alt="Realistic 3D Human Brain"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(244,63,94,0.35)] transition-transform duration-700 hover:scale-105"
              />

              {REAL_BRAIN_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    style={{ top: `${spot.topPercent}%`, left: `${spot.leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group p-1"
                    title={spot.name}
                  >
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                        isSelected ? "bg-emerald-400" : "bg-white"
                      }`}
                    />
                    <span
                      className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-300 text-black"
                          : "bg-white/90 border-slate-900 text-emerald-500"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- VIEW 3: PHOTOREALISTIC 3D HEART ------------------- */}
        {viewMode === "heart" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <div className="absolute w-56 h-56 rounded-full bg-red-600/15 blur-2xl pointer-events-none" />

            <div className="relative w-64 h-60 flex items-center justify-center animate-pulse" style={{ animationDuration: "1.2s" }}>
              <img
                src="/assets/real_heart.png"
                alt="Realistic 3D Human Heart"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(239,68,68,0.4)] transition-transform duration-700 hover:scale-105"
              />

              {REAL_HEART_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    style={{ top: `${spot.topPercent}%`, left: `${spot.leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group p-1"
                    title={spot.name}
                  >
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                        isSelected ? "bg-emerald-400" : "bg-white"
                      }`}
                    />
                    <span
                      className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-300 text-black"
                          : "bg-white/90 border-slate-900 text-emerald-500"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- VIEW 4: PHOTOREALISTIC 3D LUNGS ------------------- */}
        {viewMode === "lungs" && (
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            <div className="absolute w-56 h-56 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />

            <div className="relative w-64 h-64 flex items-center justify-center">
              <img
                src="/assets/real_lungs.png"
                alt="Realistic 3D Human Lungs"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(244,63,94,0.35)] transition-transform duration-700 hover:scale-105"
              />

              {REAL_LUNGS_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    style={{ top: `${spot.topPercent}%`, left: `${spot.leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group p-1"
                    title={spot.name}
                  >
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                        isSelected ? "bg-emerald-400" : "bg-white"
                      }`}
                    />
                    <span
                      className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-300 text-black"
                          : "bg-white/90 border-slate-900 text-emerald-500"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- VIEW 5: REALISTIC 3D DIGESTIVE / METABOLIC ------------------- */}
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

              <rect x="120" y="15" width="12" height="55" rx="5" fill="#ca8a04" stroke="#a16207" strokeWidth="1.5" />

              <path
                d="M 60 70 C 85 55, 130 58, 145 75 C 135 95, 95 105, 65 95 Z"
                fill="url(#liverGrad)"
                stroke="#f87171"
                strokeWidth="1.2"
                opacity="0.8"
              />

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

              {REAL_DIGESTIVE_HOTSPOTS.map((spot) => {
                const isSelected = selectedSymptoms.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleHotspotClick(spot)}
                    onMouseEnter={() => setHoveredHotspot(spot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    style={{ top: `${spot.topPercent}%`, left: `${spot.leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group p-1"
                    title={spot.name}
                  >
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                        isSelected ? "bg-emerald-400" : "bg-white"
                      }`}
                    />
                    <span
                      className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-300 text-black"
                          : "bg-white/90 border-slate-900 text-emerald-500"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                  </button>
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
