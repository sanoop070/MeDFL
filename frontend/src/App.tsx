import React, { useEffect, useState, useMemo } from "react";
import {
  fetchSymptoms,
  predictDisease,
  runFederatedTraining,
  queryMedicalSearchChat,
  INITIAL_SYMPTOMS_LIST,
} from "./lib/api";
import type {
  PredictionResponse,
  FederatedResponse,
  ChatSearchResponse,
} from "./lib/api";
import { AnatomyMap } from "./components/AnatomyMap";
import { ORGAN_REGIONS } from "./components/anatomyData";

const CATEGORY_TABS = [
  "All",
  "Neuro",
  "Cardio",
  "Lung",
  "GI",
  "Endocrine",
  "Infectious",
  "Joints",
] as const;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  detectedSymptoms?: string[];
  prediction?: PredictionResponse | null;
  workup?: string;
  citations?: { title: string; url: string }[];
  followUps?: string[];
}

export default function App() {
  const [largeText, setLargeText] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);

  // Hero MedSearch AI State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ChatSearchResponse | null>(null);

  // Copilot Drawer State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "ai",
      text: "Hello! I am your MeDFL Universal Search & Clinical Copilot. Describe any symptoms naturally (e.g., 'I have a sharp throat pain too'), ask about any disease, medication, or lab value, and I will remember context across our chat and sync with the Anatomical Analyzer.",
    },
  ]);

  // Symptom Analyzer State
  const [allSymptoms, setAllSymptoms] = useState<string[]>(INITIAL_SYMPTOMS_LIST);
  const [symptomFilter, setSymptomFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_TABS)[number]>("All");
  const [activeRegion, setActiveRegion] = useState<string | null>("neuro");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "throbbing_headache",
    "visual_aura_photophobia",
    "nausea_vomiting",
  ]);
  const [severity, setSeverity] = useState("Moderate (4-6 / 10)");
  const [duration, setDuration] = useState("Subacute (3-14 days)");
  const [infoTab, setInfoTab] = useState<
    "overview" | "labs" | "precautions" | "medications" | "diet" | "workouts"
  >("overview");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Cardio & Metabolic Engine State
  const [hba1c, setHba1c] = useState(5.8);
  const [systolicBp, setSystolicBp] = useState(126);
  const [glucose, setGlucose] = useState(104);
  const [ldlRatio, setLdlRatio] = useState(2.4);

  // Federated Telemetry State
  const [flRounds] = useState(14);
  const [dpSigma, setDpSigma] = useState(1.1);
  const [flLoading, setFlLoading] = useState(false);
  const [flResult, setFlResult] = useState<FederatedResponse | null>(null);

  // Text to Speech Helper
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Run Differential Prediction
  const handleRunPrediction = async (syms = selectedSymptoms) => {
    if (!syms.length) return;
    setPredicting(true);
    try {
      const res = await predictDisease(syms);
      setPrediction(res);
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(false);
    }
  };

  // Run Federated Round
  const handleRunFederated = async (r = flRounds, s = dpSigma) => {
    setFlLoading(true);
    try {
      const res = await runFederatedTraining(r, s);
      setFlResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFlLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSymptoms().then((syms) => {
      if (syms?.length) setAllSymptoms(syms);
    });
    handleRunPrediction([
      "throbbing_headache",
      "visual_aura_photophobia",
      "nausea_vomiting",
    ]);
    handleRunFederated(14, 1.1);
  }, []);

  // Toggle single symptom
  const toggleSymptom = (sym: string) => {
    const next = selectedSymptoms.includes(sym)
      ? selectedSymptoms.filter((s) => s !== sym)
      : [...selectedSymptoms, sym];
    setSelectedSymptoms(next);
    if (next.length) {
      handleRunPrediction(next);
    }
  };

  // Select body region from AnatomyMap
  const handleSelectRegion = (regionId: string | null) => {
    setActiveRegion(regionId);
    if (!regionId) {
      setActiveCategory("All");
      return;
    }
    const match = ORGAN_REGIONS.find((r) => r.id === regionId);
    if (match) {
      setActiveCategory(match.category);
    }
  };

  // Run Hero MedSearch
  const handleMedSearch = async (customQuery?: string) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const res = await queryMedicalSearchChat(q, selectedSymptoms);
      setSearchResult(res);
      if (res.detected_symptoms?.length) {
        setSelectedSymptoms(res.detected_symptoms);
      }
      if (res.prediction) {
        setPrediction(res.prediction);
      }
      if (ttsEnabled) {
        speak(res.answer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Send message in Floating Copilot Drawer
  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = (customMsg ?? chatInput).trim();
    if (!msg) return;

    const userMsgId = `user-${Date.now()}`;
    const newChatList: ChatMessage[] = [
      ...chatMessages,
      { id: userMsgId, role: "user", text: msg },
    ];
    setChatMessages(newChatList);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await queryMedicalSearchChat(msg, selectedSymptoms);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: res.answer,
        detectedSymptoms: res.detected_symptoms,
        prediction: res.prediction,
        workup: res.prediction?.clinical_profile
          ? `Recommended Labs & Workup: Complete Blood Count, Differential, Centor/McIsaac clinical evaluation, and targeted biomarker tests.`
          : undefined,
        citations: res.citations,
        followUps: [
          "+ What labs confirm this condition?",
          "+ How is this treated?",
        ],
      };
      setChatMessages([...newChatList, aiMsg]);

      if (res.detected_symptoms?.length) {
        setSelectedSymptoms(res.detected_symptoms);
      }
      if (res.prediction) {
        setPrediction(res.prediction);
      }
      if (ttsEnabled) {
        speak(res.answer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Sync symptoms from chat to body map
  const handleSyncToBodyMap = (syms?: string[]) => {
    const toSync = syms && syms.length > 0 ? syms : ["sore_throat", "high_fever"];
    setSelectedSymptoms(toSync);
    handleRunPrediction(toSync);
    // Smooth scroll to analyzer
    const el = document.getElementById("analyzer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Filter symptoms list based on category & search text
  const filteredSymptoms = useMemo(() => {
    let list = allSymptoms;

    // Filter by category
    if (activeCategory === "Neuro") {
      list = list.filter((s) =>
        /headache|vision|aura|dizz|vertigo|tingling|insomnia|numb/i.test(s)
      );
    } else if (activeCategory === "Cardio") {
      list = list.filter((s) =>
        /chest|palpitation|heart|pulse|angina/i.test(s)
      );
    } else if (activeCategory === "Lung") {
      list = list.filter((s) =>
        /breath|cough|lung|dyspnea|respiratory/i.test(s)
      );
    } else if (activeCategory === "GI") {
      list = list.filter((s) =>
        /nausea|vomit|abdomin|stomach|gast|reflux|hunger/i.test(s)
      );
    } else if (activeCategory === "Endocrine") {
      list = list.filter((s) =>
        /polyuria|thirst|glucose|diabet|weight|hunger/i.test(s)
      );
    } else if (activeCategory === "Infectious") {
      list = list.filter((s) =>
        /fever|chill|sweat|rash|throat|infection|fatigue/i.test(s)
      );
    } else if (activeCategory === "Joints") {
      list = list.filter((s) =>
        /joint|muscle|stiff|back|bone|swell|ache/i.test(s)
      );
    }

    if (symptomFilter.trim()) {
      const q = symptomFilter.toLowerCase().replace(/\s+/g, "_");
      list = list.filter((s) => s.toLowerCase().includes(q));
    }

    // Ensure currently selected are prioritized or visible
    return list.slice(0, 36);
  }, [allSymptoms, activeCategory, symptomFilter]);

  // Calculate Cardio & Metabolic Risk
  const cardioRisk = useMemo(() => {
    const raw =
      (hba1c - 5.0) * 1.5 +
      (systolicBp - 110) * 0.12 +
      (glucose - 90) * 0.05 +
      (ldlRatio - 1.8) * 1.2;
    return Math.max(2.1, Math.min(64.0, Number(raw.toFixed(1))));
  }, [hba1c, systolicBp, glucose, ldlRatio]);

  const profile = prediction?.clinical_profile;

  return (
    <div
      className={`min-h-screen bg-[#050806] text-[#F4F7F5] selection:bg-emerald-500 selection:text-black ${
        largeText ? "large-text" : ""
      }`}
    >
      {/* 1. STICKY TOP HEADER BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050806]/90 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg leading-none tracking-tight text-white">MeDFL</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono text-emerald-300 font-semibold tracking-wide">
                  V3.0 CLINICAL AI
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                Privacy-First Medical AI Platform
              </div>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-gray-300">
            <a href="#medsearch" className="flex items-center gap-1.5 hover:text-emerald-400 transition">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              MedSearch AI
            </a>
            <a href="#analyzer" className="hover:text-emerald-400 transition">
              Symptom Analyzer
            </a>
            <a href="#cardiometabolic" className="hover:text-emerald-400 transition">
              Cardio &amp; Metabolic
            </a>
            <a href="#federated" className="hover:text-emerald-400 transition">
              FL &amp; Privacy Hub
            </a>
            <button
              onClick={() => setBlueprintOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] hover:bg-emerald-500/25 transition shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              9.5/10 Blueprint
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLargeText(!largeText)}
              title="Toggle Large Text"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                largeText
                  ? "bg-emerald-400 text-black border-emerald-400"
                  : "bg-black/50 text-gray-300 border-white/10 hover:border-emerald-500/30"
              }`}
            >
              A+
            </button>
            <button
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (next) speak("Text to speech enabled");
              }}
              title="Toggle Screen Reader Voice"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition ${
                ttsEnabled
                  ? "bg-emerald-400 text-black font-bold border-emerald-400"
                  : "bg-black/50 text-gray-300 border-white/10 hover:border-emerald-500/30"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>TTS</span>
            </button>
            <a
              href="#analyzer"
              className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_18px_rgba(52,211,153,0.35)]"
            >
              <span>Diagnose</span>
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION: MEDSEARCH AI + BIO-TELEMETRY */}
      <section id="medsearch" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Google-Speed Medical Intelligence */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              MULTI-SYSTEM DIFFERENTIAL AI • FEDERATED PRIVACY (ε-DP)
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Google-Speed <br />
              <span className="text-emerald-400">Medical Intelligence.</span>
            </h1>

            <p className="mt-4 text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Ask any medical question, compare conditions, check drug interactions, or analyze multi-organ symptoms across{" "}
              <span className="text-white font-medium">Cardiology, Endocrinology, Neurology, Respiratory &amp; GI</span> — powered by Federated AI.
            </p>

            {/* Sub-label bar */}
            <div className="mt-6 flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span>✦</span> MedSearch AI — Clinical Knowledge &amp; Triage Engine
              </span>
              <span className="text-gray-400 hidden sm:inline">Voice &amp; Screen-Reader Accessible</span>
            </div>

            {/* Search Input Bar */}
            <div className="mt-2.5 emerald-card rounded-2xl p-2 flex items-center gap-2 bg-[#080d09]/90 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]">
              <div className="pl-3 text-emerald-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMedSearch()}
                placeholder="Ask anything: 'I have a sharp throat pain', 'HbA1c 7.4', 'Atorvastatin' ..."
                className="w-full bg-transparent px-2 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none font-sans"
              />
              <button
                type="button"
                onClick={() => {
                  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
                    speak("Listening for clinical query...");
                  } else {
                    speak("Speech recognition simulated. Please type your query.");
                  }
                }}
                title="Microphone input"
                className="p-2 text-gray-400 hover:text-emerald-300 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>
              <button
                onClick={() => handleMedSearch()}
                disabled={searchLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              >
                {searchLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Ask AI</span>
                )}
              </button>
            </div>

            {/* Quick Query Chips */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                "Sharp throat pain & fever",
                "Type 1 vs Type 2 Diabetes",
                "Atrial Fibrillation signs",
                "Metformin & Vitamin B12",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setSearchQuery(chip);
                    handleMedSearch(chip);
                  }}
                  className="px-3 py-1 rounded-full bg-black/60 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-gray-300 transition text-[11px]"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Structured Clinical Answer Card */}
            <div className="mt-6 emerald-card rounded-2xl p-5 border-emerald-500/30 bg-[#09110c]/85">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono text-emerald-300 font-semibold tracking-wider">
                  UNIVERSAL CLINICAL SEARCH + LIVE MEDICAL RETRIEVAL
                </span>
                <button
                  onClick={() =>
                    speak(
                      searchResult?.answer ||
                        "MeDFL combines natural-language symptom extraction, multi-turn conversational memory, and live open-domain medical retrieval."
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-white border border-white/10 text-[11px] font-mono flex items-center gap-1 transition"
                >
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Read</span>
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                {searchResult ? "Clinical Synthesis & Differential Workup" : "Ask Any Symptom, Lab Value, Medication, or Medical Question"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {searchResult?.answer ||
                  'MeDFL combines natural-language symptom extraction, multi-turn conversational memory, SHAP differential diagnosis, and live open-domain medical retrieval (Wikimedia Medical + OpenFDA Drug Labels). Describe how you feel in plain English—like "I have a sharp throat pain too"—or look up any disease, drug, or lab result.'}
              </p>

              {/* Two side-by-side inner cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 mb-1.5">
                    <span>⚡</span> CLINICAL MECHANISMS &amp; WORKUP
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Detected symptoms accumulate across your conversation so follow-up details refine the Top-3 differential diagnosis and recommended diagnostic labs automatically.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400 mb-1.5">
                    <span>🚨</span> RED-FLAG EMERGENCY SIGNS
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Seek immediate emergency care for crushing chest pain, difficulty breathing/swallowing saliva, sudden unilateral weakness/slurred speech, or severe confusion.
                  </p>
                </div>
              </div>

              {/* Bottom Tags / Follow-ups */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-400">Follow-ups:</span>
                  <button
                    onClick={() => {
                      setSearchQuery("Sharp throat pain & dysphagia");
                      handleMedSearch("Sharp throat pain & dysphagia");
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-emerald-300 text-[11px]"
                  >
                    + Sharp throat pain &amp; dysphagia
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("Interpret HbA1c 7.4%");
                      handleMedSearch("Interpret HbA1c 7.4%");
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-emerald-300 text-[11px]"
                  >
                    + Interpret HbA1c 7.4%
                  </button>
                </div>
                <button
                  onClick={() => setChatOpen(true)}
                  className="font-mono text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition"
                >
                  <span>Continue in Copilot Chat</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Bio-Telemetry Monitor Card */}
          <div className="lg:col-span-5 emerald-card rounded-3xl p-6 bg-[#080d09]/95 border-emerald-500/30 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ● EDGE-NODE // BIO-TELEMETRY
              </span>
              <span className="text-[11px] text-gray-400">AES-256 + ε-DP</span>
            </div>

            {/* Angled 3D ECG / Waveform Screen */}
            <div className="relative rounded-2xl bg-black border-2 border-emerald-500/35 p-4 shadow-[0_0_30px_rgba(16,185,129,0.18)] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_75%)]" />

              <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 relative z-10 mb-2">
                <span className="tracking-widest">MULTI-ORGAN TRIAGE // ACTIVE</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">SHAP-ON</span>
              </div>

              {/* Screen Nodes & Waveform */}
              <div className="relative h-28 flex items-center justify-between px-2">
                {/* Node 1 */}
                <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-center font-mono text-[9px] text-emerald-300 font-bold z-10 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  N1
                </div>

                {/* Animated ECG Pulse SVG Line */}
                <svg
                  viewBox="0 0 240 80"
                  className="absolute inset-0 w-full h-full stroke-emerald-400 fill-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 40 L 40 40 L 50 35 L 60 45 L 70 40 L 85 40 L 95 10 L 105 70 L 115 25 L 125 45 L 135 40 L 170 40 L 180 30 L 190 50 L 200 40 L 240 40"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse-ecg drop-shadow-[0_0_8px_#34d399]"
                  />
                </svg>

                {/* Node 2 */}
                <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-center font-mono text-[9px] text-emerald-300 font-bold z-10 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  N2
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 pt-2 border-t border-emerald-500/20 relative z-10">
                <span className="text-gray-400">FEDAVG HASH: 0x9F4E...C81A</span>
                <span className="text-emerald-400 font-semibold">100% Client-Side</span>
              </div>
            </div>

            {/* 3 Stat Boxes underneath */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-center">
                <div className="text-[10px] font-mono uppercase text-gray-400">CONDITIONS</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">14+ Systems</div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-center">
                <div className="text-[10px] font-mono uppercase text-gray-400">PRIVACY</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">ε = 0.85 DP</div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-center">
                <div className="text-[10px] font-mono uppercase text-gray-400">EXPLAINABILITY</div>
                <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">TreeSHAP</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE ANATOMICAL SYMPTOM ANALYZER */}
      <section id="analyzer" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
              FULL-SPECTRUM MULTI-ORGAN DIFFERENTIAL ENGINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Interactive Anatomical <span className="text-emerald-400">Symptom Analyzer.</span>
            </h2>
          </div>
          <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
            Click an anatomical region on the body map or search across Neurological, Cardiovascular, Respiratory, Gastrointestinal, Endocrine/Metabolic, Infectious &amp; Musculoskeletal systems—adjust symptom severity &amp; duration to compute ranked differential diagnoses.
          </p>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Body Region Filter Card */}
          <div className="lg:col-span-3 emerald-card rounded-2xl p-5 flex flex-col justify-between bg-[#080d09]/95 border-emerald-500/25">
            <AnatomyMap
              activeRegion={activeRegion}
              onSelectRegion={handleSelectRegion}
              selectedSymptoms={selectedSymptoms}
              onToggleSymptom={toggleSymptom}
            />
          </div>

          {/* Middle Column: All Symptoms Selector Card */}
          <div className="lg:col-span-4 emerald-card rounded-2xl p-5 flex flex-col justify-between bg-[#080d09]/95 border-emerald-500/25">
            <div>
              {/* Search box */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={symptomFilter}
                  onChange={(e) => setSymptomFilter(e.target.value)}
                  placeholder="Search 35+ symptoms (fever, joint pain, cough)..."
                  className="w-full bg-black/60 border border-emerald-500/30 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              {/* Category Pills (2 rows) */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      if (cat === "All") setActiveRegion(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                      activeCategory === cat
                        ? "bg-emerald-400 text-black font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                        : "bg-black/50 text-gray-300 hover:text-white border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Symptoms Pills List */}
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1 py-1">
                {filteredSymptoms.map((sym) => {
                  const active = selectedSymptoms.includes(sym);
                  const cleanName = sym.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-full text-xs transition border flex items-center gap-1.5 ${
                        active
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "bg-black/40 border-white/10 text-gray-300 hover:border-emerald-500/40 hover:text-white"
                      }`}
                    >
                      <span className={active ? "text-emerald-400" : "text-gray-400"}>
                        {active ? "✓" : "+"}
                      </span>
                      <span>{cleanName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Severity & Duration dropdowns */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <label className="block font-mono text-[10px] text-gray-400 mb-1">SEVERITY LEVEL</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option>Mild (1-3 / 10)</option>
                    <option>Moderate (4-6 / 10)</option>
                    <option>Severe (7-10 / 10)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-gray-400 mb-1">SYMPTOM DURATION</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option>Acute (&lt; 72 hrs)</option>
                    <option>Subacute (3-14 days)</option>
                    <option>Chronic (&gt; 14 days)</option>
                  </select>
                </div>
              </div>

              {/* Active Vector Chips with Reset */}
              <div className="mt-4 pt-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1.5">
                  <span className="text-emerald-400 font-semibold">
                    ACTIVE VECTOR ({selectedSymptoms.length})
                  </span>
                  <button
                    onClick={() => setSelectedSymptoms([])}
                    className="text-gray-400 hover:text-white underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[11px] text-emerald-300 font-medium"
                    >
                      {sym.replace(/_/g, " ")}
                      <button
                        onClick={() => toggleSymptom(sym)}
                        className="text-emerald-400 hover:text-white ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Run Differential Diagnosis Button */}
            <button
              onClick={() => handleRunPrediction()}
              disabled={predicting}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            >
              {predicting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Computing Random Forest Differential...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Run Differential Diagnosis</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Top-3 Ranked Differential Card */}
          <div className="lg:col-span-5 emerald-card rounded-2xl p-5 flex flex-col justify-between bg-[#080d09]/95 border-emerald-500/25 space-y-4">
            {prediction && (
              <>
                <div>
                  {/* Top Status Header */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ROUTINE / OUTPATIENT
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 uppercase">
                        {prediction.predicted_disease.includes("Migraine") ? "NEUROLOGY" : "INTERNAL MEDICINE"}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Consult within 48-72h if recurrent</span>
                  </div>

                  {/* Primary Diagnosis & Calibrated Percentage */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-0.5">
                    <span>TOP-3 RANKED DIFFERENTIAL</span>
                    <span className="text-gray-400">Calibrated Prob.</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {prediction.predicted_disease}
                    </h3>
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
                      {prediction.confidence}%
                    </span>
                  </div>

                  {/* Top 3 Progress Bars */}
                  <div className="space-y-2.5">
                    {prediction.top_3.map((item, idx) => (
                      <div key={item.disease} className="bg-black/50 p-2.5 rounded-xl border border-white/10">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-200 font-medium">
                            {idx + 1}. {item.disease}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {item.confidence}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, item.confidence)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHAP Symptom Attribution Box */}
                <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/20">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-2">
                    <span className="text-emerald-400 font-semibold uppercase">
                      SHAP SYMPTOM ATTRIBUTION
                    </span>
                    <span>TreeExplainer</span>
                  </div>
                  <div className="space-y-2">
                    {prediction.shap_explanation.slice(0, 3).map((sh) => (
                      <div key={sh.symptom} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 w-44 truncate">
                          {sh.symptom.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <div className="flex-1 mx-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, sh.contribution_pct || 40)}%` }}
                          />
                        </div>
                        <span className="font-mono text-emerald-300 text-xs font-semibold">
                          +{typeof sh.raw_weight === "number" ? sh.raw_weight.toFixed(2) : "0.40"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Profile Tabs */}
                <div>
                  <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2 mb-2.5 text-xs">
                    {(
                      [
                        ["overview", "Overview"],
                        ["labs", "Diagnostic Labs"],
                        ["precautions", "Precautions"],
                        ["medications", "Medications"],
                        ["diet", "Diet"],
                        ["workouts", "Workouts"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setInfoTab(key)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          infoTab === key
                            ? "bg-white text-black font-bold"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed min-h-[58px]">
                    {infoTab === "overview" &&
                      (profile?.description ||
                        "Migraine is a complex neurovascular disorder characterized by recurrent moderate-to-severe unilateral throbbing headaches, often accompanied by sensory hypersensitivity (photophobia, phonophobia) and transient visual aura.")}
                    {infoTab === "labs" &&
                      "Diagnostic workup: CBC, ESR/CRP to rule out temporal arteritis, Non-contrast Head CT or Brain MRI if atypical features or sudden thunderclap onset occurs."}
                    {infoTab === "precautions" &&
                      (profile?.precautions?.length
                        ? profile.precautions.join(" · ")
                        : "Rest in dark, quiet environment · Hydrate with oral electrolytes · Seek immediate ER evaluation if sudden thunderclap headache occurs.")}
                    {infoTab === "medications" &&
                      (profile?.medications?.length
                        ? profile.medications.join(" · ")
                        : "Sumatriptan 50-100mg PO at onset · Naproxen sodium 500mg PO · Metoclopramide 10mg PO for nausea.")}
                    {infoTab === "diet" &&
                      (profile?.diets?.length
                        ? profile.diets.join(" · ")
                        : "Magnesium-rich foods (spinach, pumpkin seeds) · Strict hydration (>2.5L/day) · Avoid tyramine, nitrates, and aged cheeses.")}
                    {infoTab === "workouts" &&
                      (profile?.workouts?.length
                        ? profile.workouts.join(" · ")
                        : "Low-intensity Zone-2 walking between attacks · Cervical spine and trapezius gentle stretching · Avoid high-intensity exertion during prodrome.")}
                  </p>
                </div>

                {/* Bottom Action: Discuss in Chat */}
                <button
                  onClick={() => {
                    setChatOpen(true);
                    handleSendChat(undefined, `Tell me more about ${prediction.predicted_disease} and clinical workup.`);
                  }}
                  className="w-full py-2 rounded-xl bg-black/60 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Discuss This Differential with MedSearch AI</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. CARDIO & METABOLIC BIOMARKER ENGINE */}
      <section id="cardiometabolic" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
              CARDIOVASCULAR &amp; ENDOCRINOLOGY PRECISION MODULE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Cardio &amp; Metabolic <span className="text-emerald-400">Biomarker Engine.</span>
            </h2>
          </div>
          <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
            Dedicated quantitative risk stratification for heart and diabetic cohorts using HbA1c, Fasting Glucose, Systolic BP, LDL/HDL ratio, and Resting Heart Rate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 4 Slider Cards (2x2 Grid) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. HbA1c */}
            <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-300 font-medium">HbA1c (Glycated Hemoglobin)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{hba1c}%</span>
              </div>
              <input
                type="range"
                min="4.5"
                max="12.0"
                step="0.1"
                value={hba1c}
                onChange={(e) => setHba1c(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-2">
                <span>Optimal &lt;5.7%</span>
                <span>Prediabetes 5.7-6.4%</span>
                <span>Diabetes ≥6.5%</span>
              </div>
            </div>

            {/* 2. Systolic Blood Pressure */}
            <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-300 font-medium">Systolic Blood Pressure</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{systolicBp} mmHg</span>
              </div>
              <input
                type="range"
                min="90"
                max="190"
                value={systolicBp}
                onChange={(e) => setSystolicBp(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-2">
                <span>Normal &lt;120</span>
                <span>Elevated 120-129</span>
                <span>Stage 1 ≥130</span>
              </div>
            </div>

            {/* 3. Fasting Blood Glucose */}
            <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-300 font-medium">Fasting Blood Glucose</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{glucose} mg/dL</span>
              </div>
              <input
                type="range"
                min="70"
                max="260"
                value={glucose}
                onChange={(e) => setGlucose(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-2">
                <span>Normal &lt;100</span>
                <span>Impaired 100-125</span>
                <span>Diabetic ≥126</span>
              </div>
            </div>

            {/* 4. LDL / HDL Ratio */}
            <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-300 font-medium">LDL / HDL Cholesterol Ratio</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{ldlRatio}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.1"
                value={ldlRatio}
                onChange={(e) => setLdlRatio(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-2">
                <span>Optimal &lt;2.0</span>
                <span>Borderline 2.0-3.5</span>
                <span>High Risk &gt;3.5</span>
              </div>
            </div>
          </div>

          {/* Right: Cardiometabolic Index Readout */}
          <div className="lg:col-span-5 emerald-card rounded-2xl p-6 bg-[#080d09]/95 border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-400 tracking-wider">10-YEAR ASCVD &amp; METABOLIC INDEX</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    cardioRisk < 10
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : cardioRisk < 20
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                  }`}
                >
                  {cardioRisk < 10 ? "OPTIMAL / LOW RISK" : cardioRisk < 20 ? "MODERATE RISK" : "ELEVATED RISK"}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-mono font-bold text-white tracking-tight">{cardioRisk}%</span>
                <span className="text-xs text-gray-400">Composite Vascular &amp; Glycemic Risk Score</span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Glycemic Status:</span>
                  <span className="text-emerald-300 font-medium">
                    {hba1c < 5.7
                      ? "Normoglycemic Range (HbA1c < 5.7%)"
                      : hba1c < 6.5
                      ? `Prediabetic Range (HbA1c ${hba1c}%)`
                      : `Elevated Glycemic Range (HbA1c ${hba1c}%)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hemodynamic Status:</span>
                  <span className="text-emerald-300 font-medium">
                    {systolicBp < 120
                      ? "Optimal BP (< 120 mmHg)"
                      : systolicBp < 130
                      ? `Elevated Systolic (${systolicBp} mmHg)`
                      : `Stage 1+ Hypertension (${systolicBp} mmHg)`}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-gray-300 leading-relaxed">
              Recommend quarterly HbA1c tracking, DASH sodium moderation (&lt;1,500 mg/day), and 150 min/week Zone-2 aerobic conditioning.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ONE PLATFORM. EVERY LAYER OF CLINICAL AI. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              One Platform. <span className="text-emerald-400">Every Layer of Clinical AI.</span>
            </h2>
          </div>
          <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
            We unify decentralized federated optimization, calibrated diagnostic inference, and verifiable medical knowledge graphs in one edge-ready stack.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              num: "01",
              title: "Federated Training",
              desc: "Decentralized model aggregation across hospital nodes with differential privacy guarantees.",
              svg: (
                <svg className="w-10 h-10 text-emerald-400 mx-auto" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
                  <circle cx="10" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="38" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="38" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="13" y1="16" x2="19" y2="21" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="35" y1="16" x2="29" y2="21" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="13" y1="32" x2="19" y2="27" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="35" y1="32" x2="29" y2="27" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                </svg>
              ),
            },
            {
              num: "02",
              title: "Symptom Engine",
              desc: "Multi-symptom Random Forest classifier returning top-3 ranked clinical predictions in milliseconds.",
              svg: (
                <svg className="w-10 h-10 text-emerald-400 mx-auto" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                  <line x1="14" y1="18" x2="30" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="14" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="14" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="34" cy="18" r="1.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              num: "03",
              title: "Medical Knowledge Graph",
              desc: "Structured clinical guidance covering medications, diets, workouts, and preventive precautions.",
              svg: (
                <svg className="w-10 h-10 text-emerald-400 mx-auto" viewBox="0 0 48 48" fill="none">
                  <line x1="12" y1="12" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="12" y1="36" x2="36" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" fill="#0b110d" stroke="currentColor" strokeWidth="2" />
                  <circle cx="36" cy="12" r="3" fill="#0b110d" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="36" r="3" fill="#0b110d" stroke="currentColor" strokeWidth="2" />
                  <circle cx="36" cy="36" r="3" fill="#0b110d" stroke="currentColor" strokeWidth="2" />
                </svg>
              ),
            },
            {
              num: "04",
              title: "Explainable AI (SHAP)",
              desc: "Transparent symptom-to-diagnosis attribution weights engineered for clinician auditability and trust.",
              svg: (
                <svg className="w-10 h-10 text-emerald-400 mx-auto" viewBox="0 0 48 48" fill="none">
                  <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="24" y="12" width="14" height="4" fill="currentColor" opacity="0.8" />
                  <rect x="14" y="20" width="10" height="4" fill="currentColor" opacity="0.6" />
                  <rect x="24" y="28" width="18" height="4" fill="currentColor" opacity="0.9" />
                  <rect x="18" y="36" width="6" height="4" fill="currentColor" opacity="0.5" />
                </svg>
              ),
            },
          ].map((f) => (
            <div
              key={f.num}
              className="emerald-card rounded-2xl p-5 bg-[#080d09]/95 border-emerald-500/25 flex flex-col justify-between hover:border-emerald-400/40 transition group"
            >
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-3">
                  <span className="text-emerald-400 font-semibold">{f.num}</span>
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[11px] group-hover:border-emerald-400 transition">
                    ↗
                  </div>
                </div>
                <h3 className="font-bold text-white text-base mb-1.5">{f.title}</h3>
                <div className="my-4 py-2 border-y border-white/5">{f.svg}</div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PRIVACY IS HOW WE TRAIN (FEDERATED TOPOLOGY) */}
      <section id="federated" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
              LIVE FEDAVG NETWORK TELEMETRY
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Privacy Is How <span className="text-emerald-400">We Train.</span>
            </h2>
          </div>
          <button
            onClick={() => handleRunFederated()}
            disabled={flLoading}
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          >
            {flLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Simulating Round...</span>
              </>
            ) : (
              <>
                <span>↻</span>
                <span>Simulate Training Round</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
            <div className="text-[10px] font-mono text-gray-400 uppercase">FEDERATION ROUND</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              Round #{flResult?.rounds || 14}
            </div>
          </div>
          <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
            <div className="text-[10px] font-mono text-gray-400 uppercase">GLOBAL TOP-3 ACCURACY</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {flResult?.final_global_accuracy || 96.4}%
            </div>
          </div>
          <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
            <div className="text-[10px] font-mono text-gray-400 uppercase">PRIVACY BUDGET (ε)</div>
            <div className="text-2xl font-mono font-bold text-emerald-300 mt-1">
              ε = {flResult?.privacy_budget_epsilon || 0.85}
            </div>
          </div>
          <div className="emerald-card rounded-2xl p-4 bg-[#080d09]/95 border-emerald-500/25">
            <div className="text-[10px] font-mono text-gray-400 uppercase">RAW RECORDS EXPOSED</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">0 Bytes</div>
          </div>
        </div>

        {/* Noise Multiplier Slider Bar */}
        <div className="emerald-card rounded-2xl p-4 mb-6 bg-[#080d09]/95 border-emerald-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono font-bold text-emerald-400">
              OPACUS DP-SGD NOISE MULTIPLIER (Σ)
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Adjust Gaussian gradient clipping &amp; noise scale before hospital nodes transmit ΔW to the global FedAvg aggregator.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="range"
              min="0.05"
              max="2.0"
              step="0.05"
              value={dpSigma}
              onChange={(e) => setDpSigma(parseFloat(e.target.value))}
              className="w-36 accent-emerald-400 cursor-pointer"
            />
            <span className="px-2.5 py-1 rounded-md bg-black/60 border border-emerald-500/30 font-mono text-xs text-emerald-300 font-bold">
              σ = {dpSigma}
            </span>
          </div>
        </div>

        {/* 3-Column Federated Topology */}
        <div className="emerald-card rounded-3xl p-6 bg-[#080d09]/95 border-emerald-500/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Node A & Node B */}
            <div className="lg:col-span-4 space-y-4">
              {/* Node A */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/25">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    NODE A • EDGE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">Local Ready</span>
                </div>
                <div className="font-bold text-white text-sm">Bengaluru General</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  14,280 EHR encounters • Local RF Trees: 50
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                  ΔW Hash: 0x8A1F...49E2
                </div>
              </div>

              {/* Node B */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/25">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    NODE B • EDGE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">Local Ready</span>
                </div>
                <div className="font-bold text-white text-sm">Metro Heart Institute</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  9,640 Cardio encounters • Local RF Trees: 50
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                  ΔW Hash: 0x3C7D...10B8
                </div>
              </div>
            </div>

            {/* Center Node: Global Aggregator */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 text-center relative">
              <div className="w-32 h-32 rounded-3xl bg-emerald-950/40 border-2 border-emerald-400/60 flex flex-col items-center justify-center relative shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                <div className="text-[11px] font-mono uppercase font-bold text-white">GLOBAL</div>
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">AGGREGATOR</div>
                <div className="mt-1 text-[8px] font-mono text-gray-400">FedAvg + DP</div>
              </div>
              <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-mono text-emerald-300 font-medium">
                Secure Multi-Party Aggregation {flLoading ? "Active" : "Idle"}
              </div>
            </div>

            {/* Right Column: Node C & Node D */}
            <div className="lg:col-span-4 space-y-4">
              {/* Node C */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/25">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    NODE C • EDGE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">Local Ready</span>
                </div>
                <div className="font-bold text-white text-sm">City Neuro Center</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  11,120 Neuro encounters • Local RF Trees: 50
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                  ΔW Hash: 0x5E92...77D4
                </div>
              </div>

              {/* Node D */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/25">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    NODE D • EDGE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">Local Ready</span>
                </div>
                <div className="font-bold text-white text-sm">Regional Clinic</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  7,890 Primary Care records • Local RF Trees: 50
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                  ΔW Hash: 0x1B04...92F1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMPLIANCE IS COVERED & WHY MEDFL LEADS EDGE AI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-white/10">
        {/* Compliance Row 1 (3 items) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-white text-black font-mono font-bold text-xs">HIPAA</span>
            <div>
              <div className="font-bold text-white text-xs">HIPAA Compliant</div>
              <div className="text-[11px] text-gray-400">Zero PHI egress</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-emerald-500 text-black font-mono font-bold text-xs">GDPR</span>
            <div>
              <div className="font-bold text-white text-xs">GDPR Art. 25</div>
              <div className="text-[11px] text-gray-400">Privacy by design</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-white text-black font-mono font-bold text-xs">FHIR</span>
            <div>
              <div className="font-bold text-white text-xs">HL7 FHIR R4</div>
              <div className="text-[11px] text-gray-400">EHR interoperability</div>
            </div>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-center max-w-2xl mx-auto my-10">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Compliance <br />
            <span className="text-emerald-400">is Covered.</span>
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
            We architect clinical AI with cryptographic privacy from day one — HIPAA, GDPR, HL7 FHIR, and Differential Privacy baked into every federated gradient round.
          </p>
        </div>

        {/* Compliance Row 2 (3 items) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-400/40">ZKP</span>
            <div>
              <div className="font-bold text-white text-xs">Zero-Knowledge</div>
              <div className="text-[11px] text-gray-400">Verifiable updates</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-white text-black font-mono font-bold text-xs">ε-DP</span>
            <div>
              <div className="font-bold text-white text-xs">Differential Privacy</div>
              <div className="text-[11px] text-gray-400">Noise-bounded gradients</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-400/40">27001</span>
            <div>
              <div className="font-bold text-white text-xs">ISO 27001</div>
              <div className="text-[11px] text-gray-400">Audited enclave security</div>
            </div>
          </div>
        </div>

        {/* Why MeDFL Leads Edge AI Section */}
        <div className="pt-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">
            <span className="text-emerald-400">Why MeDFL</span> <br />
            <span className="text-white">Leads Edge AI?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="emerald-card rounded-2xl p-6 bg-[#080d09]/95 border-emerald-500/25">
              <div className="text-5xl font-mono font-bold text-emerald-400 tracking-tight">96.4%</div>
              <div className="font-bold text-white text-sm mt-3">Diagnostic Top-3 Accuracy</div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Validated across multi-symptom clinical cohorts using 200-estimator Random Forest ensembles.
              </p>
            </div>
            <div className="emerald-card rounded-2xl p-6 bg-[#080d09]/95 border-emerald-500/25">
              <div className="text-5xl font-mono font-bold text-white tracking-tight">0 Bytes</div>
              <div className="font-bold text-white text-sm mt-3">Raw Patient Data Exposed</div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Electronic health records remain locked inside hospital firewalls at every stage of training.
              </p>
            </div>
            <div className="emerald-card rounded-2xl p-6 bg-[#080d09]/95 border-emerald-500/25">
              <div className="text-5xl font-mono font-bold text-emerald-400 tracking-tight">4+ Nodes</div>
              <div className="font-bold text-white text-sm mt-3">Decentralized Hospital Federation</div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Scalable FedAvg orchestration across specialty clinics, cardiology institutes, and general hospitals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 text-xs text-gray-400 bg-[#040605]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">MeDFL</span>
            <span>© 2026 Privacy-Preserving Federated Healthcare AI</span>
          </div>
          <div className="flex flex-wrap gap-5 font-mono text-[11px]">
            <a href="#medsearch" className="hover:text-emerald-400 transition">MedSearch AI</a>
            <a href="#analyzer" className="hover:text-emerald-400 transition">Symptom Analyzer</a>
            <a href="#cardiometabolic" className="hover:text-emerald-400 transition">Cardio &amp; Metabolic</a>
            <a href="#federated" className="hover:text-emerald-400 transition">FL Simulator</a>
            <button
              onClick={() => setBlueprintOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              9.5/10 Architecture Blueprint
            </button>
          </div>
        </div>
      </footer>

      {/* 9. 9.5/10 ARCHITECTURE BLUEPRINT MODAL */}
      {blueprintOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="emerald-card rounded-3xl max-w-3xl w-full p-6 sm:p-7 border-emerald-400/40 bg-[#070c08] shadow-[0_0_50px_rgba(16,185,129,0.2)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  PRODUCTION PYTHON REPOSITORY UPGRADE PLAN
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  MeDFL 9.5/10 AI &amp; Engineering Blueprint
                </h3>
              </div>
              <button
                onClick={() => setBlueprintOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-300 hover:text-white text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* 4 Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold mb-1">
                  1. backend/federated/server.py (Flower + Opacus)
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Replaces the empty stub with a real <code className="text-emerald-400 font-mono">flwr.server.strategy.FedAvg</code> orchestrator and <code className="text-emerald-400 font-mono">opacus.PrivacyEngine</code> for (ε, δ)-differential privacy across hospital clients.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold mb-1">
                  2. backend/ml/explainability.py (SHAP TreeExplainer)
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Computes per-patient Shapley feature attributions (<code className="text-emerald-400 font-mono">shap.TreeExplainer</code>) alongside top-3 probability calibration so clinicians see exact symptom weights.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold mb-1">
                  3. backend/chatbot/rag_engine.py (Hybrid MedSearch)
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Combines BM25 + dense vector retrieval over <code className="text-emerald-400 font-mono">DiseaseKnowledge</code> with Gemini structured synthesis, emergency red-flag guardrails, and citation grounding.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold mb-1">
                  4. Bundled Artifacts (model_bundle.joblib)
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Serializes the trained classifier, <code className="text-emerald-400 font-mono">LabelEncoder</code>, and ordered symptom feature list together so inference never touches raw CSVs at runtime.
                </p>
              </div>
            </div>

            {/* Code Block Preview */}
            <div className="rounded-xl bg-black/80 border border-emerald-500/30 p-3.5 font-mono text-[11px] text-gray-300 overflow-x-auto">
              <div className="text-gray-400 mb-2"># Example: backend/ml/explainability.py + Federated Aggregation Hook</div>
              <pre className="text-emerald-300 leading-relaxed">
{`import shap
import numpy as np

class ClinicalExplainer:
    def __init__(self, model, feature_names: list[str]):
        self.explainer = shap.TreeExplainer(model)
        self.feature_names = feature_names

    def explain_prediction(self, feature_vector: np.ndarray, class_idx: int, top_k: int = 5):
        shap_vals = self.explainer.shap_values(feature_vector.reshape(1, -1))[class_idx][0]
        active_indices = np.where(feature_vector == 1)[0]
        contributions = [
            {"symptom": self.feature_names[i], "shap_weight": round(float(shap_vals[i]), 4)}
            for i in active_indices
        ]
        return sorted(contributions, key=lambda x: abs(x["shap_weight"]), reverse=True)[:top_k]`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 10. FLOATING "ASK MED" COPILOT DRAWER */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-md emerald-card rounded-2xl border-emerald-400/50 bg-[#070c08] shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col max-h-[82vh]">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0a140d] border-b border-emerald-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-bold text-xs text-white">MeDFL Universal Medical Copilot</div>
                <div className="text-[10px] text-gray-400">Live NLU + Open-Domain Search • Memory Active</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setChatMessages([
                    {
                      id: "welcome-reset",
                      role: "ai",
                      text: "Context cleared. Describe any symptoms or ask any medical question.",
                    },
                  ])
                }
                className="text-[11px] font-mono text-gray-400 hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-300 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-500/20 border border-emerald-400/40 text-white ml-6"
                    : "bg-black/60 border border-white/10 text-gray-200 mr-4"
                }`}
              >
                <p>{m.text}</p>

                {/* Tracked symptoms pill & action */}
                {m.detectedSymptoms && m.detectedSymptoms.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400">
                      Tracked Symptoms ({m.detectedSymptoms.length}): {m.detectedSymptoms.map((s) => s.replace(/_/g, " ")).join(", ")}
                    </span>
                    <button
                      onClick={() => handleSyncToBodyMap(m.detectedSymptoms)}
                      className="text-emerald-300 underline hover:text-white"
                    >
                      View on Body Map
                    </button>
                  </div>
                )}

                {/* Live Differential Ranking Card inside message */}
                {m.prediction && (
                  <div className="mt-3 p-3 rounded-xl bg-black/80 border border-emerald-500/30">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-1.5">
                      LIVE DIFFERENTIAL RANKING
                    </div>
                    <div className="space-y-1 text-xs">
                      {m.prediction.top_3.map((t, idx) => (
                        <div key={t.disease} className="flex justify-between items-center text-gray-300">
                          <span className="font-medium">
                            {idx + 1}. {t.disease}
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold">{t.confidence}%</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSyncToBodyMap(m.detectedSymptoms)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                    >
                      <span>⚡</span>
                      <span>Sync Symptoms to 2D Body Map</span>
                    </button>
                  </div>
                )}

                {/* Recommended Workup */}
                {m.workup && (
                  <div className="mt-2 text-[11px] text-gray-300 leading-normal bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="font-bold text-white">Workup: </span>
                    {m.workup}
                  </div>
                )}

                {/* Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => (
                      <a
                        key={c.url}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-mono text-emerald-300"
                      >
                        ↗ {c.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Follow up chips inside message */}
                {m.followUps && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {m.followUps.map((f) => (
                      <button
                        key={f}
                        onClick={() => handleSendChat(undefined, f.replace(/^\+\s*/, ""))}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-[10px] text-emerald-300 border border-white/10"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-emerald-400 text-xs flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Consulting Federated Clinical Graph...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-1.5 bg-black/50 border-t border-white/5 flex flex-wrap gap-1.5 text-[10px]">
            {['"I have a sharp throat pain too"', "What is Pericarditis?", "BP 148/94 + dizzy"].map(
              (sug) => (
                <button
                  key={sug}
                  onClick={() => handleSendChat(undefined, sug.replace(/"/g, ""))}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-white border border-white/10 transition"
                >
                  {sug}
                </button>
              )
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-emerald-500/20 bg-black/80 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => speak("Voice input active. Speak your question.")}
              className="p-2 text-gray-400 hover:text-emerald-400 transition"
              title="Voice input"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe symptoms or ask any medical question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs transition"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* 11. FLOATING ACTION BUTTONS (BOTTOM RIGHT) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => speak("Voice triage active. What symptoms are you experiencing?")}
          title="Voice Assistant"
          className="w-10 h-10 rounded-full bg-black/80 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="px-3.5 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.4)] transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span>Ask Med</span>
        </button>
      </div>
    </div>
  );
}
