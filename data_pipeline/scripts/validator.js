const { z } = require('zod');

/**
 * Fiqh Ruling Schema - Aligned with actual Supabase Schema
 */
const rulingSchema = z.object({
  module: z.string().min(3, "Module must be at least 3 characters"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  action: z.enum(["Fard", "Wajib", "Sunnah", "Mandub", "Mustahab", "Mubah", "Makruh", "Haram", "Mufsid"]).nullable(),
  short_rule: z.string().max(280, "Short rule should be concise (max 280 chars)"),
  // Mandatory Descriptive Fields
  details: z.string().min(10, "Details must be descriptive"),
  
  // madhhab_applicability is a text array (_text) in the DB
  madhhab_applicability: z.array(z.string()).min(1, "At least one Madhhab must be specified"),
  
  // Situational & Peaceful Scholar UX Fields
  quran_hadith_evidence: z.string().nullable(),
  spiritual_wisdom: z.string().nullable(),
  actionable_steps: z.array(z.string()).nullable(),
  
  scenario_tags: z.array(z.string()).optional().nullable(),
  arabic_terminology: z.string().optional().nullable(),
  remedy_or_consequence: z.string().optional().nullable(),
  
  // Optional metadata
  ui_icon_concept: z.string().optional().nullable(),
  source_book: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  volume_page: z.string().optional().nullable(),
});

/**
 * Validates a batch of rulings.
 */
function validateRulings(data) {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ["Input data must be an array."] };
  }

  const results = {
    valid: [],
    invalid: [],
    errors: []
  };

  data.forEach((item, index) => {
    const result = rulingSchema.safeParse(item);
    if (result.success) {
      results.valid.push(result.data);
    } else {
      results.invalid.push({ index, item });
      results.errors.push(`Row ${index + 1}: ${result.error.issues.map(i => i.message).join(", ")}`);
    }
  });

  return {
    isValid: results.errors.length === 0,
    validData: results.valid,
    invalidCount: results.invalid.length,
    errors: results.errors
  };
}

module.exports = { validateRulings };
