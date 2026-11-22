import re
import httpx
from typing import Dict, List, Optional
from backend.database.knowledge import DiseaseKnowledge
from backend.ml.predict import DiseasePredictor


class MedicalSearchChatEngine:
    def __init__(self, knowledge: DiseaseKnowledge, predictor: DiseasePredictor):
        self.knowledge = knowledge
        self.predictor = predictor

    def _extract_symptoms_from_text(self, text: str) -> List[str]:
        clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        matched = []
        for feat in self.predictor.features:
            readable = feat.replace("_", " ").lower()
            if len(readable) > 3 and re.search(rf"\b{re.escape(readable)}\b", clean_text):
                matched.append(feat)
        return list(dict.fromkeys(matched))

    async def _fetch_wikimedia_summary(self, query: str) -> Optional[Dict]:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": f"{query} medicine disease",
            "format": "json",
            "srlimit": 1,
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(url, params=params, headers={"User-Agent": "MeDFL/2.0"})
                data = r.json()
                hits = data.get("query", {}).get("search", [])
                if not hits:
                    return None
                title = hits[0]["title"]
                sum_r = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}",
                    headers={"User-Agent": "MeDFL/2.0"},
                )
                if sum_r.status_code == 200:
                    sdata = sum_r.json()
                    return {
                        "title": sdata.get("title", title),
                        "extract": sdata.get("extract", ""),
                        "url": sdata.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    }
        except Exception:
            return None
        return None

    async def query(self, message: str, session_symptoms: Optional[List[str]] = None) -> Dict:
        session_symptoms = list(session_symptoms or [])
        newly_detected = self._extract_symptoms_from_text(message)
        combined_symptoms = list(dict.fromkeys(session_symptoms + newly_detected))

        if combined_symptoms:
            try:
                pred = self.predictor.predict(combined_symptoms)
                top_disease = pred["predicted_disease"]
                kb_info = self.knowledge.get_disease_info(top_disease)
                return {
                    "mode": "symptom_diagnosis",
                    "detected_symptoms": combined_symptoms,
                    "newly_extracted": newly_detected,
                    "prediction": pred,
                    "clinical_profile": kb_info,
                    "answer": (
                        f"Based on your active symptoms ({', '.join(s.replace('_', ' ') for s in combined_symptoms)}), "
                        f"the top predicted condition is **{top_disease}** ({pred['confidence']}% confidence). "
                        f"{kb_info['description'] if kb_info else ''}"
                    ),
                }
            except Exception:
                pass

        for disease in self.knowledge.list_diseases():
            if disease.lower() in message.lower():
                info = self.knowledge.get_disease_info(disease)
                if info:
                    return {
                        "mode": "knowledge_base",
                        "detected_symptoms": combined_symptoms,
                        "clinical_profile": info,
                        "answer": info["description"],
                    }

        wiki = await self._fetch_wikimedia_summary(message)
        if wiki and wiki.get("extract"):
            return {
                "mode": "open_medical_search",
                "detected_symptoms": combined_symptoms,
                "source": wiki,
                "answer": wiki["extract"],
            }

        return {
            "mode": "general_guidance",
            "detected_symptoms": combined_symptoms,
            "answer": "Please describe any specific symptoms (e.g., 'sharp throat pain and fever') or search any condition or medication.",
        }
