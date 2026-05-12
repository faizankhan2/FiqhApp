/**
 * FiqhApp — Automated Book Extraction Pipeline (Phase-by-Phase)
 * 
 * Extracts structured fiqh rulings from PDF books using Google Gemini API.
 * Uses phase-by-phase extraction for higher accuracy:
 *   - Each ritual phase gets its own focused API call
 *   - Results are merged into a single output file
 *   - Prevents misclassification across phases
 * 
 * Usage:
 *   node extract.js --book "ascent-to-felicity" --topic "Ablution (Wudu)"
 *   node extract.js --book all --topic "Ablution (Wudu)"
 *   node extract.js --book "ascent-to-felicity" --topic all
 *   node extract.js --book all --topic all
 * 
 * Requirements:
 *   - GEMINI_API_KEY in root .env file
 *   - PDF books in ../../Fiqhbooks/
 *   - topics.json and books.json in this directory
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Configuration ──────────────────────────────────────────────────

const API_KEYS = [];
if (process.env.GEMINI_API_KEY) API_KEYS.push(process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY2) API_KEYS.push(process.env.GEMINI_API_KEY2);
if (process.env.GEMINI_API_KEY3) API_KEYS.push(process.env.GEMINI_API_KEY3);

if (API_KEYS.length === 0) {
  console.error('❌ No GEMINI_API_KEY found in .env file.');
  console.error('   Set GEMINI_API_KEY (and optionally GEMINI_API_KEY2, GEMINI_API_KEY3) in your .env');
  process.exit(1);
}

let currentKeyIndex = 0;

function getGenAI() {
  return new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
}

function rotateKey() {
  const oldIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  if (currentKeyIndex === oldIndex) return false;
  if (currentKeyIndex === 0 && oldIndex === API_KEYS.length - 1) return false;
  console.log(`   🔄 Rotating to API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
  return true;
}

const booksDir = path.resolve(__dirname, '../../Fiqhbooks');
const outputDir = path.resolve(__dirname, '../inputs');
const booksConfig = require('./books.json');
const topicsConfig = require('./topics.json');

// ── Phase Definitions ──────────────────────────────────────────────

const PHASES = [
  {
    name: 'Foundations',
    description: 'Definition, purpose, and when this act is required',
    instructions: `Extract ONLY the foundational/introductory rulings for this topic.
This includes: what this act IS, its definition, its purpose, when it becomes obligatory, and any legal terminology the book defines.
Valid action_classifications for this phase: Condition, Trigger, Obligatory, Permissible.
Do NOT include the method/steps here. Do NOT include invalidators here.
Expected: 2-5 objects.`
  },
  {
    name: 'Requirements',
    description: 'Conditions and prerequisites that must be met before starting',
    instructions: `Extract ONLY the conditions/prerequisites for this topic.
This includes: what must be true BEFORE you begin (e.g., clean water, reaching puberty, intention if required as a condition).
Valid action_classifications for this phase: Condition, Obligatory.
Do NOT include the actual steps/method here. Do NOT include invalidators.
Expected: 2-6 objects.`
  },
  {
    name: 'Execution',
    description: 'The actual method — step-by-step actions in exact book order',
    instructions: `Extract ONLY the method/steps for performing this act.
CRITICAL RULES:
- Extract steps in the EXACT ORDER the book presents them. Do not reorder.
- Create ONE object per distinct physical action (e.g., separate objects for "Washing the Hands to the Wrists", "Rinsing the Mouth", "Rinsing the Nose", "Washing the Face", etc.)
- Each object MUST have actionable_steps (chronological sub-steps for that specific action).
- Distinguish carefully between Obligatory acts (fard/wajib — required for validity) and Recommended acts (sunnah/mustahab — rewarded but not required).
- If the book says an act is an "integral" or "pillar" or "fard", classify as Obligatory.
- If the book says an act is "sunnah" or "recommended" or "meritorious", classify as Recommended.
Valid action_classifications for this phase: Obligatory, Pillar, Recommended.
Expected: 8-20 objects.`
  },
  {
    name: 'Boundaries',
    description: 'What invalidates or breaks this act',
    instructions: `Extract ONLY the things that INVALIDATE or NULLIFY this act.
CRITICAL RULES:
- Only include things the book EXPLICITLY says break/nullify/invalidate the act.
- Disliked acts (makruh) do NOT belong here. Using too much water is disliked, NOT an invalidator.
- Etiquette violations do NOT belong here.
- short_rule must be an extremely brief trigger statement (e.g., "Deep sleep or loss of consciousness.").
- Do NOT add instructional filler like "You must renew if..." — just state the trigger.
Valid action_classifications for this phase: Invalidator, Impediment.
Expected: 3-10 objects.`
  },
  {
    name: 'Concessions',
    description: 'Ease and dispensations for those with difficulty',
    instructions: `Extract ONLY the concessions, dispensations, and easements the book provides.
This includes: rulings for travelers, the sick, the elderly, those with chronic conditions, wiping over socks/bandages, etc.
Valid action_classifications for this phase: Concession, Permissible.
If the book does not mention concessions for this topic, output an empty array: []
Expected: 0-5 objects.`
  },
  {
    name: 'Excellence',
    description: 'Recommended extras, etiquettes, and disliked acts',
    instructions: `Extract ONLY the recommended extras, etiquettes, sunnahs, and disliked acts.
This includes:
- Recommended practices that beautify the act (sunnah/mustahab)
- Etiquettes and manners (adab)
- Disliked acts (makruh) — things that are discouraged but do NOT invalidate
- Duas/supplications mentioned in the book
CRITICAL: Disliked acts (like wasting water, or using very little water) belong HERE, not in Boundaries.
Valid action_classifications for this phase: Recommended, Disliked, Permissible.
Expected: 3-10 objects.`
  }
];

// ── Phase-Specific Prompt Builder ──────────────────────────────────

function buildPhasePrompt(topic, bookMeta, phase) {
  return `ROLE: You are a document extraction tool. You may ONLY extract information that is EXPLICITLY stated in the provided PDF document. Do NOT use your general knowledge. Do NOT infer, supplement, or create content that is not in the document. If the document does not address something, output null for that field.

TASK: Extract rulings about "${topic}" from this book (${bookMeta.title} by ${bookMeta.author}).
EXTRACT ONLY THE FOLLOWING PHASE: **${phase.name}** — ${phase.description}

${phase.instructions}

PERSONA — THE EMPATHETIC MENTOR:
- Speak directly to the user in second person ("you").
- Warm, dignified modern English. No archaic words (incumbent, eschew, thereof). No slang.
- Frame concessions as mercies. Frame boundaries as gentle reminders, not punishments.
- short_rule and actionable_steps = direct, practical, chronological.
- spiritual_wisdom = uplifting, focused on inner peace and connection to the Divine.

STRUCTURAL RULES:
- One JSON object per distinct ruling/action. NEVER group multiple actions into one object.
- Tag madhhab_applicability as ["${bookMeta.madhhab}"] for all objects.
- actionable_steps: provide chronological steps for Execution phase. Use null for other phases unless steps genuinely apply.
- quran_hadith_evidence: use single quotes inside the string, never double quotes. Set to null if the book does not cite evidence.
- spiritual_wisdom: 1-2 sentences. Set to null only if nothing meaningful can be drawn from the source.
- No comparative text. Never mention other schools.

GROUNDING RULES:
- Every ruling must come from the text of this PDF.
- Every volume_page must reference actual page numbers from this document.
- If you cannot find content for this phase in the book, output an empty array: []

JSON SCHEMA (output ONLY a raw JSON array, no text before or after):

[
  {
    "module": "string (e.g., Purification, Prayer, Fasting)",
    "topic": "${topic}",
    "topic_brief": "string (2-3 uplifting sentences defining this ritual. Identical across all objects)",
    "ritual_type": "string (e.g., Minor Purification, Major Purification)",
    "ritual_phase": "${phase.name}",
    "title": "string (Actionable, specific title)",
    "action_classification": "Obligatory | Pillar | Recommended | Permissible | Disliked | Forbidden | Condition | Trigger | Impediment | Invalidator | Concession",
    "short_rule": "string (Extremely brief, punchy statement)",
    "details": "string (Direct explanation in 2-4 sentences)",
    "actionable_steps": ["string"] or null,
    "quran_hadith_evidence": "string or null",
    "spiritual_wisdom": "string or null",
    "madhhab_applicability": ["${bookMeta.madhhab}"],
    "gender_applicability": ["Male" | "Female" | "All"],
    "ui_icon_concept": "string (1-2 words)",
    "scenario_tags": ["string (2-4 tags)"],
    "source_book": "${bookMeta.title}",
    "author": "${bookMeta.author}",
    "volume_page": "string (page numbers from this document)"
  }
]

SELF-CHECK: Verify ritual_phase is "${phase.name}" for EVERY object. Verify action_classification is valid. Output ONLY the raw JSON array.`;
}

// ── PDF Loading ────────────────────────────────────────────────────

function loadPdfAsBase64(filePath) {
  const absolutePath = path.resolve(booksDir, filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ PDF not found: ${absolutePath}`);
    return null;
  }
  return fs.readFileSync(absolutePath).toString('base64');
}

// ── Single Phase Extraction ────────────────────────────────────────

async function extractPhase(pdfBase64, topic, bookMeta, phase, modelName) {
  const prompt = buildPhasePrompt(topic, bookMeta, phase);
  // Execution phase tends to produce more output
  const maxTokens = (phase.name === 'Execution' || phase.name === 'Excellence') ? 65536 : 32768;

  const maxAttempts = API_KEYS.length * 2;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: maxTokens,
        }
      });

      const result = await model.generateContent([
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
        { text: prompt }
      ]);

      let jsonText = result.response.text().trim();
      if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
      else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
      if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
      jsonText = jsonText.trim();

      // Handle Gemini outputting multiple JSON arrays (separated by ``` fencing)
      // Take only the first complete array
      const firstArrayEnd = jsonText.indexOf(']\n```');
      if (firstArrayEnd > 0) {
        jsonText = jsonText.substring(0, firstArrayEnd + 1);
      } else {
        // Also handle ] followed immediately by ```
        const altEnd = jsonText.indexOf(']```');
        if (altEnd > 0) {
          jsonText = jsonText.substring(0, altEnd + 1);
        }
      }

      // Handle potential truncation — if JSON doesn't end with ], try to fix
      if (!jsonText.endsWith(']')) {
        const lastBrace = jsonText.lastIndexOf('}');
        if (lastBrace > 0) {
          jsonText = jsonText.substring(0, lastBrace + 1) + ']';
          console.log(` (truncated, recovered)`);
        }
      }

      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (parseErr) {
        // Try fixing common issues: "null" strings → null
        let fixedText = jsonText.replace(/"null"/g, 'null');
        try {
          data = JSON.parse(fixedText);
        } catch (parseErr2) {
          // Save raw for debugging
          const debugDir = path.join(outputDir, '_debug');
          if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
          const debugFile = path.join(debugDir, `${phase.name.toLowerCase()}_raw.txt`);
          fs.writeFileSync(debugFile, jsonText);
          throw new Error(`JSON parse failed for ${phase.name}. Raw saved to _debug/. ${parseErr2.message}`);
        }
      }

      if (!Array.isArray(data)) return [];
      return data;

    } catch (err) {
      attempts++;
      if (err.message && err.message.includes('429')) {
        const rotated = rotateKey();
        if (rotated) {
          await new Promise(r => setTimeout(r, 2000));
        } else if (attempts < maxAttempts) {
          console.log(`      ⏳ Rate limited. Waiting 45s...`);
          await new Promise(r => setTimeout(r, 45000));
          currentKeyIndex = 0;
        } else {
          console.error(`      ❌ All keys exhausted for ${phase.name}`);
          return [];
        }
      } else if (err.message && (err.message.includes('JSON') || err.message.includes('Unexpected'))) {
        // Save debug output on first attempt, retry once
        if (attempts < 2) {
          console.log(` (retrying...)`);
          await new Promise(r => setTimeout(r, 3000));
        } else {
          // Save raw response for debugging
          try {
            const debugDir = path.join(outputDir, '_debug');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            const debugFile = path.join(debugDir, `${phase.name.toLowerCase()}_error.txt`);
            // Try to get the raw text from the last attempt
            fs.writeFileSync(debugFile, `Error: ${err.message}\n\nThis phase failed JSON parsing after retries.`);
          } catch (e) { /* ignore */ }
          console.error(`      ❌ JSON parse error for ${phase.name}. Skipping.`);
          return [];
        }
      } else {
        console.error(`      ❌ Error in ${phase.name}: ${err.message}`);
        return [];
      }
    }
  }
  return [];
}

// ── Full Topic Extraction (Phase by Phase) ─────────────────────────

async function extractTopic(bookKey, topic, modelName) {
  const bookMeta = booksConfig[bookKey];
  if (!bookMeta) {
    console.error(`❌ Unknown book key: ${bookKey}`);
    return null;
  }

  console.log(`\n📖 Extracting: "${topic}" from ${bookMeta.title} (${bookMeta.madhhab})`);
  console.log(`   Model: ${modelName} | Method: Phase-by-phase (6 calls)`);

  const pdfBase64 = loadPdfAsBase64(bookMeta.file);
  if (!pdfBase64) return null;

  const allRecords = [];

  for (const phase of PHASES) {
    process.stdout.write(`   ⏳ ${phase.name}...`);
    
    const records = await extractPhase(pdfBase64, topic, bookMeta, phase, modelName);
    console.log(` ${records.length} records`);
    allRecords.push(...records);

    // Brief pause between phases to avoid rate limits
    if (phase !== PHASES[PHASES.length - 1]) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (allRecords.length === 0) {
    console.log(`   ❌ No records extracted.`);
    return null;
  }

  console.log(`   ✅ Total: ${allRecords.length} rulings across ${PHASES.filter(p => allRecords.some(r => r.ritual_phase === p.name)).length} phases`);
  return allRecords;
}

// ── Output ─────────────────────────────────────────────────────────

function saveOutput(bookKey, topic, data) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const bookMeta = booksConfig[bookKey];
  const safeTopicName = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeMadhhab = bookMeta.madhhab.toLowerCase();
  const fileName = `${safeMadhhab}_${safeTopicName}.json`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   💾 Saved: ${fileName}`);
  return filePath;
}

// ── CLI Argument Parsing ───────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let book = null;
  let topic = null;
  let model = 'gemini-2.5-flash';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) { book = args[++i]; }
    else if (args[i] === '--topic' && args[i + 1]) { topic = args[++i]; }
    else if (args[i] === '--model' && args[i + 1]) { model = args[++i]; }
  }

  if (!book || !topic) {
    console.log('Usage:');
    console.log('  node extract.js --book <book-key|all> --topic <topic-name|all>');
    console.log('  node extract.js --book all --topic "Ablution (Wudu)" --model gemini-2.5-flash');
    console.log('');
    console.log('Available books:');
    Object.entries(booksConfig).forEach(([key, meta]) => {
      console.log(`  ${key} → ${meta.title} (${meta.madhhab})`);
    });
    console.log('');
    console.log('Available topics:');
    topicsConfig.forEach(t => console.log(`  "${t}"`));
    process.exit(1);
  }

  return { book, topic, model };
}

// ── Main Pipeline ──────────────────────────────────────────────────

async function main() {
  const { book, topic, model: modelName } = parseArgs();

  const bookKeys = book === 'all' ? Object.keys(booksConfig) : [book];
  const topics = topic === 'all' ? topicsConfig : [topic];

  for (const key of bookKeys) {
    if (!booksConfig[key]) {
      console.error(`❌ Unknown book: "${key}". Available: ${Object.keys(booksConfig).join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`🔑 ${API_KEYS.length} API key(s) loaded.`);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   FIQH EXTRACTION PIPELINE (Phase-by-Phase) ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Books:  ${bookKeys.length} | Topics: ${topics.length} | Model: ${modelName}`);
  console.log('╚══════════════════════════════════════════════╝');

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const topicName of topics) {
    for (const bookKey of bookKeys) {
      const data = await extractTopic(bookKey, topicName, modelName);

      if (data && data.length > 0) {
        saveOutput(bookKey, topicName, data);
        results.push({ book: bookKey, topic: topicName, count: data.length });
        successCount++;
      } else {
        results.push({ book: bookKey, topic: topicName, count: 0 });
        failCount++;
      }

      // Pause between books for same topic
      if (bookKeys.length > 1) {
        console.log('   ⏳ Pausing 5s between books...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   EXTRACTION SUMMARY                        ║');
  console.log('╠══════════════════════════════════════════════╣');
  results.forEach(r => {
    const status = r.count > 0 ? '✅' : '❌';
    const madhhab = booksConfig[r.book]?.madhhab || r.book;
    console.log(`║ ${status} ${madhhab} / ${r.topic}: ${r.count} rulings`);
  });
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Succeeded: ${successCount} | Failed: ${failCount}`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\nNext steps:');
  console.log('  1. node normalize.js');
  console.log('  2. node quality_check.js');
  console.log('  3. node ingest.js');
}

main();
