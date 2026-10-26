# 🩺 AuraMed — Modern AI Disease Prediction & Health Guidance System

A modern, clinical-grade disease prediction web application that predicts possible conditions based on multi-symptom input, provides detailed explanations of diseases, suggests generic Over-The-Counter (OTC) and prescription medications with safety precautions, details evidence-based home remedies, and outlines vital triage guidance and dietary advice.

---

## 🌟 Key Features

1. **Intelligent Multi-Symptom Matching Engine**
   - **Weighted Diagnostic Algorithm**: Primary hallmark symptoms carry a 3.2× weight, while secondary non-specific symptoms carry a 1.4× weight, combined with modified F-Beta scoring and hallmark presence boosts.
   - **Differential Diagnosis**: Identifies the primary condition alongside ranked alternative possibilities with confidence percentages.
   - **Symptom Autocomplete & Categories**: Search through 127+ structured symptoms categorized across 10 body systems (Respiratory, Gastrointestinal, Neurological, Dermatological, Cardiovascular, Endocrine, Musculoskeletal, Urinary, Eyes/ENT, and General).
   - **1-Click Test Presets**: Quick-load common symptom profiles (e.g., *Flu-like*, *Food Poisoning*, *Migraine*, *Asthma Flare*, *Acid Reflux*, *Kidney Stone Colic*, *Shingles*).

2. **Detailed Medical Explanations**
   - Comprehensive pathology and etiology explanations written in patient-accessible language.
   - Severity tags (*Mild*, *Moderate*, *High*, *Critical / Emergency*).
   - Recommended medical specialist (e.g., *Pulmonologist*, *Gastroenterologist*, *Neurologist*, *Dermatologist*, *Urologist*).
   - Standard clinical lab & diagnostic tests commonly ordered by doctors (e.g., *CBC*, *Spirometry*, *Endoscopy*, *CT/Ultrasound*).

3. **Pharmacological Suggestions (Medicines)**
   - Clear classification between **OTC (Over-The-Counter)** symptomatic relief and **Prescription** therapies.
   - Generic drug names (e.g., *Paracetamol*, *Ibuprofen*, *Omeprazole*, *Sumatriptan*, *Nitrofurantoin*).
   - Standard dosage and administration instructions.
   - **Critical safety precautions and contraindications** (e.g., avoiding NSAIDs in suspected Dengue to avoid hemorrhage; liver dose limits for acetaminophen; Reye's syndrome cautions).

4. **Evidence-Based Home Remedies & Lifestyle**
   - Step-by-step home care protocols (e.g., *Saline gargles*, *Epley repositioning maneuver for BPPV*, *BRAT diet*, *Head-of-bed elevation for GERD*, *Colloidal oatmeal baths*).
   - Detailed clinical benefits explaining *why* each remedy assists healing.
   - **Dietary Guidelines**: Direct lists of *Recommended Foods* vs. *Foods to Strictly Avoid*.

5. **Patient Safety & Emergency Triage**
   - **Red Flag Warnings**: Clear warning signs indicating when to discontinue self-care and go to the ER immediately.
   - **Emergency SOS Modal**: Instant one-click access to local and international emergency helpline numbers (112, 911, 102/108, Poison Control).
   - **Print / Save PDF Report**: Clean, printable clinical summary formatted for consultation with a healthcare provider.

6. **Modern Design & Flexibility**
   - Dark Mode / Light Mode with seamless toggle and memory.
   - Responsive Glassmorphism UI built with modern CSS variables.
   - **Zero-Dependency Architecture**: Runs with Python's built-in standard library (no `pip install` required) OR as a standalone browser app by double-clicking `index.html`.

---

## 📁 Project Architecture

```
disease prediction/
├── app.py                      # Multi-threaded Python server & REST API (Zero external dependencies)
├── index.html                  # Responsive Web Application interface
├── build_data.py               # Clinical dataset generator script
├── test_engine.py              # Diagnostic test suite for prediction accuracy
├── data/
│   ├── diseases.json           # Clinical database (29 diseases, medications, remedies, red flags)
│   └── symptoms.json           # 127 categorized symptoms with descriptions
├── static/
│   ├── css/
│   │   └── style.css           # Modern CSS styling (Glassmorphism, animations, responsive, print)
│   └── js/
│       ├── app.js              # Application controller, autocomplete, and UI rendering
│       ├── prediction.js       # Core prediction algorithms and scoring logic
│       └── data-bundle.js      # Embedded database for offline file:// execution
├── templates/
│   └── index.html              # Server template copy
└── README.md                   # System documentation
```

---

## 🚀 How to Run the Application

### Option A: Run via Python Server (Recommended)
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd "c:\Users\ADMIN\OneDrive\Desktop\disease prediction"
   ```
2. Start the server (uses Python standard library, zero `pip install` required):
   ```powershell
   python app.py
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Option B: Run Directly in Any Browser (Standalone / Offline)
Simply double-click `index.html` or open it with Google Chrome, Microsoft Edge, or Mozilla Firefox. The application includes a self-contained prediction engine and embedded dataset that operates client-side without any server needed.

---

## 📡 REST API Reference

When running `app.py`, the following REST API endpoints are exposed:

### 1. Run Symptom Prediction
- **Endpoint**: `POST /api/predict`
- **Payload**:
  ```json
  {
    "symptoms": ["high_fever", "severe_body_aches", "extreme_fatigue", "dry_cough", "chills"],
    "severity": "moderate",
    "duration_days": 3
  }
  ```
- **Response**:
  ```json
  {
    "total_matches": 6,
    "predictions": [
      {
        "disease_id": "influenza",
        "disease_name": "Influenza (Flu)",
        "category": "Respiratory",
        "severity": "Moderate to High",
        "urgency_level": "Consult Doctor within 48h",
        "specialist": "General Physician / Pulmonologist",
        "confidence_score": 98.5,
        "matched_primary_symptoms": ["High Fever (>101°F / 38.3°C)", "Severe Body Aches (Myalgia)", "Extreme Exhaustion / Prostration", "Chills & Shivering", "Dry / Hacking Cough"],
        "medicines": [...],
        "remedies": [...],
        "dietary_advice": { "recommended": [...], "avoid": [...] },
        "emergency_red_flags": [...]
      }
    ]
  }
  ```

### 2. Get All Diseases
- **Endpoint**: `GET /api/diseases`
- **Optional Query Parameters**: `?category=Respiratory&search=asthma`

### 3. Get Single Disease by ID
- **Endpoint**: `GET /api/diseases/{id}` (e.g. `/api/diseases/migraine`)

### 4. Get Categorized Symptoms
- **Endpoint**: `GET /api/symptoms`
- **Optional Query Parameters**: `?category=Gastrointestinal`

### 5. System Stats & Health
- **Endpoint**: `GET /api/stats`
- **Endpoint**: `GET /api/health`

---

## 🧪 Testing Prediction Accuracy

Run the included automated test suite to verify prediction accuracy across multiple conditions:
```powershell
python test_engine.py
```

Expected output:
```
PASS: Flu symptoms           -> Influenza (Flu)                               (Score: 98.5%)
PASS: Cold symptoms          -> Common Cold (Viral Upper Respiratory Tract)   (Score: 94.5%)
PASS: Gastro symptoms        -> Acute Gastroenteritis (Food Poisoning)        (Score: 94.5%)
PASS: Migraine symptoms      -> Migraine Headache                             (Score: 94.5%)
PASS: Asthma symptoms        -> Bronchial Asthma                              (Score: 94.5%)
PASS: Kidney stone symptoms  -> Kidney Stones (Nephrolithiasis)               (Score: 76.8%)
PASS: Appendicitis symptoms  -> Acute Appendicitis                            (Score: 76.8%)

ALL CLINICAL PREDICTION TESTS PASSED SUCCESSFULLY!
```

---

## ⚠️ Medical Safety Disclaimer

This system is designed strictly for **educational, triage, and informational purposes**. It does **not** provide a medical diagnosis or replace a qualified healthcare professional. If you or someone you know is experiencing severe symptoms—such as difficulty breathing, sudden chest pain, severe bleeding, or loss of consciousness—call your local emergency medical services (such as **112** or **911**) immediately.
