import os
import re
from typing import Dict, List, Optional
from dotenv import load_dotenv
from tavily import AsyncTavilyClient
from backend.database.knowledge import DiseaseKnowledge
from backend.ml.predict import DiseasePredictor

load_dotenv()

class MedicalSearchChatEngine:
    def __init__(self, knowledge: DiseaseKnowledge, predictor: DiseasePredictor):
        self.knowledge = knowledge
        self.predictor = predictor

    def _extract_symptoms(self, text: str) -> List[str]:
        clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        return list(dict.fromkeys([
            f for f in self.predictor.features
            if len(f.replace("_", " ")) > 3 and re.search(rf"\b{re.escape(f.replace('_', ' ').lower())}\b", clean)
        ]))

    async def _search_tavily(self, query: str) -> Optional[Dict]:
        load_dotenv(override=True)
        api_key = os.getenv("TAVILY_API_KEY", "").strip()
        if not api_key:
            return None
        try:
            client = AsyncTavilyClient(api_key=api_key)
            data = await client.search(query=f"{query} medical clinical health", search_depth="basic", include_answer="advanced", max_results=5)
            results = data.get("results", [])
            citations = [{"title": r.get("title", "Medical Source"), "url": r.get("url", "")} for r in results if r.get("url")]
            answer = (data.get("answer") or (results[0].get("content", "") if results else "")).strip()
            if answer:
                return {"answer": answer, "citations": citations[:5]}
        except Exception:
            return None
        return None

    async def query(self, message: str, session_symptoms: Optional[List[str]] = None) -> Dict:
        session_symptoms = list(session_symptoms or [])
        newly = self._extract_symptoms(message)
        combined = list(dict.fromkeys(session_symptoms + newly))
        pred, kb_info = None, None
        if combined:
            try:
                pred = self.predictor.predict(combined)
                kb_info = self.knowledge.get_disease_info(pred["predicted_disease"])
            except Exception:
                pass
        tavily_res = await self._search_tavily(message)
        if tavily_res:
            return {"mode": "tavily_medical_search", "detected_symptoms": combined, "newly_extracted": newly, "prediction": pred, "clinical_profile": kb_info, "citations": tavily_res["citations"], "answer": tavily_res["answer"]}
        if pred:
            return {"mode": "symptom_diagnosis", "detected_symptoms": combined, "newly_extracted": newly, "prediction": pred, "clinical_profile": kb_info, "answer": f"Top predicted condition: **{pred['predicted_disease']}** ({pred['confidence']}% confidence). {kb_info['description'] if kb_info else ''}"}
        for d in self.knowledge.list_diseases():
            if d.lower() in message.lower():
                info = self.knowledge.get_disease_info(d)
                if info:
                    return {"mode": "knowledge_base", "detected_symptoms": combined, "clinical_profile": info, "answer": info["description"]}
        return {"mode": "general_guidance", "detected_symptoms": combined, "answer": "Describe your symptoms or search any medical condition."}
