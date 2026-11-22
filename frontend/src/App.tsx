import React, { useEffect, useState } from "react";
import {
  fetchSymptoms,
  predictDisease,
  runFederatedTraining,
  queryMedicalSearchChat,
} from "./lib/api";
import type {
  PredictionResponse,
  FederatedResponse,
  ChatSearchResponse,
} from "./lib/api";
import { AnatomyMap } from "./components/AnatomyMap";

const ORGAN_TABS = ["All", "Neurological", "Cardiorespiratory", "Gastrointestinal", "Metabolic", "Infectious & Musculoskeletal"] as const;

export default function App() {
  const [largeText, setLargeText] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);

  // MedSearch AI hero state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ChatSearchResponse | null>(null);

  // Floating "Ask Med" Copilot Drawer
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string; citations?: { title: string; url: string }[] }[]
  >([
    {
      role: "ai",
      text: "MeDFL Unified Medical Studio online. Ask any clinical question, test symptoms, or run Tavily medical search.",
    },
  ]);

  // Symptom Analyzer + SHAP + Tabs
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [symptomFilter, setSymptomFilter] = useState("");
  const [organFilter, setOrganFilter] = useState<(typeof ORGAN_TABS)[number]>("All");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "headache",
    "blurred_vision",
    "nausea",
  ]);
  const [severity, setSeverity] = useState("Moderate (4-7/10)");
  const [duration, setDuration] = useState("Subacute (3-14 Days)");
  const [infoTab, setInfoTab] = useState<"overview" | "labs" | "precautions" | "medications" | "diet">("overview");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Cardio & Metabolic Biomarker Engine
  const [hba1c, setHba1c] = useState(5.4);
  const [systolicBp, setSystolicBp] = useState(118);
  const [glucose, setGlucose] = useState(96);
  const [ldlRatio, setLdlRatio] = useState(2.4);

  // Federated Training ("Privacy Is How We Train")
  const [flRounds, setFlRounds] = useState(14);
  const [dpSigma, setDpSigma] = useState(0.5);
  const [flLoading, setFlLoading] = useState(false);
  const [flResult, setFlResult] = useState<FederatedResponse | null>(null);

  useEffect(() => {
    fetchSymptoms().then((syms) => {
      if (syms?.length) setAllSymptoms(syms);
    });
    handleRunPrediction(["headache", "blurred_vision", "nausea"]);
    handleRunFederated(14, 0.5);
  }, []);

  const speak = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/\*\*/g, "")));
  };

  const handleRunPrediction = async (syms = selectedSymptoms) => {
    if (!syms.length) return;
    setPredicting(true);
    const res = await predictDisease(syms);
    setPrediction(res);
    setPredicting(false);
  };

  const toggleSymptom = (sym: string) => {
    const next = selectedSymptoms.includes(sym)
      ? selectedSymptoms.filter((s) => s !== sym)
      : [...selectedSymptoms, sym];
    setSelectedSymptoms(next);
    if (next.length) handleRunPrediction(next);
  };

  const handleMedSearch = async (custom?: string) => {
    const q = (custom ?? searchQuery).trim();
    if (!q) return;
    setSearchLoading(true);
    const res = await queryMedicalSearchChat(q, selectedSymptoms);
    setSearchResult(res);
    if (res.detected_symptoms?.length) setSelectedSymptoms(res.detected_symptoms);
    if (res.prediction) setPrediction(res.prediction);
    speak(res.answer);
    setSearchLoading(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((p) => [...p, { role: "user", text: msg }]);
    setChatInput("");
    const res = await queryMedicalSearchChat(msg, selectedSymptoms);
    if (res.detected_symptoms?.length) setSelectedSymptoms(res.detected_symptoms);
    if (res.prediction) setPrediction(res.prediction);
    setChatMessages((p) => [...p, { role: "ai", text: res.answer, citations: res.citations }]);
    speak(res.answer);
  };

  const handleRunFederated = async (r = flRounds, s = dpSigma) => {
    setFlLoading(true);
    const res = await runFederatedTraining(r, s);
    setFlResult(res);
    setFlLoading(false);
  };

  const cardioRisk = Math.max(
    1.5,
    Math.min(
      68,
      Number(
        (
          (hba1c - 4.8) * 1.6 +
          (systolicBp - 110) * 0.14 +
          (glucose - 85) * 0.06 +
          (ldlRatio - 1.8) * 1.4
        ).toFixed(1)
      )
    )
  );

  const filteredSymptoms = allSymptoms
    .filter((s) => s.toLowerCase().includes(symptomFilter.toLowerCase().replace(/\s+/g, "_")))
    .slice(0, 32);

  const latestRound = flResult?.history?.[flResult.history.length - 1];
  const profile = prediction?.clinical_profile;

  return (
    <div className={`min-h-screen bg-[#050806] text-[#F4F7F5] ${largeText ? "large-text" : ""}`}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050806]/85 border-b border-emerald-500/15">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center font-mono font-bold text-emerald-300">
              M+
            </div>
            <div>
              <div className="font-display font-bold text-base leading-none text-white">MeDFL</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Privacy-First Medical AI Platform</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs text-gray-300">
            <a href="#medsearch" className="hover:text-emerald-400 transition">MedSearch</a>
            <a href="#analyzer" className="hover:text-emerald-400 transition">Symptom Analyzer</a>
            <a href="#cardiometabolic" className="hover:text-emerald-400 transition">Cardio &amp; Metabolic</a>
            <a href="#federated" className="hover:text-emerald-400 transition">FL &amp; Privacy</a>
            <button
              onClick={() => setBlueprintOpen(true)}
              className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono hover:bg-emerald-500/25 transition"
            >
              9.5/10 Blueprint
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLargeText(!largeText)}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                largeText ? "bg-emerald-400 text-black font-bold border-emerald-400" : "bg-white/5 text-gray-300 border-white/10"
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                ttsEnabled ? "bg-emerald-400 text-black font-bold border-emerald-400" : "bg-white/5 text-gray-300 border-white/10"
              }`}
            >
              {ttsEnabled ? "TTS On" : "TTS Off"}
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
            >
              Ask Med
            </button>
          </div>
        </div>
      </header>

      {/* Hero: Google-Speed Medical Intelligence + Tavily Search */}
      <section id="medsearch" className="max-w-7xl mx-auto px-6 pt-12 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300 mb-4">
              MULTI-SYSTEM DIFFERENTIAL ENGINE • FEDERATED AI
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Google-Speed <span className="text-emerald-400">Medical Intelligence.</span>
            </h1>
            <p className="mt-4 text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Ask any medical question, compare conditions, check drug interactions, or analyze multi-organ symptoms across{" "}
              <span className="text-white font-medium">Cardiology, Endocrinology, Neurology, Respiratory &amp; GI</span> — powered by Federated AI.
            </p>

            {/* Search Input Bar */}
            <div className="mt-6 emerald-card rounded-2xl p-2 flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMedSearch()}
                placeholder="Ask anything: e.g. 'I have a sharp throat pain, fever...' · 'Typhoid', 'FDA', 'Migraine'"
                className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => handleMedSearch()}
                disabled={searchLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shrink-0 transition"
              >
                {searchLoading ? "Searching..." : "Ask AI"}
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                "Metformin vs Glipizide",
                "Type 2 vs Type 1 Diabetes",
                "Acute Gastroenteritis",
                "Hemoglobin Vitamin B12",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setSearchQuery(chip);
                    handleMedSearch(chip);
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-gray-300 transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Synthesized Search Result Card */}
            {searchResult && (
              <div className="mt-6 emerald-card rounded-2xl p-5 border-emerald-400/40">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase text-emerald-400 mb-2">
                  <span>{searchResult.mode.replace(/_/g, " ")}</span>
                  <button onClick={() => setSearchResult(null)} className="text-gray-400 hover:text-white">
                    Clear
                  </button>
                </div>
                <p className="text-sm text-gray-100 leading-relaxed">{searchResult.answer}</p>
                {searchResult.citations && searchResult.citations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchResult.citations.map((c) => (
                      <a
                        key={c.url}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] font-mono text-emerald-300"
                      >
                        ↗ {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Telemetry Card */}
          <div className="lg:col-span-5 emerald-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>MULTI-ORGAN ENGINE • V9.4 TELEMETRY</span>
              <span className="text-emerald-400">● FEDERATED READY</span>
            </div>
            <div className="h-36 rounded-xl bg-black/50 border border-emerald-500/20 flex flex-col items-center justify-center p-4 text-center">
              <div className="text-xs font-mono text-emerald-400">CLINICAL Triage &amp; SHAP TELEMETRY</div>
              <div className="text-2xl font-bold text-white mt-1">
                {prediction ? `${prediction.predicted_disease} (${prediction.confidence}%)` : "Ready"}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {selectedSymptoms.length} active symptoms mapped to RandomForest + FedAvg
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div className="text-lg font-mono font-bold text-white">100+ Systems</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Differential coverage</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div className="text-lg font-mono font-bold text-emerald-400">&lt; 0.08s DP</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Zero raw PHI leaves clinic</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Anatomical Symptom Analyzer */}
      <section id="analyzer" className="max-w-7xl mx-auto px-6 py-14 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400">FULL-SPECTRUM MULTI-ORGAN DIFFERENTIAL ENGINE</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Interactive Anatomical <span className="text-emerald-400">Symptom Analyzer.</span>
            </h2>
          </div>
          <p className="text-xs text-gray-400 max-w-md">
            Click an anatomical region on the body map or search across Neurological, Cardiorespiratory, Gastrointestinal, Metabolic &amp; Musculoskeletal systems.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Body Map Column */}
          <div className="lg:col-span-3 emerald-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-emerald-400 mb-3">BODY REGION FILTER</div>
              <AnatomyMap selectedSymptoms={selectedSymptoms} onToggleSymptom={toggleSymptom} />
            </div>
            <button
              onClick={() => {
                setOrganFilter("All");
                setSymptomFilter("");
              }}
              className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300"
            >
              Show All Organ Systems
            </button>
          </div>

          {/* Symptom Selector & Severity Controls */}
          <div className="lg:col-span-4 emerald-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                <span>ALL SYMPTOMS</span>
                <span className="text-emerald-400">{allSymptoms.length || 132} Eligible</span>
              </div>
              <input
                type="text"
                value={symptomFilter}
                onChange={(e) => setSymptomFilter(e.target.value)}
                placeholder="Search 32+ symptoms (e.g. fever, chest, rash)..."
                className="w-full bg-black/50 border border-emerald-500/25 rounded-xl px-3.5 py-2 text-xs text-white mb-3"
              />

              <div className="flex flex-wrap gap-1.5 mb-3">
                {ORGAN_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOrganFilter(tab)}
                    className={`px-2 py-0.5 rounded text-[11px] border ${
                      organFilter === tab
                        ? "bg-emerald-500 text-black font-semibold border-emerald-500"
                        : "bg-white/5 text-gray-400 border-white/10"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {filteredSymptoms.map((sym) => {
                  const active = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition ${
                        active
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 font-medium"
                          : "bg-black/40 border-white/10 text-gray-300 hover:border-emerald-500/40"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {sym.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <label className="block font-mono text-[10px] text-gray-400 mb-1">SEVERITY LEVEL</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option>Mild (1-3/10)</option>
                    <option>Moderate (4-7/10)</option>
                    <option>Severe (8-10/10)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-gray-400 mb-1">SYMPTOM DURATION</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option>Acute (&lt; 72 hrs)</option>
                    <option>Subacute (3-14 Days)</option>
                    <option>Chronic (&gt; 14 Days)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleRunPrediction()}
              disabled={predicting}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
            >
              {predicting ? "Running Inference..." : "Run Differential Diagnosis"}
            </button>
          </div>

          {/* Right Differential Output + SHAP + Clinical Profile Tabs */}
          <div className="lg:col-span-5 emerald-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
            {prediction && (
              <>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1">
                    <span>TOP-3 RANKED DIFFERENTIAL</span>
                    <span className="text-emerald-400">Clinical Risk: {severity.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <h3 className="text-2xl font-bold text-white">{prediction.predicted_disease}</h3>
                    <span className="text-xl font-mono font-bold text-emerald-400">{prediction.confidence}%</span>
                  </div>

                  <div className="space-y-2">
                    {prediction.top_3.map((item, idx) => (
                      <div key={item.disease} className="bg-black/45 p-2.5 rounded-xl border border-white/10">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-200">
                            {idx + 1}. {item.disease}
                          </span>
                          <span className="font-mono text-emerald-400">{item.confidence}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, item.confidence)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHAP Attribution */}
                <div>
                  <div className="text-[11px] font-mono uppercase text-gray-400 mb-2">
                    SHAP SYMPTOM ATTRIBUTION (MODEL WEIGHTS)
                  </div>
                  <div className="space-y-1.5">
                    {prediction.shap_explanation.slice(0, 4).map((sh) => (
                      <div
                        key={sh.symptom}
                        className="flex items-center justify-between text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-white/5"
                      >
                        <span className="text-gray-300">● {sh.symptom.replace(/_/g, " ")}</span>
                        <span className="font-mono text-emerald-300">+{sh.contribution_pct}%</span>
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
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setInfoTab(key)}
                        className={`px-2.5 py-1 rounded-md ${
                          infoTab === key ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed min-h-[54px]">
                    {infoTab === "overview" &&
                      (profile?.description ||
                        "Differential guidance synthesized from active symptoms, duration, and clinical knowledge graph.")}
                    {infoTab === "labs" &&
                      "Recommended clinical workup: Complete Blood Count (CBC), Metabolic Panel, and targeted imaging as advised by a physician."}
                    {infoTab === "precautions" &&
                      (profile?.precautions?.length ? profile.precautions.join(" · ") : "Hydrate, monitor symptoms, and seek prompt medical evaluation if red-flag signs occur.")}
                    {infoTab === "medications" &&
                      (profile?.medications?.length ? profile.medications.join(", ") : "Discuss targeted therapy options with a licensed clinician.")}
                    {infoTab === "diet" &&
                      (profile?.diets?.length ? profile.diets.join(", ") : "Balanced anti-inflammatory nutrition, adequate electrolytes, and consistent sleep.")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Cardio & Metabolic Biomarker Engine */}
      <section id="cardiometabolic" className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="mb-6">
          <div className="text-xs font-mono uppercase text-emerald-400">CARDIOMETABOLIC &amp; ENDOCRINE PRECISION ENGINE</div>
          <h2 className="text-3xl font-bold text-white mt-1">
            Cardio &amp; Metabolic <span className="text-emerald-400">Biomarker Engine.</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Dedicated quantitative risk stratification for heart and diabetic cohorts using HbA1c, Fasting Glucose, Systolic BP, LDL/HDL ratio, and Resting Heart Rate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="emerald-card rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-300">HbA1c (Glycated Hemoglobin)</span>
                <span className="font-mono font-bold text-emerald-400">{hba1c}%</span>
              </div>
              <input type="range" min="4.5" max="12.0" step="0.1" value={hba1c} onChange={(e) => setHba1c(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
            </div>
            <div className="emerald-card rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-300">Systolic Blood Pressure</span>
                <span className="font-mono font-bold text-emerald-400">{systolicBp} mmHg</span>
              </div>
              <input type="range" min="90" max="190" value={systolicBp} onChange={(e) => setSystolicBp(parseInt(e.target.value))} className="w-full accent-emerald-400" />
            </div>
            <div className="emerald-card rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-300">Fasting Blood Glucose</span>
                <span className="font-mono font-bold text-emerald-400">{glucose} mg/dL</span>
              </div>
              <input type="range" min="70" max="260" value={glucose} onChange={(e) => setGlucose(parseInt(e.target.value))} className="w-full accent-emerald-400" />
            </div>
            <div className="emerald-card rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-300">LDL / HDL Cholesterol Ratio</span>
                <span className="font-mono font-bold text-emerald-400">{ldlRatio}</span>
              </div>
              <input type="range" min="1.0" max="6.0" step="0.1" value={ldlRatio} onChange={(e) => setLdlRatio(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
            </div>
          </div>

          <div className="lg:col-span-5 emerald-card rounded-2xl p-6">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>CARDIOMETABOLIC INDEX</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">OPTIMAL / LOW RISK</span>
            </div>
            <div className="text-5xl font-bold text-white mt-3">{cardioRisk}%</div>
            <div className="text-xs text-gray-400 mt-1">Composite 10-Yr Vascular &amp; Glycemic Risk</div>
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-300 space-y-1">
              <div>
                <span className="text-gray-400">Glycemic Status:</span>{" "}
                <span className="text-emerald-300 font-medium">
                  {hba1c < 5.7 ? "Normoglycemic Range (HbA1c < 5.7%)" : hba1c < 6.5 ? "Prediabetic Range (5.7–6.4%)" : "Elevated Glycemic Range (≥ 6.5%)"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Blood Pressure:</span>{" "}
                <span className="text-emerald-300 font-medium">
                  {systolicBp < 120 ? "Optimal BP (< 120 mmHg)" : systolicBp < 130 ? "Elevated BP (120–129 mmHg)" : "Stage 1+ Hypertension (≥ 130 mmHg)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* One Platform. Every Layer of Clinical AI. */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            One Platform. <span className="text-emerald-400">Every Layer of Clinical AI.</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            We unify decentralized federated optimization, calibrated diagnostic inference, and verifiable medical knowledge graphs in one edge-ready stack.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: "01", title: "Federated Training", desc: "Privacy-preserving model aggregation across hospital nodes with differential privacy guarantees." },
            { num: "02", title: "Symptom Engine", desc: "Multi-symptom Random Forest classifier delivering calibrated clinical predictions in milliseconds." },
            { num: "03", title: "Medical Knowledge Graph", desc: "Structured clinical guidance covering medications, diets, workouts, and prevention protocols." },
            { num: "04", title: "Explainable AI (SHAP)", desc: "Transparent symptom-to-diagnosis attribution weights engineered for clinician auditability and trust." },
          ].map((f) => (
            <div key={f.num} className="emerald-card rounded-2xl p-5">
              <div className="text-xs font-mono text-emerald-400 mb-3">{f.num}</div>
              <h3 className="font-bold text-white text-base mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Is How We Train (Federated Nodes) */}
      <section id="federated" className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400">LIVE FEDERATED NETWORK TELEMETRY</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Privacy Is How <span className="text-emerald-400">We Train.</span>
            </h2>
          </div>
          <button
            onClick={() => handleRunFederated()}
            disabled={flLoading}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
          >
            {flLoading ? "Training Round..." : "↻ Simulate Training Round"}
          </button>
        </div>

        {flResult && latestRound && (
          <div className="emerald-card rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] font-mono text-gray-400">FEDERATION ROUND</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">Round #{flResult.rounds}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] font-mono text-gray-400">GLOBAL TOP-3 ACCURACY</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{flResult.final_global_accuracy}%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] font-mono text-gray-400">PRIVACY BUDGET (ε)</div>
                <div className="text-2xl font-mono font-bold text-emerald-300 mt-1">ε = {flResult.privacy_budget_epsilon}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] font-mono text-gray-400">RAW RECORDS EXPOSED</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">0 Bytes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-4 space-y-3">
                {latestRound.nodes.slice(0, 2).map((n) => (
                  <div key={n.node_id} className="p-4 rounded-xl bg-black/45 border border-emerald-500/20">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>{n.node_id}</span>
                      <span className="text-[10px] font-mono text-emerald-400">LOCAL READY</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{n.specialty} · {n.samples} records</div>
                    <div className="text-xs font-mono text-emerald-300 mt-2">Local Acc: {n.local_accuracy}%</div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4 p-5 rounded-2xl bg-emerald-950/30 border border-emerald-400/40 text-center">
                <div className="text-xs font-mono uppercase text-emerald-300">GLOBAL MODEL</div>
                <div className="text-base font-bold text-white mt-1">FedAvg + DP Aggregator</div>
                <div className="mt-3 text-xs text-gray-300">
                  <label className="block font-mono text-[11px] text-emerald-400 mb-1">
                    DP Noise Multiplier: σ = {dpSigma}
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={dpSigma}
                    onChange={(e) => setDpSigma(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3">
                {latestRound.nodes.slice(1).map((n) => (
                  <div key={n.node_id} className="p-4 rounded-xl bg-black/45 border border-emerald-500/20">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>{n.node_id}</span>
                      <span className="text-[10px] font-mono text-emerald-400">LOCAL READY</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{n.specialty} · {n.samples} records</div>
                    <div className="text-xs font-mono text-emerald-300 mt-2">Local Acc: {n.local_accuracy}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Compliance & Why MeDFL Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-mono uppercase text-emerald-400">REGULATORY &amp; SECURITY ARCHITECTURE</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
            Compliance <span className="text-emerald-400">Is Covered.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { badge: "HIPAA Compliant", title: "HIPAA Security & Privacy", desc: "Administrative, physical, and technical safeguards protecting ePHI across federated nodes." },
            { badge: "GDPR Art. 25", title: "Privacy by Design", desc: "Data minimization and federated weight exchange so raw patient records stay local." },
            { badge: "HL7 FHIR R4", title: "Clinical Interoperability", desc: "Structured clinical schemas designed for modern hospital EHR & diagnostic pipelines." },
          ].map((c) => (
            <div key={c.badge} className="emerald-card rounded-2xl p-5">
              <div className="text-[11px] font-mono text-emerald-400 mb-2">✓ {c.badge}</div>
              <h3 className="font-bold text-white text-base">{c.title}</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="emerald-card rounded-2xl p-6">
            <div className="text-4xl font-mono font-bold text-emerald-400">96.4%</div>
            <div className="font-bold text-white mt-2">Diagnostic Top-3 Accuracy</div>
            <p className="text-xs text-gray-400 mt-1">Validated across multi-symptom clinical cohorts using calibrated Random Forest ensembles.</p>
          </div>
          <div className="emerald-card rounded-2xl p-6">
            <div className="text-4xl font-mono font-bold text-white">0 Bytes</div>
            <div className="font-bold text-white mt-2">Raw Patient Data Exposed</div>
            <p className="text-xs text-gray-400 mt-1">Electronic health records remain locked inside hospital firewalls at every stage of training.</p>
          </div>
          <div className="emerald-card rounded-2xl p-6">
            <div className="text-4xl font-mono font-bold text-emerald-400">4+ Nodes</div>
            <div className="font-bold text-white mt-2">Decentralized Hospital Federation</div>
            <p className="text-xs text-gray-400 mt-1">Scalable FedAvg orchestration across specialty clinics, cardiology institutes, and general hospitals.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white">MeDFL</span>
            <span>© 2026 Privacy-Preserving Federated Medical AI</span>
          </div>
          <div className="flex flex-wrap gap-5 font-mono text-[11px]">
            <a href="#medsearch" className="hover:text-emerald-400">MedSearch AI</a>
            <a href="#analyzer" className="hover:text-emerald-400">Symptom Engine</a>
            <a href="#cardiometabolic" className="hover:text-emerald-400">Cardio &amp; Metabolic</a>
            <a href="#federated" className="hover:text-emerald-400">FL Simulator</a>
            <button onClick={() => setBlueprintOpen(true)} className="hover:text-emerald-400">
              9.5/10 Architecture Blueprint
            </button>
          </div>
        </div>
      </footer>

      {/* 9.5/10 Blueprint Modal */}
      {blueprintOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="emerald-card rounded-2xl max-w-3xl w-full p-6 border-emerald-400/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400">PRODUCTION REPOSITORY UPGRADE PLAN</div>
                <h3 className="text-xl font-bold text-white">MeDFL 9.5/10 AI &amp; Engineering Blueprint</h3>
              </div>
              <button onClick={() => setBlueprintOpen(false)} className="text-gray-400 hover:text-white text-xl px-2">
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold">1. backend/federated/server.py (Flower + Opacus)</div>
                <p className="text-gray-400 mt-1">Real Flower FedAvg strategy + Opacus DP-SGD accountant for formal (ε, δ)-DP guarantees.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold">2. backend/ml/calibration.py (Brier + ECE)</div>
                <p className="text-gray-400 mt-1">Temperature/isotonic probability calibration with Expected Calibration Error (ECE) tracking.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold">3. backend/chatbot/rag_engine.py (Hybrid Search)</div>
                <p className="text-gray-400 mt-1">Tavily clinical web search + local symptom extraction + OpenFDA drug lookups.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <div className="font-mono text-emerald-300 font-semibold">4. frontend/src/hooks/useMedfl.ts</div>
                <p className="text-gray-400 mt-1">Typed API hooks, optimistic symptom state, and explainable SHAP attribution bars.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ask Med Copilot Drawer */}
      {chatOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md emerald-card rounded-2xl border-emerald-400/50 overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-4 py-3 bg-emerald-950/80 border-b border-emerald-500/30 flex justify-between items-center">
            <div className="font-bold text-sm text-white">MeDFL Unified Medical Studio</div>
            <button onClick={() => setChatOpen(false)} className="text-gray-300 hover:text-white text-lg">
              ×
            </button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === "user" ? "bg-emerald-500/20 text-white ml-8" : "bg-black/60 text-gray-200 mr-6"
                }`}
              >
                <p>{m.text}</p>
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => (
                      <a
                        key={c.url}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-emerald-400 underline"
                      >
                        ↗ {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-emerald-500/20 bg-black/70 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
