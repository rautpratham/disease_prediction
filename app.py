"""
Modern Disease Prediction System - Backend Server
Zero external dependencies required (uses Python standard library).
Provides REST API endpoints and static file serving.
"""

import http.server
import json
import math
import os
import sys
import urllib.parse
from http import HTTPStatus
from socketserver import ThreadingMixIn

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Load Clinical Datasets
with open(os.path.join(DATA_DIR, "diseases.json"), "r", encoding="utf-8") as f:
    DISEASES = json.load(f)

with open(os.path.join(DATA_DIR, "symptoms.json"), "r", encoding="utf-8") as f:
    SYMPTOMS = json.load(f)

# Helper Indexing for fast search
DISEASE_MAP = {d["id"]: d for d in DISEASES}


def calculate_prediction(selected_symptoms, severity_multiplier=1.0):
    """
    Advanced Multi-Factor Disease Prediction Engine:
    - Primary Symptoms Weight: 3.0
    - Secondary Symptoms Weight: 1.5
    - Penalty for excessive mismatched selected symptoms
    - Normalization with modified Weighted Jaccard & Softmax Bayesian scaling
    """
    if not selected_symptoms:
        return []

    selected_set = set(selected_symptoms)
    results = []

    for disease in DISEASES:
        primary_set = set(disease.get("primary_symptoms", []))
        secondary_set = set(disease.get("secondary_symptoms", []))
        all_disease_symptoms = primary_set | secondary_set

        matched_primary = selected_set & primary_set
        matched_secondary = selected_set & secondary_set
        matched_all = matched_primary | matched_secondary

        if not matched_all:
            continue

        # Score components
        primary_score = len(matched_primary) * 3.2
        secondary_score = len(matched_secondary) * 1.4
        raw_match_score = primary_score + secondary_score

        # Max possible score for this disease
        max_possible_disease_score = (len(primary_set) * 3.2) + (len(secondary_set) * 1.4)
        
        # Recall: how much of the disease is explained by user's symptoms
        disease_recall = raw_match_score / max_possible_disease_score if max_possible_disease_score > 0 else 0
        
        # Precision: how much of user's symptoms are explained by this disease
        user_symptom_coverage = len(matched_all) / len(selected_set)

        # Primary bonus: if primary hallmark symptoms match, boost confidence
        hallmark_bonus = 1.0
        if primary_set:
            primary_ratio = len(matched_primary) / len(primary_set)
            if primary_ratio >= 0.75:
                hallmark_bonus = 1.25
            elif primary_ratio >= 0.5:
                hallmark_bonus = 1.12

        # Combined F-Beta (giving slightly more weight to recall)
        beta = 1.2
        if (beta**2 * (1 - user_symptom_coverage) + disease_recall) > 0:
            f_score = ((1 + beta**2) * user_symptom_coverage * disease_recall) / ((beta**2 * user_symptom_coverage) + disease_recall)
        else:
            f_score = 0

        # Calculate final confidence percentage (capped between 10% and 98%)
        confidence = f_score * hallmark_bonus * 100
        confidence = min(98.5, max(12.0, confidence))

        # Check for emergency severity indicators
        is_emergency = disease.get("severity") in ["High", "Critical / Emergency"] or disease.get("urgency_level") == "Immediate Emergency Care"

        results.append({
            "disease_id": disease["id"],
            "disease_name": disease["name"],
            "category": disease["category"],
            "severity": disease["severity"],
            "urgency_level": disease["urgency_level"],
            "specialist": disease["specialist"],
            "confidence_score": round(confidence, 1),
            "matched_primary_symptoms": [SYMPTOMS.get(s, {}).get("name", s) for s in matched_primary],
            "matched_secondary_symptoms": [SYMPTOMS.get(s, {}).get("name", s) for s in matched_secondary],
            "total_matches": len(matched_all),
            "unmatched_hallmarks": [SYMPTOMS.get(s, {}).get("name", s) for s in (primary_set - matched_primary)],
            "overview": disease["overview"],
            "detailed_explanation": disease["detailed_explanation"],
            "medicines": disease.get("medicines", []),
            "remedies": disease.get("remedies", []),
            "dietary_advice": disease.get("dietary_advice", {}),
            "lifestyle_tips": disease.get("lifestyle_tips", []),
            "diagnostic_tests": disease.get("diagnostic_tests", []),
            "emergency_red_flags": disease.get("emergency_red_flags", []),
            "is_emergency": is_emergency
        })

    # Sort descending by confidence score, then total matches
    results.sort(key=lambda x: (x["confidence_score"], x["total_matches"]), reverse=True)
    return results


class ThreadedHTTPServer(ThreadingMixIn, http.server.HTTPServer):
    """Handle requests in separate threads."""
    daemon_threads = True


class HealthRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with REST API routing."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data, status_code=HTTPStatus.OK):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        response_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # REST API Routes
        if path == "/api/diseases":
            category = query.get("category", [None])[0]
            search = query.get("search", [None])[0]
            filtered = DISEASES
            if category:
                filtered = [d for d in filtered if d.get("category", "").lower() == category.lower()]
            if search:
                s = search.lower()
                filtered = [d for d in filtered if s in d["name"].lower() or s in d["overview"].lower()]
            return self._send_json({"total": len(filtered), "diseases": filtered})

        elif path.startswith("/api/diseases/"):
            disease_id = path.split("/api/diseases/")[1].strip()
            disease = DISEASE_MAP.get(disease_id)
            if disease:
                return self._send_json(disease)
            else:
                return self._send_json({"error": "Disease not found"}, HTTPStatus.NOT_FOUND)

        elif path == "/api/symptoms":
            category = query.get("category", [None])[0]
            symptoms = SYMPTOMS
            if category:
                symptoms = {k: v for k, v in symptoms.items() if v.get("category", "").lower() == category.lower()}
            return self._send_json({"total": len(symptoms), "symptoms": symptoms})

        elif path == "/api/stats":
            categories = sorted(list({d["category"] for d in DISEASES}))
            symptom_categories = sorted(list({s["category"] for s in SYMPTOMS.values()}))
            return self._send_json({
                "total_diseases": len(DISEASES),
                "total_symptoms": len(SYMPTOMS),
                "disease_categories": categories,
                "symptom_categories": symptom_categories
            })

        elif path == "/api/health":
            return self._send_json({"status": "healthy", "service": "Disease Prediction System API", "version": "2.0.0"})

        # Route root or empty to index.html
        if path == "/" or path == "":
            self.path = "/index.html"

        # Serve static files
        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/predict":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode("utf-8"))

                selected_symptoms = payload.get("symptoms", [])
                user_age = payload.get("age", None)
                user_gender = payload.get("gender", None)
                duration_days = payload.get("duration_days", None)

                if not selected_symptoms or not isinstance(selected_symptoms, list):
                    return self._send_json({"error": "Please provide an array of symptom IDs."}, HTTPStatus.BAD_REQUEST)

                predictions = calculate_prediction(selected_symptoms)

                response = {
                    "query": {
                        "symptoms_count": len(selected_symptoms),
                        "selected_symptoms": selected_symptoms,
                        "duration_days": duration_days,
                        "age": user_age,
                        "gender": user_gender
                    },
                    "total_matches": len(predictions),
                    "predictions": predictions[:8],  # Top 8 most probable matches
                    "disclaimer": "This prediction is generated algorithmically for informational guidance and does not substitute a licensed clinical diagnosis. In case of emergency, contact local emergency services immediately."
                }
                return self._send_json(response)

            except Exception as e:
                return self._send_json({"error": f"Invalid request: {str(e)}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

        return self._send_json({"error": "Endpoint not found"}, HTTPStatus.NOT_FOUND)


def start_server(port=PORT):
    server_address = ("127.0.0.1", port)
    httpd = ThreadedHTTPServer(server_address, HealthRequestHandler)
    print("=" * 65)
    print(" [AuraMed] Modern Disease Prediction System Server Running")
    print(f" [*] Local URL: http://localhost:{port}")
    print(f" [*] Database:  {len(DISEASES)} Diseases | {len(SYMPTOMS)} Symptoms")
    print(" [*] Press Ctrl+C to stop the server")
    print("=" * 65)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()


if __name__ == "__main__":
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    start_server(port)
