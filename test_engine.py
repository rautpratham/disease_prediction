import app

tests = [
    ("Flu symptoms", ["high_fever", "severe_body_aches", "extreme_fatigue", "dry_cough", "chills"]),
    ("Cold symptoms", ["runny_nose", "sneezing", "nasal_congestion", "sore_throat"]),
    ("Gastro symptoms", ["watery_diarrhea", "nausea", "vomiting", "abdominal_cramps"]),
    ("Migraine symptoms", ["throbbing_headache", "sensitivity_to_light", "sensitivity_to_sound", "nausea"]),
    ("Asthma symptoms", ["wheezing", "shortness_of_breath", "chest_tightness", "coughing_at_night"]),
    ("Kidney stone symptoms", ["severe_sharp_flank_pain", "pain_radiating_to_groin", "blood_in_urine"]),
    ("Appendicitis symptoms", ["right_lower_quadrant_abdominal_pain", "rebound_tenderness", "nausea_and_vomiting"])
]

all_passed = True
for title, syms in tests:
    res = app.calculate_prediction(syms)
    if not res:
        print(f"FAIL: No prediction for {title}")
        all_passed = False
        continue
    top = res[0]
    dname = top["disease_name"]
    score = top["confidence_score"]
    meds_count = len(top["medicines"])
    rems_count = len(top["remedies"])
    print(f"PASS: {title:22} -> {dname:45} (Score: {score}%, Meds: {meds_count}, Remedies: {rems_count})")

if all_passed:
    print("\nALL CLINICAL PREDICTION TESTS PASSED SUCCESSFULLY!")
