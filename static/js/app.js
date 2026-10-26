/**
 * Modern Disease Prediction System - Main Application Logic
 * Interactive UI, Search Autocomplete, Prediction Engine, Encyclopedia, Theme Management
 */

(function () {
  'use strict';

  // Application State
  const state = {
    selectedSymptoms: new Set(),
    activeCategory: 'all',
    allDiseases: [],
    allSymptoms: {},
    currentPredictions: [],
    activeView: 'prediction-view',
    activeTab: 'overview-tab',
    theme: localStorage.getItem('health_app_theme') || 'light'
  };

  // Pre-configured Quick Symptom Presets for Fast User Testing
  const SYMPTOM_PRESETS = {
    flu: {
      name: 'Flu-like',
      symptoms: ['high_fever', 'severe_body_aches', 'extreme_fatigue', 'dry_cough', 'chills']
    },
    cold: {
      name: 'Common Cold',
      symptoms: ['runny_nose', 'sneezing', 'nasal_congestion', 'sore_throat']
    },
    food_poisoning: {
      name: 'Food Poisoning',
      symptoms: ['watery_diarrhea', 'nausea', 'vomiting', 'abdominal_cramps']
    },
    migraine: {
      name: 'Migraine Attack',
      symptoms: ['throbbing_headache', 'sensitivity_to_light', 'sensitivity_to_sound', 'nausea']
    },
    asthma: {
      name: 'Asthma Flare',
      symptoms: ['wheezing', 'shortness_of_breath', 'chest_tightness', 'coughing_at_night']
    },
    acid_reflux: {
      name: 'Acid Reflux / GERD',
      symptoms: ['heartburn', 'acid_regurgitation', 'chest_discomfort', 'difficulty_swallowing']
    },
    kidney_stone: {
      name: 'Kidney Stone Colic',
      symptoms: ['severe_sharp_flank_pain', 'pain_radiating_to_groin', 'blood_in_urine']
    },
    shingles: {
      name: 'Shingles Rash',
      symptoms: ['unilateral_band_of_blistering_rash', 'burning_tingling_nerve_pain', 'extreme_skin_sensitivity_to_touch']
    }
  };

  // DOM Elements
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    symptomInput: document.getElementById('symptomInput'),
    suggestionsDropdown: document.getElementById('suggestionsDropdown'),
    categoryFilterBar: document.getElementById('categoryFilterBar'),
    presetButtonsContainer: document.getElementById('presetButtonsContainer'),
    selectedChipsGrid: document.getElementById('selectedChipsGrid'),
    selectedCountBadge: document.getElementById('selectedCountBadge'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    predictBtn: document.getElementById('predictBtn'),
    resultsContainer: document.getElementById('resultsContainer'),
    resultsEmptyState: document.getElementById('resultsEmptyState'),
    navPrediction: document.getElementById('navPrediction'),
    navDirectory: document.getElementById('navDirectory'),
    predictionView: document.getElementById('predictionView'),
    directoryView: document.getElementById('directoryView'),
    directorySearchInput: document.getElementById('directorySearchInput'),
    directoryCategoryFilter: document.getElementById('directoryCategoryFilter'),
    directoryGrid: document.getElementById('directoryGrid'),
    emergencyModal: document.getElementById('emergencyModal'),
    diseaseDetailModal: document.getElementById('diseaseDetailModal'),
    modalBodyContent: document.getElementById('modalBodyContent'),
    modalDiseaseTitle: document.getElementById('modalDiseaseTitle')
  };

  // Initialize App
  async function initApp() {
    initTheme();
    await loadInitialData();
    setupEventListeners();
    renderPresets();
    renderCategoryFilters();
    renderDirectory();
  }

  // Theme Handling
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('health_app_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!elements.themeIcon) return;
    if (state.theme === 'dark') {
      elements.themeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    } else {
      elements.themeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  // Load Database
  async function loadInitialData() {
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('/data/diseases.json').catch(() => fetch('data/diseases.json')),
        fetch('/data/symptoms.json').catch(() => fetch('data/symptoms.json'))
      ]);

      if (dRes && dRes.ok && sRes && sRes.ok) {
        state.allDiseases = await dRes.json();
        state.allSymptoms = await sRes.json();
      }
    } catch (e) {
      console.warn("API/Fetch load failed, falling back to embedded bundle:", e);
    }

    // Fallback to embedded global bundle if fetch didn't succeed (e.g. file:// protocol)
    if ((!state.allDiseases || state.allDiseases.length === 0) && window.INITIAL_DISEASES) {
      state.allDiseases = window.INITIAL_DISEASES;
      state.allSymptoms = window.INITIAL_SYMPTOMS || {};
    }

    if (window.PredictionEngine) {
      await window.PredictionEngine.init(state.allDiseases, state.allSymptoms);
    }
  }

  // Event Listeners
  function setupEventListeners() {
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Navigation Tab Switching
    if (elements.navPrediction && elements.navDirectory) {
      elements.navPrediction.addEventListener('click', () => switchView('prediction-view'));
      elements.navDirectory.addEventListener('click', () => switchView('directory-view'));
    }

    // Symptom Search input
    if (elements.symptomInput) {
      elements.symptomInput.addEventListener('input', handleSymptomInput);
      elements.symptomInput.addEventListener('focus', handleSymptomInput);
      elements.symptomInput.addEventListener('keydown', handleSearchKeydown);
    }

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (elements.suggestionsDropdown && !e.target.closest('.symptom-search-box')) {
        elements.suggestionsDropdown.style.display = 'none';
      }
    });

    // Clear All
    if (elements.clearAllBtn) {
      elements.clearAllBtn.addEventListener('click', clearAllSymptoms);
    }

    // Predict Button
    if (elements.predictBtn) {
      elements.predictBtn.addEventListener('click', runPrediction);
    }

    // Directory Search & Filter
    if (elements.directorySearchInput) {
      elements.directorySearchInput.addEventListener('input', renderDirectory);
    }
    if (elements.directoryCategoryFilter) {
      elements.directoryCategoryFilter.addEventListener('change', renderDirectory);
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
          closeModals();
        }
      });
    });

    // Emergency Pill Button
    const emergencyPills = document.querySelectorAll('.emergency-pill');
    emergencyPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (elements.emergencyModal) {
          elements.emergencyModal.classList.add('active-modal');
        }
      });
    });
  }

  function switchView(viewName) {
    state.activeView = viewName;
    if (viewName === 'prediction-view') {
      elements.predictionView.classList.add('active-view');
      elements.directoryView.classList.remove('active-view');
      elements.navPrediction.classList.add('active');
      elements.navDirectory.classList.remove('active');
    } else {
      elements.predictionView.classList.remove('active-view');
      elements.directoryView.classList.add('active-view');
      elements.navPrediction.classList.remove('active');
      elements.navDirectory.classList.add('active');
      renderDirectory();
    }
  }

  function closeModals() {
    if (elements.emergencyModal) elements.emergencyModal.classList.remove('active-modal');
    if (elements.diseaseDetailModal) elements.diseaseDetailModal.classList.remove('active-modal');
  }

  // Symptom Autocomplete & Selection
  function handleSymptomInput(e) {
    const query = (e.target.value || '').trim().toLowerCase();
    const dropdown = elements.suggestionsDropdown;
    if (!dropdown) return;

    if (!query && state.activeCategory === 'all') {
      dropdown.style.display = 'none';
      return;
    }

    const matches = Object.entries(state.allSymptoms).filter(([key, data]) => {
      // Filter out already selected
      if (state.selectedSymptoms.has(key)) return false;

      // Category filter
      if (state.activeCategory !== 'all' && data.category?.toLowerCase() !== state.activeCategory.toLowerCase()) {
        return false;
      }

      if (!query) return true;

      const nameMatch = data.name.toLowerCase().includes(query);
      const descMatch = (data.description || '').toLowerCase().includes(query);
      return nameMatch || descMatch;
    });

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="suggestion-item" style="color:var(--text-muted); cursor:default;">No matching symptoms found</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = matches.slice(0, 10).map(([key, data]) => `
      <div class="suggestion-item" data-key="${key}">
        <div>
          <strong>${highlightMatch(data.name, query)}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(data.description || '')}</div>
        </div>
        <span class="suggestion-category">${escapeHtml(data.category || 'General')}</span>
      </div>
    `).join('');

    dropdown.style.display = 'block';

    // Click handler for suggestion items
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.getAttribute('data-key');
        if (key) {
          selectSymptom(key);
          elements.symptomInput.value = '';
          dropdown.style.display = 'none';
          elements.symptomInput.focus();
        }
      });
    });
  }

  function handleSearchKeydown(e) {
    const dropdown = elements.suggestionsDropdown;
    if (!dropdown || dropdown.style.display !== 'block') return;

    const items = dropdown.querySelectorAll('.suggestion-item[data-key]');
    if (!items.length) return;

    let highlighted = dropdown.querySelector('.suggestion-item.highlighted');
    let index = Array.from(items).indexOf(highlighted);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) {
        if (highlighted) highlighted.classList.remove('highlighted');
        items[index + 1].classList.add('highlighted');
        items[index + 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        if (highlighted) highlighted.classList.remove('highlighted');
        items[index - 1].classList.add('highlighted');
        items[index - 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted) {
        highlighted.click();
      } else if (items.length > 0) {
        items[0].click();
      }
    }
  }

  function selectSymptom(key) {
    if (state.selectedSymptoms.has(key)) return;
    state.selectedSymptoms.add(key);
    updateSelectedChips();
  }

  function removeSymptom(key) {
    state.selectedSymptoms.delete(key);
    updateSelectedChips();
  }

  function clearAllSymptoms() {
    state.selectedSymptoms.clear();
    updateSelectedChips();
    // Reset results if cleared
    if (elements.resultsContainer) elements.resultsContainer.innerHTML = '';
    if (elements.resultsEmptyState) elements.resultsEmptyState.style.display = 'block';
  }

  function updateSelectedChips() {
    const container = elements.selectedChipsGrid;
    const countBadge = elements.selectedCountBadge;
    const predictBtn = elements.predictBtn;

    const count = state.selectedSymptoms.size;
    if (countBadge) countBadge.textContent = count;
    if (predictBtn) predictBtn.disabled = count === 0;

    if (!container) return;

    if (count === 0) {
      container.innerHTML = `<div class="empty-placeholder">Select symptoms above to begin assessment</div>`;
      return;
    }

    container.innerHTML = Array.from(state.selectedSymptoms).map(key => {
      const sym = state.allSymptoms[key] || { name: key };
      return `
        <div class="symptom-chip" data-key="${key}">
          <span>${escapeHtml(sym.name)}</span>
          <span class="chip-remove" title="Remove symptom" onclick="window.healthAppRemoveSymptom('${key}')">&times;</span>
        </div>
      `;
    }).join('');
  }

  // Global helper for onclick inside template literal
  window.healthAppRemoveSymptom = removeSymptom;

  // Render Presets
  function renderPresets() {
    const container = elements.presetButtonsContainer;
    if (!container) return;

    container.innerHTML = Object.entries(SYMPTOM_PRESETS).map(([id, p]) => `
      <button type="button" class="preset-btn" data-preset="${id}">
        + ${escapeHtml(p.name)}
      </button>
    `).join('');

    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-preset');
        const preset = SYMPTOM_PRESETS[presetId];
        if (preset) {
          preset.symptoms.forEach(s => state.selectedSymptoms.add(s));
          updateSelectedChips();
          runPrediction();
        }
      });
    });
  }

  // Render Category Filter Chips
  function renderCategoryFilters() {
    const bar = elements.categoryFilterBar;
    if (!bar) return;

    const categories = ['All', 'Respiratory', 'General', 'Gastrointestinal', 'Neurological', 'Dermatological', 'Urinary', 'Musculoskeletal', 'Eye/ENT', 'Endocrine'];

    bar.innerHTML = categories.map(c => `
      <button type="button" class="filter-chip ${c.toLowerCase() === state.activeCategory ? 'active' : ''}" data-cat="${c.toLowerCase()}">
        ${c}
      </button>
    `).join('');

    bar.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        bar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        chip.classList.add('active');
        state.activeCategory = chip.getAttribute('data-cat');
        // trigger input search if open
        handleSymptomInput({ target: elements.symptomInput });
      });
    });
  }

  // Prediction Pipeline
  async function runPrediction() {
    const symptoms = Array.from(state.selectedSymptoms);
    if (!symptoms.length) return;

    // Loading State
    if (elements.predictBtn) {
      elements.predictBtn.disabled = true;
      elements.predictBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
        Analyzing Symptoms...
      `;
    }

    let predictions = [];

    // Attempt Server API first
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms,
          severity: document.getElementById('patientSeverity')?.value || 'moderate',
          duration_days: parseInt(document.getElementById('patientDuration')?.value) || 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        predictions = data.predictions || [];
      } else {
        throw new Error('API server returned error');
      }
    } catch (err) {
      // Offline fallback: Use PredictionEngine
      console.log('Using client-side prediction engine fallback:', err.message);
      if (window.PredictionEngine) {
        predictions = window.PredictionEngine.predict(symptoms);
      }
    }

    state.currentPredictions = predictions;

    // Render results
    renderPredictionResults(predictions);

    if (elements.predictBtn) {
      elements.predictBtn.disabled = false;
      elements.predictBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        Predict Disease & Remedies
      `;
    }
  }

  // Render Prediction Results
  function renderPredictionResults(predictions) {
    const container = elements.resultsContainer;
    const emptyState = elements.resultsEmptyState;

    if (!predictions || predictions.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <h3>No Strong Diagnostic Match Found</h3>
          <p>The combination of symptoms entered did not match common clinical profiles. Please consult a qualified physician for a comprehensive diagnostic assessment.</p>
        `;
      }
      if (container) container.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const topMatch = predictions[0];
    const differentials = predictions.slice(1, 5);

    let html = `
      <!-- Top Primary Disease Match -->
      <div class="top-match-card">
        <div class="top-match-header">
          <div>
            <div class="top-match-badge-wrap">
              <span class="match-rank-badge">Primary Match</span>
              <span class="severity-badge ${getSeverityClass(topMatch.severity)}">${escapeHtml(topMatch.severity)} Severity</span>
            </div>
            <h2 class="disease-main-title">${escapeHtml(topMatch.disease_name)}</h2>
            <div class="disease-category-tag">${escapeHtml(topMatch.category)} System &bull; Urgency: <strong>${escapeHtml(topMatch.urgency_level)}</strong></div>
          </div>
          <div class="confidence-box">
            <div class="confidence-val">${topMatch.confidence_score}%</div>
            <div class="confidence-label">Confidence</div>
            <div class="confidence-bar-bg">
              <div class="confidence-bar-fill" style="width: ${topMatch.confidence_score}%"></div>
            </div>
          </div>
        </div>

        <div class="top-match-body">
          <p class="overview-text">${escapeHtml(topMatch.overview)}</p>

          <!-- Triage recommendation & specialist -->
          <div class="triage-recommendation">
            <div class="triage-specialist">
              Recommended Specialist: <strong>${escapeHtml(topMatch.specialist)}</strong>
            </div>
            <div>
              Status: <span style="font-weight:700;">${escapeHtml(topMatch.urgency_level)}</span>
            </div>
          </div>

          <!-- Matched Symptoms -->
          <div class="matched-symptoms-section">
            <div class="matched-symptoms-label">Matching Symptoms Detected (${topMatch.total_matches})</div>
            <div class="matched-pills">
              ${topMatch.matched_primary_symptoms.map(s => `<span class="match-pill">&#10003; ${escapeHtml(s)} (Primary)</span>`).join('')}
              ${topMatch.matched_secondary_symptoms.map(s => `<span class="match-pill">&#10003; ${escapeHtml(s)}</span>`).join('')}
              ${topMatch.unmatched_hallmarks.slice(0, 3).map(s => `<span class="unmatched-pill">Typical: ${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>

          <!-- Tab Navigation for In-Depth Information -->
          <div class="details-tabs">
            <button type="button" class="detail-tab-btn active-tab" data-tab="tab-overview">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Overview & Causes
            </button>
            <button type="button" class="detail-tab-btn" data-tab="tab-medicines">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              Suggested Medicines (${topMatch.medicines.length})
            </button>
            <button type="button" class="detail-tab-btn" data-tab="tab-remedies">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 11a9 9 0 0 1 9-9z"/><path d="M12 12c-2 0-3-1-3-3s2-3 3-3 3 1 3 3-1 3-3 3z"/></svg>
              Home Remedies (${topMatch.remedies.length})
            </button>
            <button type="button" class="detail-tab-btn" data-tab="tab-diet">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              Diet & Lifestyle
            </button>
            <button type="button" class="detail-tab-btn" data-tab="tab-redflags">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              When to Seek Doctor
            </button>
          </div>

          <!-- Tab Content: Overview -->
          <div class="tab-panel active-panel" id="tab-overview">
            <p style="font-size:0.9rem; margin-bottom:1rem; line-height:1.6;">${escapeHtml(topMatch.detailed_explanation)}</p>
            ${topMatch.diagnostic_tests && topMatch.diagnostic_tests.length ? `
              <div style="background:var(--bg-tertiary); padding:0.85rem; border-radius:var(--radius-md); font-size:0.85rem;">
                <strong>Standard Diagnostic Tests:</strong> ${escapeHtml(topMatch.diagnostic_tests.join(', '))}
              </div>
            ` : ''}
          </div>

          <!-- Tab Content: Medicines -->
          <div class="tab-panel" id="tab-medicines">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
              <strong>Note:</strong> Over-The-Counter (OTC) medicines provide symptomatic relief. Prescription drugs must be prescribed by a licensed physician.
            </div>
            <div class="medicine-grid">
              ${topMatch.medicines.map(med => `
                <div class="medicine-card">
                  <div class="med-header">
                    <span class="med-name">${escapeHtml(med.name)}</span>
                    <span class="med-type-badge ${med.type === 'OTC' ? 'med-type-otc' : 'med-type-prescription'}">${escapeHtml(med.type)}</span>
                  </div>
                  <div class="med-purpose">${escapeHtml(med.purpose)}</div>
                  <div class="med-instructions"><strong>Usage:</strong> ${escapeHtml(med.instructions)}</div>
                  ${med.precautions ? `
                    <div class="med-precautions">
                      <strong>Caution:</strong> ${escapeHtml(med.precautions)}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tab Content: Remedies -->
          <div class="tab-panel" id="tab-remedies">
            <div class="remedy-list">
              ${topMatch.remedies.map(rem => `
                <div class="remedy-item">
                  <div class="remedy-name">&#9832; ${escapeHtml(rem.name)}</div>
                  <div class="remedy-desc">${escapeHtml(rem.description)}</div>
                  <div class="remedy-benefit"><strong>Clinical Benefit:</strong> ${escapeHtml(rem.benefit)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tab Content: Diet & Lifestyle -->
          <div class="tab-panel" id="tab-diet">
            <div class="diet-grid">
              <div class="diet-col diet-recommended">
                <h4>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Recommended Foods & Drinks
                </h4>
                <ul class="diet-list">
                  ${(topMatch.dietary_advice?.recommended || []).map(d => `<li>&bull; ${escapeHtml(d)}</li>`).join('')}
                </ul>
              </div>
              <div class="diet-col diet-avoid">
                <h4>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Foods & Habits to Avoid
                </h4>
                <ul class="diet-list">
                  ${(topMatch.dietary_advice?.avoid || []).map(d => `<li>&bull; ${escapeHtml(d)}</li>`).join('')}
                </ul>
              </div>
            </div>

            ${topMatch.lifestyle_tips && topMatch.lifestyle_tips.length ? `
              <div style="margin-top:1rem; padding:0.85rem; background:var(--bg-tertiary); border-radius:var(--radius-md);">
                <strong style="font-size:0.85rem; display:block; margin-bottom:0.4rem;">Lifestyle & Daily Care Tips:</strong>
                <ul style="font-size:0.82rem; padding-left:1.2rem; color:var(--text-secondary);">
                  ${topMatch.lifestyle_tips.map(tip => `<li style="margin-bottom:0.25rem;">${escapeHtml(tip)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Tab Content: Red Flags -->
          <div class="tab-panel" id="tab-redflags">
            <div class="red-flags-box">
              <div class="red-flags-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Emergency Red Flags (Seek Immediate Medical Care)
              </div>
              <ul class="red-flags-list">
                ${(topMatch.emergency_red_flags || []).map(rf => `
                  <li>
                    <svg width="16" height="16" color="var(--danger)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>${escapeHtml(rf)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Action Bar: Print & Save -->
          <div class="card-actions-bar">
            <button type="button" class="action-btn-outline" onclick="window.print()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / Save PDF Report
            </button>
            <button type="button" class="action-btn-outline" onclick="window.healthAppOpenModal('${topMatch.disease_id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Full Disease Profile
            </button>
          </div>
        </div>
      </div>

      <!-- Differential Diagnoses Section -->
      ${differentials.length > 0 ? `
        <div class="differential-section">
          <div class="differential-header">
            <span>Differential Diagnoses (Alternative Possibilities)</span>
            <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">Click to inspect details</span>
          </div>
          <div class="differential-list">
            ${differentials.map(diff => `
              <div class="diff-card" onclick="window.healthAppOpenModal('${diff.disease_id}')">
                <div class="diff-left">
                  <div class="diff-title">${escapeHtml(diff.disease_name)}</div>
                  <div class="diff-meta">
                    <span class="severity-badge ${getSeverityClass(diff.severity)}" style="font-size:0.68rem; padding:0.1rem 0.4rem;">${escapeHtml(diff.severity)}</span>
                    &bull; Specialist: ${escapeHtml(diff.specialist)}
                    &bull; Matched ${diff.total_matches} symptom(s)
                  </div>
                </div>
                <div class="diff-right">
                  <div class="diff-confidence">${diff.confidence_score}%</div>
                  <div style="font-size:0.7rem; color:var(--text-muted);">Confidence</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    container.innerHTML = html;

    // Attach Tab Navigation Handlers
    container.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabTarget = btn.getAttribute('data-tab');
        container.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active-tab'));
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active-panel'));

        btn.classList.add('active-tab');
        const targetPanel = container.querySelector(`#${tabTarget}`);
        if (targetPanel) targetPanel.classList.add('active-panel');
      });
    });

    // Smooth scroll down to results
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Disease Directory / Encyclopedia View
  function renderDirectory() {
    const grid = elements.directoryGrid;
    if (!grid) return;

    const search = (elements.directorySearchInput?.value || '').trim().toLowerCase();
    const cat = (elements.directoryCategoryFilter?.value || 'all').toLowerCase();

    const filtered = state.allDiseases.filter(d => {
      if (cat !== 'all' && d.category.toLowerCase() !== cat) return false;
      if (!search) return true;
      return d.name.toLowerCase().includes(search) ||
             d.overview.toLowerCase().includes(search) ||
             (d.primary_symptoms || []).some(s => s.toLowerCase().includes(search));
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">No diseases found matching criteria</div>`;
      return;
    }

    grid.innerHTML = filtered.map(d => `
      <div class="disease-card" onclick="window.healthAppOpenModal('${d.id}')">
        <div class="disease-card-header">
          <span class="severity-badge ${getSeverityClass(d.severity)}">${escapeHtml(d.severity)}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(d.category)}</span>
        </div>
        <div class="disease-card-title">${escapeHtml(d.name)}</div>
        <div class="disease-card-desc">${escapeHtml(d.overview)}</div>
        <div class="disease-card-footer">
          <span>${d.medicines?.length || 0} Medicines &bull; ${d.remedies?.length || 0} Remedies</span>
          <span>View Details &rarr;</span>
        </div>
      </div>
    `).join('');
  }

  // Open Full Disease Profile Modal
  function openDiseaseModal(diseaseId) {
    const disease = state.allDiseases.find(d => d.id === diseaseId);
    if (!disease || !elements.diseaseDetailModal) return;

    elements.modalDiseaseTitle.textContent = disease.name;
    elements.modalBodyContent.innerHTML = `
      <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap;">
        <span class="severity-badge ${getSeverityClass(disease.severity)}">${escapeHtml(disease.severity)} Severity</span>
        <span style="font-size:0.8rem; background:var(--bg-tertiary); padding:0.2rem 0.6rem; border-radius:var(--radius-full);">
          ${escapeHtml(disease.category)}
        </span>
        <span style="font-size:0.8rem; color:var(--text-muted);">
          Urgency: <strong>${escapeHtml(disease.urgency_level)}</strong>
        </span>
      </div>

      <div style="font-size:0.95rem; line-height:1.6; margin-bottom:1.25rem;">
        <strong>Clinical Overview:</strong>
        <p style="margin-top:0.35rem; color:var(--text-secondary);">${escapeHtml(disease.detailed_explanation)}</p>
      </div>

      <div style="margin-bottom:1.25rem;">
        <strong style="font-size:0.9rem; display:block; margin-bottom:0.5rem;">Key Primary Symptoms:</strong>
        <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
          ${(disease.primary_symptoms || []).map(s => `<span class="match-pill" style="background:var(--bg-tertiary); color:var(--text-primary); border-color:var(--border-color);">${escapeHtml(state.allSymptoms[s]?.name || s)}</span>`).join('')}
        </div>
      </div>

      <!-- Medicines -->
      <div style="margin-bottom:1.5rem;">
        <strong style="font-size:0.95rem; display:block; margin-bottom:0.75rem;">💊 Recommended Medications:</strong>
        <div class="medicine-grid">
          ${(disease.medicines || []).map(m => `
            <div class="medicine-card">
              <div class="med-header">
                <span class="med-name">${escapeHtml(m.name)}</span>
                <span class="med-type-badge ${m.type === 'OTC' ? 'med-type-otc' : 'med-type-prescription'}">${escapeHtml(m.type)}</span>
              </div>
              <div class="med-purpose">${escapeHtml(m.purpose)}</div>
              <div class="med-instructions"><strong>Dose:</strong> ${escapeHtml(m.instructions)}</div>
              ${m.precautions ? `<div class="med-precautions"><strong>Caution:</strong> ${escapeHtml(m.precautions)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Remedies -->
      <div style="margin-bottom:1.5rem;">
        <strong style="font-size:0.95rem; display:block; margin-bottom:0.75rem;">🌿 Evidence-Based Home Remedies:</strong>
        <div class="remedy-list">
          ${(disease.remedies || []).map(r => `
            <div class="remedy-item">
              <div class="remedy-name">&#9832; ${escapeHtml(r.name)}</div>
              <div class="remedy-desc">${escapeHtml(r.description)}</div>
              <div class="remedy-benefit"><strong>Benefit:</strong> ${escapeHtml(r.benefit)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Red Flags -->
      ${disease.emergency_red_flags && disease.emergency_red_flags.length ? `
        <div class="red-flags-box">
          <div class="red-flags-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            When to Seek Immediate Emergency Attention:
          </div>
          <ul class="red-flags-list">
            ${disease.emergency_red_flags.map(f => `<li>&bull; ${escapeHtml(f)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    elements.diseaseDetailModal.classList.add('active-modal');
  }

  window.healthAppOpenModal = openDiseaseModal;

  // Utility Functions
  function getSeverityClass(severity) {
    if (!severity) return 'severity-mild';
    const s = severity.toLowerCase();
    if (s.includes('critical') || s.includes('emergency')) return 'severity-critical';
    if (s.includes('high')) return 'severity-high';
    if (s.includes('moderate')) return 'severity-moderate';
    return 'severity-mild';
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHtml(text).replace(regex, '<span style="color:var(--brand-primary); text-decoration:underline;">$1</span>');
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
