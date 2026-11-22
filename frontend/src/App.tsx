import React, { useEffect, useState } from "react";
import { fetchSymptoms, predictDisease, runFederatedTraining, queryMedicalSearchChat } from "./lib/api";
import type { PredictionResponse, FederatedResponse, ChatSearchResponse } from "./lib/api";
import { AnatomyMap } from "./components/AnatomyMap";

export default function App() {
  const [largeText, setLargeText] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ChatSearchResponse | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string; citations?: { title: string; url: string }[] }[]>([
    { role: "ai", text: "Welcome to MeDFL Clinical AI powered by Tavily Medical Search & Federated ML. Ask any medical question or describe your symptoms." },
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

  const speak = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/\*\*/g, "")));
  };

  const handleRunPrediction = async (syms = selectedSymptoms) => {
    if (!syms.length) return;
    setPredicting(true);
    setPrediction(await predictDisease(syms));
    setPredicting(false);
  };

  const toggleSymptom = (sym: string) => {
    const next = selectedSymptoms.includes(sym) ? selectedSymptoms.filter((s) => s !== sym) : [...selectedSymptoms, sym];
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
    setFlResult(await runFederatedTraining(r, s));
    setFlLoading(false);
  };

  const cardioScore = Math.min(99, Math.round((hba1c - 4.5) * 11 + (systolicBp - 105) * 0.45 + (glucose - 80) * 0.25));
  const filteredSymptoms = allSymptoms.filter((s) => s.toLowerCase().includes(symptomFilter.toLowerCase().replace(/\s+/g, "_"))).slice(0, 36);

  return (
    <div className={`min-h-screen ${largeText ? "large-text" : ""}`}>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/75 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center font-mono font-bold text-black">M+</div>
            <span className="font-display font-bold text-xl text-white">MeDFL</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Tavily + FedML v2</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-300">
            <a href="#medsearch" className="hover:text-emerald-400">MedSearch AI</a>
            <a href="#analyzer" className="hover:text-emerald-400">Symptom Analyzer</a>
            <a href="#cardiometabolic" className="hover:text-emerald-400">Cardio-Metabolic</a>
            <a href="#federated" className="hover:text-emerald-400">Federated Nodes</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLargeText(!largeText)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${largeText ? "bg-emerald-500 text-black font-bold" : "bg-white/5 text-gray-300 border-white/10"}`}>A+</button>
            <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${ttsEnabled ? "bg-emerald-500 text-black font-bold" : "bg-white/5 text-gray-300 border-white/10"}`}>{ttsEnabled ? "TTS ON" : "TTS OFF"}</button>
            <button onClick={() => setChatOpen(true)} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-semibold text-sm">Ask MeDFL AI</button>
          </div>
        </div>
      </header>

      <section id="medsearch" className="max-w-7xl mx-auto px-6 pt-14 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white">Privacy-First <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-white bg-clip-text text-transparent">Clinical Search</span></h1>
          <p className="mt-4 text-gray-300">Live Tavily AI medical web search paired with multi-hospital federated diagnostics and SHAP explainability.</p>
          <div className="mt-8 emerald-card rounded-2xl p-2 flex items-center gap-2">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleMedSearch()} placeholder="Search any condition, symptom, or medication..." className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none" />
            <button onClick={() => handleMedSearch()} disabled={searchLoading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-semibold text-sm shrink-0">{searchLoading ? "Searching..." : "MedSearch"}</button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            {["Early warning signs of Type 2 Diabetes", "Sharp throat pain and fever", "Metformin clinical uses", "Hypertension management"].map((s) => (
              <button key={s} onClick={() => { setSearchQuery(s); handleMedSearch(s); }} className="px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/15 text-gray-300 border border-white/10">{s}</button>
            ))}
          </div>
          {searchResult && (
            <div className="mt-6 text-left emerald-card rounded-2xl p-6 border-emerald-400/40">
              <div className="text-xs font-mono uppercase text-emerald-400 mb-2">{searchResult.mode.replace(/_/g, " ")}</div>
              <p className="text-white leading-relaxed">{searchResult.answer}</p>
              {searchResult.citations && searchResult.citations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchResult.citations.map((c) => (
                    <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs text-emerald-300 font-mono">↗ {c.title}</a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="analyzer" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-white mb-6">Multi-Organ Anatomical Symptom Analyzer</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6"><h3 className="font-semibold text-lg text-white mb-4">2D Body Map</h3><AnatomyMap selectedSymptoms={selectedSymptoms} onToggleSymptom={toggleSymptom} /></div>
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg text-white mb-3">Symptom Selector</h3>
              <input type="text" value={symptomFilter} onChange={(e) => setSymptomFilter(e.target.value)} placeholder="Filter symptoms..." className="w-full bg-black/50 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-sm text-white mb-4" />
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedSymptoms.map((sym) => <button key={sym} onClick={() => toggleSymptom(sym)} className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-semibold">{sym.replace(/_/g, " ")} ×</button>)}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                {filteredSymptoms.map((sym) => <button key={sym} onClick={() => toggleSymptom(sym)} className={`px-2.5 py-1 rounded-lg text-xs border ${selectedSymptoms.includes(sym) ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-white/5 border-white/10 text-gray-300"}`}>{sym.replace(/_/g, " ")}</button>)}
              </div>
            </div>
            <button onClick={() => handleRunPrediction()} disabled={predicting} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-bold text-sm">{predicting ? "Analyzing..." : "Run Differential Diagnosis"}</button>
          </div>
          <div className="lg:col-span-4 emerald-card rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-white mb-4">Prediction & SHAP</h3>
            {prediction && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-400/40">
                  <div className="text-xs font-mono text-emerald-300">TOP MATCH</div>
                  <div className="text-2xl font-bold text-white mt-1">{prediction.predicted_disease}</div>
                  <div className="text-sm font-mono text-emerald-400 mt-1">Confidence: {prediction.confidence}%</div>
                </div>
                {prediction.top_3.map((item) => (
                  <div key={item.disease} className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                    <div className="flex justify-between text-xs mb-1"><span>{item.disease}</span><span className="font-mono text-emerald-400">{item.confidence}%</span></div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, item.confidence)}%` }} /></div>
                  </div>
                ))}
                {prediction.shap_explanation.map((sh) => (
                  <div key={sh.symptom} className="flex justify-between text-xs bg-white/5 px-3 py-1.5 rounded-lg"><span>{sh.symptom.replace(/_/g, " ")}</span><span className="font-mono text-emerald-300">+{sh.contribution_pct}%</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="cardiometabolic" className="max-w-7xl mx-auto px-6 py-10">
        <div className="emerald-card rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div><span className="text-xs font-mono text-emerald-400">BIOMARKER COHORT</span><h2 className="text-2xl font-bold text-white mt-1">Cardio-Metabolic Index</h2></div>
          <div className="space-y-4">
            <div><div className="flex justify-between text-xs font-mono"><span>HbA1c</span><span className="text-emerald-400">{hba1c}%</span></div><input type="range" min="4.5" max="12" step="0.1" value={hba1c} onChange={(e) => setHba1c(parseFloat(e.target.value))} className="w-full accent-emerald-500" /></div>
            <div><div className="flex justify-between text-xs font-mono"><span>Systolic BP</span><span className="text-emerald-400">{systolicBp} mmHg</span></div><input type="range" min="95" max="190" value={systolicBp} onChange={(e) => setSystolicBp(parseInt(e.target.value))} className="w-full accent-emerald-500" /></div>
            <div><div className="flex justify-between text-xs font-mono"><span>Glucose</span><span className="text-emerald-400">{glucose} mg/dL</span></div><input type="range" min="70" max="260" value={glucose} onChange={(e) => setGlucose(parseInt(e.target.value))} className="w-full accent-emerald-500" /></div>
          </div>
          <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-6 text-center"><div className="text-xs font-mono text-gray-400">COMPOSITE RISK</div><div className="text-5xl font-bold text-white mt-2">{Math.max(5, cardioScore)}%</div></div>
        </div>
      </section>

      <section id="federated" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold text-white">Multi-Hospital Federated Learning (FedAvg)</h2>
          <div className="flex items-center gap-4 emerald-card px-4 py-3 rounded-2xl">
            <div><label className="block text-[11px] font-mono text-gray-400">ROUNDS: {flRounds}</label><input type="range" min="3" max="15" value={flRounds} onChange={(e) => setFlRounds(parseInt(e.target.value))} className="w-28 accent-emerald-500" /></div>
            <div><label className="block text-[11px] font-mono text-gray-400">DP NOISE: {dpSigma}</label><input type="range" min="0.01" max="0.25" step="0.01" value={dpSigma} onChange={(e) => setDpSigma(parseFloat(e.target.value))} className="w-28 accent-emerald-500" /></div>
            <button onClick={() => handleRunFederated()} disabled={flLoading} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm">{flLoading ? "Running..." : "Run FedAvg"}</button>
          </div>
        </div>
        {flResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {flResult.history[flResult.history.length - 1].nodes.map((n) => (
              <div key={n.node_id} className="emerald-card rounded-2xl p-5">
                <div className="text-xs font-mono text-emerald-400">{n.samples} LOCAL RECORDS</div>
                <h3 className="text-lg font-bold text-white mt-1">{n.node_id}</h3>
                <div className="mt-4 flex justify-between"><span className="text-xs text-gray-400">Local Accuracy</span><span className="text-xl font-mono font-bold text-white">{n.local_accuracy}%</span></div>
              </div>
            ))}
            <div className="lg:col-span-3 emerald-card rounded-2xl p-6 flex justify-between items-center">
              <div className="text-xl font-bold text-white">Global Accuracy: {flResult.final_global_accuracy}% ({flResult.rounds} Rounds)</div>
              <div className="font-mono text-emerald-300 font-bold">Privacy Budget: ε = {flResult.privacy_budget_epsilon} • Raw Records Shared: 0</div>
            </div>
          </div>
        )}
      </section>

      {chatOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md emerald-card rounded-2xl border-emerald-400/50 overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-4 py-3 bg-emerald-950/80 border-b border-emerald-500/30 flex justify-between items-center">
            <div className="font-bold text-sm text-white">MeDFL Tavily Copilot</div>
            <button onClick={() => setChatOpen(false)} className="text-gray-300 hover:text-white text-lg">×</button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-sm">
            {chatMessages.map((m, i) => (
              <div key={i} className={`p-3 rounded-xl ${m.role === "user" ? "bg-emerald-500/20 text-white ml-8" : "bg-black/60 text-gray-200 mr-6"}`}>
                <p>{m.text}</p>
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-emerald-400 underline">↗ {c.title}</a>)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-emerald-500/20 bg-black/70 flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

