# MeDFL Frontend — Backend Integration Guide

The frontend talks to your FastAPI backend through one module: `src/lib/api.ts`.

## Configuration

Set the backend base URL in a `.env` file at the project root:

```
VITE_API_URL=http://127.0.0.1:8000
```

Default when unset: `http://127.0.0.1:8000`.
Enable CORS in FastAPI for the frontend origin (`http://localhost:8080` in dev).

## Endpoints expected

### GET `/api/symptoms?search=<optional>`
Returns either `["itching", "skin_rash", ...]` or `{ "count": 132, "symptoms": [...] }`.

### POST `/api/predict`
Body: `{ "symptoms": ["itching", "skin_rash"] }`

Response (all fields optional, flexible shapes accepted):
```json
{
  "prediction": "Fungal infection",
  "confidence": 0.94,
  "top_predictions": [
    { "disease": "Fungal infection", "confidence": 0.94 },
    { "disease": "Allergy", "confidence": 0.03 }
  ]
}
```
`confidence` may be 0–1 or 0–100; the client normalizes to percent.
`disease`/`name` and `confidence`/`probability` are both accepted keys.

### GET `/api/diseases/search?search=<query>`
Returns `["Diabetes", ...]` or `{ "count": 3, "diseases": [...] }`.

### GET `/api/diseases/{disease}`
```json
{
  "disease": "Diabetes",
  "description": "…",
  "medications": ["…"],
  "diet": ["…"],
  "precautions": ["…"],
  "workouts": ["…"]
}
```
List fields may also be comma-separated strings or stringified Python lists — the client parses both.

### POST `/api/chat`
Body:
```json
{
  "message": "What does this prediction mean?",
  "context": {
    "page": "prediction",
    "disease": "Diabetes",
    "prediction": "Diabetes",
    "confidence": 94,
    "topPredictions": ["Diabetes", "Hypertension"],
    "organ": "heart"
  }
}
```
Response: JSON with any of `reply` | `message` | `response` | `answer`.
Streaming is also supported: return `text/plain` or `text/event-stream`
chunks (optionally `data: ` prefixed) and the UI renders tokens live.

## Running the frontend

```bash
bun install     # or npm install
bun run dev     # http://localhost:8080
bun run build
```
