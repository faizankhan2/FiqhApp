/**
 * FiqhApp — Quality Check / Coverage Report
 * 
 * Analyzes JSON files in inputs/ and reports on:
 * - Schema compliance (will it pass the validator?)
 * - Phase coverage (are all 6 phases represented?)
 * - Duplicate detection
 * - Classification distribution
 * - Source traceability
 * 
 * Usage:
 *   node quality_check.js              ← checks all files in inputs/
 *   node quality_check.js myfile.json  ← checks a specific file
 */

const path = require('path');
const fs = require('fs');
const { validateRulings } = require('./validator');

const inputsDir = path.resolve(__dirname, '../inputs');

const VALID_PHASES = ['Foundations', 'Requirements', 'Execution', 'Boundaries', 'Concessions', 'Excellence'];

// ── Analysis Functions ─────────────────────────────────────────────

function analyzeFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    return { fileName, error: `JSON parse error: ${err.message}` };
  }

  if (!Array.isArray(data)) {
    return { fileName, error: 'Not a JSON array' };
  }

  // Run validator
  const validation = validateRulings(data);

  // Phase coverage
  const phases = {};
  VALID_PHASES.forEach(p => phases[p] = 0);
  data.forEach(r => {
    if (r.ritual_phase && phases[r.ritual_phase] !== undefined) {
      phases[r.ritual_phase]++;
    }
  });

  // Classification distribution
  const classifications = {};
  data.forEach(r => {
    const c = r.action_classification || 'MISSING';
    classifications[c] = (classifications[c] || 0) + 1;
  });

  // Duplicate detection (same title + short_rule)
  const seen = new Set();
  const duplicates = [];
  data.forEach((r, i) => {
    const key = `${r.title}|||${r.short_rule}`;
    if (seen.has(key)) {
      duplicates.push({ index: i + 1, title: r.title });
    }
    seen.add(key);
  });

  // Source traceability
  const sources = new Set();
  const missingPages = [];
  data.forEach((r, i) => {
    if (r.source_book) sources.add(r.source_book);
    if (!r.volume_page || r.volume_page.trim() === '') {
      missingPages.push(i + 1);
    }
  });

  // Topic consistency
  const topics = new Set(data.map(r => r.topic));
  const modules = new Set(data.map(r => r.module));

  // Madhhab consistency
  const madhhabs = new Set();
  data.forEach(r => {
    (r.madhhab_applicability || []).forEach(m => madhhabs.add(m));
  });

  return {
    fileName,
    totalRecords: data.length,
    validation: {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      errors: validation.errors.slice(0, 5), // Show first 5
    },
    phases,
    phaseCoverage: VALID_PHASES.filter(p => phases[p] > 0).length,
    classifications,
    duplicates,
    sources: Array.from(sources),
    missingPages,
    topics: Array.from(topics),
    modules: Array.from(modules),
    madhhabs: Array.from(madhhabs),
  };
}

// ── Report Rendering ───────────────────────────────────────────────

function renderReport(analysis) {
  if (analysis.error) {
    console.log(`\n❌ ${analysis.fileName}: ${analysis.error}`);
    return;
  }

  const v = analysis.validation.isValid ? '✅ PASS' : '❌ FAIL';

  console.log(`\n┌─────────────────────────────────────────────────`);
  console.log(`│ 📄 ${analysis.fileName}`);
  console.log(`├─────────────────────────────────────────────────`);
  console.log(`│ Records: ${analysis.totalRecords} | Validation: ${v}`);
  console.log(`│ Topic(s): ${analysis.topics.join(', ')}`);
  console.log(`│ Module(s): ${analysis.modules.join(', ')}`);
  console.log(`│ Madhhab(s): ${analysis.madhhabs.join(', ')}`);
  console.log(`│ Source(s): ${analysis.sources.join(', ')}`);
  console.log(`│`);

  // Phase coverage
  console.log(`│ Phase Coverage (${analysis.phaseCoverage}/6):`);
  VALID_PHASES.forEach(p => {
    const count = analysis.phases[p];
    const icon = count > 0 ? '✅' : '⬜';
    console.log(`│   ${icon} ${p}: ${count} records`);
  });

  // Missing phases warning
  const missingPhases = VALID_PHASES.filter(p => analysis.phases[p] === 0);
  if (missingPhases.length > 0) {
    console.log(`│`);
    console.log(`│ ⚠️  Missing phases: ${missingPhases.join(', ')}`);
    console.log(`│     (Is this intentional? The book may not cover these.)`);
  }

  // Classification distribution
  console.log(`│`);
  console.log(`│ Classification Distribution:`);
  Object.entries(analysis.classifications)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cls, count]) => {
      console.log(`│   • ${cls}: ${count}`);
    });

  // Duplicates
  if (analysis.duplicates.length > 0) {
    console.log(`│`);
    console.log(`│ ⚠️  Potential Duplicates (${analysis.duplicates.length}):`);
    analysis.duplicates.forEach(d => {
      console.log(`│   Row ${d.index}: "${d.title}"`);
    });
  }

  // Missing page references
  if (analysis.missingPages.length > 0) {
    console.log(`│`);
    console.log(`│ ⚠️  Missing volume_page (${analysis.missingPages.length} records):`);
    console.log(`│   Rows: ${analysis.missingPages.slice(0, 10).join(', ')}${analysis.missingPages.length > 10 ? '...' : ''}`);
  }

  // Validation errors
  if (!analysis.validation.isValid) {
    console.log(`│`);
    console.log(`│ ❌ Validation Errors (${analysis.validation.errorCount} total, showing first 5):`);
    analysis.validation.errors.forEach(err => {
      console.log(`│   ${err}`);
    });
  }

  console.log(`└─────────────────────────────────────────────────`);
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
  const specificFile = process.argv[2];

  let files;
  if (specificFile) {
    const filePath = path.resolve(inputsDir, specificFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    if (!fs.existsSync(inputsDir)) {
      console.error(`❌ Inputs directory not found: ${inputsDir}`);
      process.exit(1);
    }
    files = fs.readdirSync(inputsDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_debug'))
      .map(f => path.join(inputsDir, f));
  }

  if (files.length === 0) {
    console.log('No JSON files in inputs/. Nothing to check.');
    return;
  }

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   QUALITY CHECK — Coverage Report           ║');
  console.log('╚══════════════════════════════════════════════╝');

  let allValid = true;
  files.forEach(f => {
    const analysis = analyzeFile(f);
    renderReport(analysis);
    if (analysis.error || !analysis.validation?.isValid) allValid = false;
  });

  // Final verdict
  console.log('\n══════════════════════════════════════════════════');
  if (allValid) {
    console.log('🎉 All files pass validation. Ready for: node ingest.js');
  } else {
    console.log('⚠️  Some files have issues. Fix them before ingesting.');
    console.log('   Tip: Run "node normalize.js" first to auto-fix common problems.');
  }
  console.log('══════════════════════════════════════════════════');
}

main();
