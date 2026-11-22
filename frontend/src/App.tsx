import React, { useEffect, useState } from "react";
import {
  fetchSymptoms,
  predictDisease,
  runFederatedTraining,
  queryMedicalSearchChat,
  PredictionResponse,
  FederatedResponse,
  ChatSearchResponse,
} from "./lib/api";
import { AnatomyMap } from "./components/AnatomyMap";

export function App() {
  const [largeText, setLargeText] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ChatSearchResponse | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string; symptoms?: string[] }[]>([
    {
      role: "ai",
      text: "Welcome to MeDFL Clinical AI. Ask any medical question, compare medications, or describe symptoms like 'I have a sharp throat pain too' for real-time differential diagnosis.",
    },
  ]);

  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [symptomFilter, setSymptomFilter] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["chest_pain", "shortness_of_breath"]);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  const [hba1c, setHba1c] = useState(6.4);
  const [systolicBp, setSystolicBp] = useState(134);
  const [glucose, setGlucose] = useState(118);

  const [flRounds, setFlRounds] = useState(8);
  const [dpSigma, setDpSigma] = useState(0.05);
  const [flLoading, setFlLoading] = useState(false);
  const [flResult, setFlResult] = useState<FederatedResponse | null>(null);

  useEffect(() => {
    fetchSymptoms().then(setAllSymptoms);
    handleRunPrediction(["chest_pain", "shortness_of_breath"]);
    handleRunFederated(8, 0.05);
  }, []);

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
    utter.rate = 1.02;
    window.speechSynthesis.speak(utter);
  };

  const startVoiceRecognition = (onResult: (transcript: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires Chrome, Edge, or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => onResult(event.results[0][0].transcript);
    recognition.start();
  };

  const handleRunPrediction = async (syms = selectedSymptoms) => {
    if (syms.length === 0) return;
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
    if (next.length > 0) handleRunPrediction(next);
  };

  const handleMedSearch = async (customQuery?: string) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;
    setSearchLoading(true);
    const res = await queryMedicalSearchChat(q, selectedSymptoms);
    setSearchResult(res);
    if (res.detected_symptoms?.length) {
      setSelectedSymptoms(res.detected_symptoms);
      if (res.prediction) setPrediction(res.prediction);
    }
    speakText(res.answer);
    setSearchLoading(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    const res = await queryMedicalSearchChat(msg, selectedSymptoms);
    if (res.detected_symptoms?.length) {
      setSelectedSymptoms(res.detected_symptoms);
      if (res.prediction) setPrediction(res.prediction);
    }
    setChatMessages((prev) => [...prev, { role: "ai", text: res.answer, symptoms: res.detected_symptoms }]);
    speakText(res.answer);
  };

  const handleRunFederated = async (r = flRounds, s = dpSigma) => {
    setFlLoading(true);
    const res = await runFederatedTraining(r, s);
    setFlResult(res);
    setFlLoading(false);
  };

  const cardioMetabolicScore = Math.min(99, Math.round((hba1c - 4.5) * 11 + (systolicBp - 105) * 0.45 + (glucose - 80) * 0.25));
  const filteredSymptoms = allSymptoms.filter((s) => s.toLowerCase().includes(symptomFilter.toLowerCase().replace(/\s+/g, "_"))).slice(0, 36);
  return (
    <div className={`min-h-screen ${largeText ? "large-text" : ""}`}>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/75 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center font-mono font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">M+</div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white">MeDFL</span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">v2.0 Federated AI</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#medsearch" className="hover:text-emerald-400 transition">MedSearch AI</a>
            <a href="#analyzer" className="hover:text-emerald-400 transition">Symptom Analyzer</a>
            <a href="#cardiometabolic" className="hover:text-emerald-400 transition">Cardio-Metabolic</a>
            <a href="#federated" className="hover:text-emerald-400 transition">Federated Nodes</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLargeText(!largeText)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${largeText ? "bg-emerald-500 text-black border-emerald-400 font-bold" : "bg-white/5 text-gray-300 border-white/10"}`}>A+</button>
            <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${ttsEnabled ? "bg-emerald-500 text-black border-emerald-400 font-bold" : "bg-white/5 text-gray-300 border-white/10"}`}>{ttsEnabled ? "TTS ON" : "TTS OFF"}</button>
            <button onClick={() => setChatOpen(true)} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-semibold text-sm">Ask MeDFL AI</button>
          </div>
        </div>
      </header>

      <section id="medsearch" className="max-w-7xl mx-auto px-6 pt-14 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Zero-Data-Sharing Hospital Federation • 100+ Clinical Conditions
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Privacy-First <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-white bg-clip-text text-transparent">Clinical Intelligence</span>
          </h1>
          <p className="mt-4 text-gray-300 text-base md:text-lg">Search any medical condition, medication, or natural-language symptom combination—powered by federated hospital models and SHAP explainability.</p>

          <div className="mt-8 emerald-card rounded-2xl p-2 flex items-center gap-2">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleMedSearch()} placeholder="Ask anything: 'sharp throat pain and fever', 'Metformin side effects', 'Type 2 Diabetes diet'..." className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none text-sm md:text-base" />
            <button onClick={() => startVoiceRecognition((t) => { setSearchQuery(t); handleMedSearch(t); })} className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-sm font-mono">MIC</button>
            <button onClick={() => handleMedSearch()} disabled={searchLoading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-semibold text-sm shrink-0">{searchLoading ? "Searching..." : "MedSearch"}</button>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {["I have a sharp throat pain and fever", "Chest pain and shortness of breath", "Type 2 Diabetes mellitus", "Hypertension precautions"].map((sample) => (
              <button key={sample} onClick={() => { setSearchQuery(sample); handleMedSearch(sample); }} className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/15 text-gray-300 border border-white/10">{sample}</button>
            ))}
          </div>

          {searchResult && (
            <div className="mt-6 text-left emerald-card rounded-2xl p-6 border-emerald-400/40">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">{searchResult.mode.replace(/_/g, " ")}</span>
                {searchResult.detected_symptoms?.length > 0 && <span className="text-xs font-mono text-gray-300">Synced: {searchResult.detected_symptoms.join(", ")}</span>}
              </div>
              <p className="text-white leading-relaxed">{searchResult.answer}</p>
              {searchResult.clinical_profile && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/10"><div className="font-mono text-emerald-400 mb-1">MEDICATIONS</div><div className="text-gray-200">{searchResult.clinical_profile.medications.join(", ") || "Consult physician"}</div></div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/10"><div className="font-mono text-emerald-400 mb-1">DIET</div><div className="text-gray-200">{searchResult.clinical_profile.diets.join(", ") || "Balanced nutrition"}</div></div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/10"><div className="font-mono text-emerald-400 mb-1">PRECAUTIONS</div><div className="text-gray-200">{searchResult.clinical_profile.precautions.join(" • ") || "Clinical monitoring"}</div></div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="analyzer" className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Multi-Organ Anatomical Symptom Analyzer</h2>
          <p className="text-gray-400 mt-1">Select regions on the body map or filter across 130+ clinical symptoms for top-3 differential probabilities and SHAP attributions.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-white mb-4">2D Interactive Body Map</h3>
            <AnatomyMap selectedSymptoms={selectedSymptoms} onToggleSymptom={toggleSymptom} />
          </div>
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg text-white mb-3">Clinical Symptom Selector</h3>
              <input type="text" value={symptomFilter} onChange={(e) => setSymptomFilter(e.target.value)} placeholder="Filter symptoms..." className="w-full bg-black/50 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-sm text-white mb-4" />
              <div className="mb-4">
                <div className="text-xs font-mono text-emerald-400 mb-2">ACTIVE SYMPTOMS ({selectedSymptoms.length})</div>
                <div className="flex flex-wrap gap-1.5 min-h-[38px]">
                  {selectedSymptoms.map((sym) => (
                    <button key={sym} onClick={() => toggleSymptom(sym)} className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-semibold">{sym.replace(/_/g, " ")} ×</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                {filteredSymptoms.map((sym) => (
                  <button key={sym} onClick={() => toggleSymptom(sym)} className={`px-2.5 py-1 rounded-lg text-xs border ${selectedSymptoms.includes(sym) ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-white/5 border-white/10 text-gray-300"}`}>{sym.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
            <button onClick={() => handleRunPrediction()} disabled={predicting || selectedSymptoms.length === 0} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-bold text-sm">{predicting ? "Analyzing..." : "Run Differential Diagnosis"}</button>
          </div>
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-white mb-4">Diagnostic Inference & SHAP</h3>
            {prediction && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-400/40">
                  <div className="text-xs font-mono text-emerald-300">PRIMARY PREDICTION</div>
                  <div className="text-2xl font-bold text-white mt-1">{prediction.predicted_disease}</div>
                  <div className="text-sm font-mono text-emerald-400 mt-1">Confidence: {prediction.confidence}%</div>
                </div>
                <div className="space-y-2">
                  {prediction.top_3.map((item) => (
                    <div key={item.disease} className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <div className="flex justify-between text-xs mb-1"><span className="text-white">{item.disease}</span><span className="font-mono text-emerald-400">{item.confidence}%</span></div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, item.confidence)}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-gray-400">SHAP ATTRIBUTION</div>
                  {prediction.shap_explanation.map((sh) => (
                    <div key={sh.symptom} className="flex justify-between text-xs bg-white/5 px-3 py-1.5 rounded-lg"><span className="text-gray-200">{sh.symptom.replace(/_/g, " ")}</span><span className="font-mono text-emerald-300">+{sh.contribution_pct}%</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="cardiometabolic" className="max-w-7xl mx-auto px-6 py-10">
        <div className="emerald-card rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase">Specialized Cohorts</span>
            <h2 className="text-2xl font-bold text-white mt-1">Cardio-Metabolic Biomarker Index</h2>
            <p className="text-sm text-gray-400 mt-2">Calibrate HbA1c, Systolic BP, and Fasting Glucose alongside symptom vectors.</p>
          </div>
          <div className="space-y-4">
            <div><div className="flex justify-between text-xs font-mono"><span>HbA1c</span><span className="text-emerald-400">{hba1c}%</span></div><input type="range" min="4.5" max="12.0" step="0.1" value={hba1c} onChange={(e) => setHba1c(parseFloat(e.target.value))} className="w-full accent-emerald-500" /></div>
            <div><div className="flex justify-between text-xs font-mono"><span>Systolic BP</span><span className="text-emerald-400">{systolicBp} mmHg</span></div><input type="range" min="95" max="190" value={systolicBp} onChange={(e) => setSystolicBp(parseInt(e.target.value))} className="w-full accent-emerald-500" /></div>
            <div><div className="flex justify-between text-xs font-mono"><span>Fasting Glucose</span><span className="text-emerald-400">{glucose} mg/dL</span></div><input type="range" min="70" max="260" value={glucose} onChange={(e) => setGlucose(parseInt(e.target.value))} className="w-full accent-emerald-500" /></div>
          </div>
          <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <div className="text-xs font-mono text-gray-400">COMPOSITE RISK SCORE</div>
            <div className="text-5xl font-bold text-white mt-2">{Math.max(5, cardioMetabolicScore)}%</div>
          </div>
        </div>
      </section>

      <section id="federated" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase">Decentralized Training</span>
            <h2 className="text-3xl font-bold text-white mt-1">Multi-Hospital Federated Learning (FedAvg)</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 emerald-card px-4 py-3 rounded-2xl">
            <div><label className="block text-[11px] font-mono text-gray-400">ROUNDS: {flRounds}</label><input type="range" min="3" max="15" value={flRounds} onChange={(e) => setFlRounds(parseInt(e.target.value))} className="w-28 accent-emerald-500" /></div>
            <div><label className="block text-[11px] font-mono text-gray-400">DP NOISE (σ): {dpSigma}</label><input type="range" min="0.01" max="0.25" step="0.01" value={dpSigma} onChange={(e) => setDpSigma(parseFloat(e.target.value))} className="w-28 accent-emerald-500" /></div>
            <button onClick={() => handleRunFederated()} disabled={flLoading} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm">{flLoading ? "Aggregating..." : "Run FedAvg Round"}</button>
          </div>
        </div>
        {flResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {flResult.history[flResult.history.length - 1].nodes.map((node) => (
              <div key={node.node_id} className="emerald-card rounded-2xl p-5">
                <div className="flex justify-between text-xs font-mono"><span className="text-emerald-400">ISOLATED SILO</span><span className="text-emerald-300">{node.samples} records</span></div>
                <h3 className="text-lg font-bold text-white mt-2">{node.node_id}</h3>
                <p className="text-xs text-gray-400">{node.specialty}</p>
                <div className="mt-4 flex justify-between"><span className="text-xs text-gray-400">Local Accuracy</span><span className="text-xl font-mono font-bold text-white">{node.local_accuracy}%</span></div>
              </div>
            ))}
            <div className="lg:col-span-3 emerald-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
              <div><div className="text-xs font-mono text-emerald-400">GLOBAL AGGREGATED MODEL</div><div className="text-2xl font-bold text-white mt-1">Accuracy: {flResult.final_global_accuracy}% ({flResult.rounds} Rounds)</div></div>
              <div className="flex gap-6 font-mono text-sm"><div><div className="text-xs text-gray-400">PRIVACY BUDGET</div><div className="text-emerald-300 font-bold">ε = {flResult.privacy_budget_epsilon}</div></div><div><div className="text-xs text-gray-400">RAW RECORDS SHARED</div><div className="text-white font-bold">0 (Zero-Leakage)</div></div></div>
            </div>
          </div>
        )}
      </section>

      {chatOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md emerald-card rounded-2xl border-emerald-400/50 overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-4 py-3 bg-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between">
            <div><div className="font-bold text-sm text-white">MeDFL Clinical Copilot</div><div className="text-[11px] font-mono text-emerald-400">Context-Aware NLU + Open Medical Search</div></div>
            <button onClick={() => setChatOpen(false)} className="text-gray-300 hover:text-white text-lg px-2">×</button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-sm">
            {chatMessages.map((m, i) => (
              <div key={i} className={`p-3 rounded-xl ${m.role === "user" ? "bg-emerald-500/20 border border-emerald-400/30 text-white ml-8" : "bg-black/60 border border-white/10 text-gray-200 mr-6"}`}>
                <p>{m.text}</p>
                {m.symptoms && m.symptoms.length > 0 && <div className="mt-2 text-[11px] font-mono text-emerald-400">Active context: {m.symptoms.join(", ")}</div>}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-emerald-500/20 bg-black/70 flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="e.g., 'i have a sharp throat pain too'..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
            <button type="button" onClick={() => startVoiceRecognition((t) => setChatInput(t))} className="px-2.5 py-2 rounded-xl bg-white/5 text-emerald-300 text-xs font-mono">MIC</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
export default App;
