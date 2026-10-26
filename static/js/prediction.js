/**
 * Modern Disease Prediction System - Prediction Engine
 * Supports both API-driven prediction (via Python server) and client-side fallback.
 */

const PredictionEngine = {
  diseases: [],
  symptoms: {},
  isInitialized: false,

  async init(diseasesData = null, symptomsData = null) {
    if (diseasesData && symptomsData) {
      this.diseases = diseasesData;
      this.symptoms = symptomsData;
      this.isInitialized = true;
      return;
    }

    try {
      // Attempt fetching from API or static json files
      const [diseasesRes, symptomsRes] = await Promise.all([
        fetch('/data/diseases.json').catch(() => fetch('data/diseases.json')),
        fetch('/data/symptoms.json').catch(() => fetch('data/symptoms.json'))
      ]);

      if (diseasesRes.ok && symptomsRes.ok) {
        this.diseases = await diseasesRes.json();
        this.symptoms = await symptomsRes.json();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn("Could not load external JSON data files asynchronously:", e);
    }
  },

  /**
   * Run prediction algorithm
   * @param {Array<string>} selectedSymptoms - List of symptom keys
   * @param {Object} options - { durationDays, severity }
   * @returns {Array<Object>} Ranked prediction results
   */
  predict(selectedSymptoms, options = {}) {
    if (!selectedSymptoms || selectedSymptoms.length === 0) {
      return [];
    }

    const selectedSet = new Set(selectedSymptoms);
    const results = [];

    for (const disease of this.diseases) {
      const primarySet = new Set(disease.primary_symptoms || []);
      const secondarySet = new Set(disease.secondary_symptoms || []);
      const allDiseaseSymptoms = new Set([...primarySet, ...secondarySet]);

      const matchedPrimary = [...selectedSet].filter(s => primarySet.has(s));
      const matchedSecondary = [...selectedSet].filter(s => secondarySet.has(s));
      const totalMatches = matchedPrimary.length + matchedSecondary.length;

      if (totalMatches === 0) continue;

      // Primary symptoms carry triple diagnostic weight
      const primaryScore = matchedPrimary.length * 3.2;
      const secondaryScore = matchedSecondary.length * 1.4;
      const rawMatchScore = primaryScore + secondaryScore;

      // Theoretical max score for this disease
      const maxPossibleDiseaseScore = (primarySet.size * 3.2) + (secondarySet.size * 1.4);

      // Recall: how much of the disease profile is accounted for
      const diseaseRecall = maxPossibleDiseaseScore > 0 ? rawMatchScore / maxPossibleDiseaseScore : 0;

      // Precision: proportion of entered symptoms that fit this disease
      const userCoverage = totalMatches / selectedSet.size;

      // Hallmark symptom presence boost
      let hallmarkBonus = 1.0;
      if (primarySet.size > 0) {
        const primaryRatio = matchedPrimary.length / primarySet.size;
        if (primaryRatio >= 0.75) hallmarkBonus = 1.25;
        else if (primaryRatio >= 0.5) hallmarkBonus = 1.12;
      }

      // F-score synthesis (giving slightly more weight to recall)
      const beta = 1.2;
      let fScore = 0;
      if ((beta * beta * (1 - userCoverage) + diseaseRecall) > 0) {
        fScore = ((1 + beta * beta) * userCoverage * diseaseRecall) / ((beta * beta * userCoverage) + diseaseRecall);
      }

      // Final confidence calculation (bounded 12% - 98.5%)
      let confidence = fScore * hallmarkBonus * 100;
      confidence = Math.min(98.5, Math.max(12.0, confidence));

      const isEmergency = disease.severity === 'High' || disease.severity === 'Critical / Emergency' || disease.urgency_level === 'Immediate Emergency Care';

      // Find hallmark symptoms not selected
      const unmatchedHallmarks = [...primarySet]
        .filter(s => !selectedSet.has(s))
        .map(s => this.symptoms[s]?.name || s);

      results.push({
        disease_id: disease.id,
        disease_name: disease.name,
        category: disease.category,
        severity: disease.severity,
        urgency_level: disease.urgency_level,
        specialist: disease.specialist,
        confidence_score: Math.round(confidence * 10) / 10,
        matched_primary_symptoms: matchedPrimary.map(s => this.symptoms[s]?.name || s),
        matched_secondary_symptoms: matchedSecondary.map(s => this.symptoms[s]?.name || s),
        total_matches: totalMatches,
        unmatched_hallmarks: unmatchedHallmarks,
        overview: disease.overview,
        detailed_explanation: disease.detailed_explanation,
        medicines: disease.medicines || [],
        remedies: disease.remedies || [],
        dietary_advice: disease.dietary_advice || { recommended: [], avoid: [] },
        lifestyle_tips: disease.lifestyle_tips || [],
        diagnostic_tests: disease.diagnostic_tests || [],
        emergency_red_flags: disease.emergency_red_flags || [],
        is_emergency: isEmergency
      });
    }

    // Sort descending by confidence score, then total matches
    results.sort((a, b) => b.confidence_score - a.confidence_score || b.total_matches - a.total_matches);
    return results;
  }
};

window.PredictionEngine = PredictionEngine;
