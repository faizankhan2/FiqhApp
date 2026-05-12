/**
 * FiqhApp — Auto-Fix / Normalize Script
 * 
 * Reads JSON files from inputs/ and fixes common issues that
 * Gemini (or NotebookLM) might produce — enum drift, spelling
 * inconsistencies, structural problems.
 * 
 * Usage:
 *   node normalize.js              ← fixes all files in inputs/
 *   node normalize.js myfile.json  ← fixes a specific file
 * 
 * Non-destructive: overwrites the file in-place with the fixed version.
 */

const path = require('path');
const fs = require('fs');

const inputsDir = path.resolve(__dirname, '../inputs');

// ── Mapping Tables ─────────────────────────────────────────────────

const PHASE_FIXES = {
  'preparation': 'Foundations',
  'pre-requisite': 'Requirements',
  'prerequisite': 'Requirements',
  'pre-requisites': 'Requirements',
  'prerequisites': 'Requirements',
  'conditions': 'Requirements',
  'action': 'Execution',
  'method': 'Execution',
  'steps': 'Execution',
  'performance': 'Execution',
  'invalidators': 'Boundaries',
  'nullifiers': 'Boundaries',
  'breakers': 'Boundaries',
  'disliked acts': 'Boundaries',
  'dispensations': 'Concessions',
  'exemptions': 'Concessions',
  'ease': 'Concessions',
  'etiquettes': 'Excellence',
  'sunnahs': 'Excellence',
  'recommended': 'Excellence',
  'adab': 'Excellence',
  'virtues': 'Excellence',
};

const CLASSIFICATION_FIXES = {
  'fard': 'Obligatory',
  'wajib': 'Obligatory',
  'mandatory': 'Obligatory',
  'rukn': 'Pillar',
  'integral': 'Pillar',
  'sunnah': 'Recommended',
  'mustahab': 'Recommended',
  'mandub': 'Recommended',
  'mubah': 'Permissible',
  'halal': 'Permissible',
  'makruh': 'Disliked',
  'haram': 'Forbidden',
  'prohibited': 'Forbidden',
  'shart': 'Condition',
  'prerequisite': 'Condition',
  'sabab': 'Trigger',
  'cause': 'Trigger',
  'mani': 'Impediment',
  'obstacle': 'Impediment',
  'mufsid': 'Invalidator',
  'nullifier': 'Invalidator',
  'breaker': 'Invalidator',
  'rukhsah': 'Concession',
  'dispensation': 'Concession',
  'exemption': 'Concession',
};

const MADHHAB_FIXES = {
  'hanafi': 'Hanafi',
  'maliki': 'Maliki',
  'shafii': "Shafi'i",
  "shafi'i": "Shafi'i",
  'shafi': "Shafi'i",
  'shafiee': "Shafi'i",
  'hanbali': 'Hanbali',
};

const VALID_PHASES = ['Foundations', 'Requirements', 'Execution', 'Boundaries', 'Concessions', 'Excellence'];
const VALID_CLASSIFICATIONS = ['Obligatory', 'Pillar', 'Recommended', 'Permissible', 'Disliked', 'Forbidden', 'Condition', 'Trigger', 'Impediment', 'Invalidator', 'Concession'];
const VALID_MADHHABS = ['Hanafi', 'Maliki', "Shafi'i", 'Hanbali'];
const VALID_GENDERS = ['Male', 'Female', 'All'];

// ── Fix Functions ──────────────────────────────────────────────────

function fixPhase(value) {
  if (!value) return null;
  if (VALID_PHASES.includes(value)) return value;
  const lower = value.toLowerCase().trim();
  if (PHASE_FIXES[lower]) return PHASE_FIXES[lower];
  // Partial match
  for (const [key, fix] of Object.entries(PHASE_FIXES)) {
    if (lower.includes(key)) return fix;
  }
  return value; // Return as-is, validator will catch it
}

function fixClassification(value) {
  if (!value) return null;
  if (VALID_CLASSIFICATIONS.includes(value)) return value;
  const lower = value.toLowerCase().trim();
  if (CLASSIFICATION_FIXES[lower]) return CLASSIFICATION_FIXES[lower];
  for (const [key, fix] of Object.entries(CLASSIFICATION_FIXES)) {
    if (lower.includes(key)) return fix;
  }
  return value;
}

function fixMadhhab(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(m => {
    if (VALID_MADHHABS.includes(m)) return m;
    const lower = m.toLowerCase().trim();
    return MADHHAB_FIXES[lower] || m;
  });
}

function fixGender(arr) {
  if (!Array.isArray(arr)) return ['All'];
  return arr.map(g => {
    if (VALID_GENDERS.includes(g)) return g;
    const lower = g.toLowerCase().trim();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    return 'All';
  });
}

function fixRecord(record) {
  const fixed = { ...record };

  // Fix enums
  if (fixed.ritual_phase) fixed.ritual_phase = fixPhase(fixed.ritual_phase);
  if (fixed.action_classification) fixed.action_classification = fixClassification(fixed.action_classification);
  if (fixed.madhhab_applicability) fixed.madhhab_applicability = fixMadhhab(fixed.madhhab_applicability);
  if (fixed.gender_applicability) fixed.gender_applicability = fixGender(fixed.gender_applicability);

  // Fix legacy field name: "action" → "action_classification"
  if (fixed.action && !fixed.action_classification) {
    fixed.action_classification = fixClassification(fixed.action);
    delete fixed.action;
  }

  // Ensure actionable_steps is null (not empty array) for non-Execution phases
  if (fixed.ritual_phase !== 'Execution' && fixed.ritual_phase !== 'Excellence') {
    if (Array.isArray(fixed.actionable_steps) && fixed.actionable_steps.length === 0) {
      fixed.actionable_steps = null;
    }
  }

  // Ensure nullable fields are null not empty string
  if (fixed.quran_hadith_evidence === '') fixed.quran_hadith_evidence = null;
  if (fixed.spiritual_wisdom === '') fixed.spiritual_wisdom = null;

  // Fix double quotes inside evidence strings (replace with single quotes)
  if (fixed.quran_hadith_evidence && typeof fixed.quran_hadith_evidence === 'string') {
    // Only fix inner quotes, not the string boundaries
    fixed.quran_hadith_evidence = fixed.quran_hadith_evidence.replace(/"/g, "'");
  }

  // Ensure scenario_tags is an array
  if (!Array.isArray(fixed.scenario_tags)) {
    fixed.scenario_tags = [];
  }

  // Ensure ui_icon_concept is short (1-3 words)
  if (fixed.ui_icon_concept && fixed.ui_icon_concept.split(' ').length > 4) {
    fixed.ui_icon_concept = fixed.ui_icon_concept.split(' ').slice(0, 2).join(' ');
  }

  return fixed;
}

// ── File Processing ────────────────────────────────────────────────

function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip debug files
  if (fileName.startsWith('_debug')) return;

  console.log(`\n🔧 Normalizing: ${fileName}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8').trim();

    // Strip markdown fencing if present
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      console.error(`   ❌ Not a JSON array, skipping.`);
      return;
    }

    let fixCount = 0;
    const normalized = data.map((record, i) => {
      const fixed = fixRecord(record);
      // Count changes
      if (JSON.stringify(fixed) !== JSON.stringify(record)) fixCount++;
      return fixed;
    });

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf8');
    console.log(`   ✅ ${data.length} records processed, ${fixCount} auto-fixed.`);

  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
  const specificFile = process.argv[2];

  if (specificFile) {
    const filePath = path.resolve(inputsDir, specificFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    processFile(filePath);
  } else {
    if (!fs.existsSync(inputsDir)) {
      console.error(`❌ Inputs directory not found: ${inputsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(inputsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('No JSON files in inputs/. Nothing to normalize.');
      return;
    }

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   NORMALIZE — Auto-Fix Pipeline             ║');
    console.log('╚══════════════════════════════════════════════╝');

    files.forEach(f => processFile(path.join(inputsDir, f)));

    console.log('\n✅ Normalization complete. Run: node quality_check.js');
  }
}

main();
