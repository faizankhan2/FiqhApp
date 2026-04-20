const { z } = require('zod');

/**
 * Fiqh Ruling Schema - PRODUCTION (Strict Classifications)
 */
const rulingSchema = z.object({
  module: z.string(),
  topic: z.string(),
  topic_brief: z.string(),
  ritual_type: z.string(),
  
  // The 6 Universal Buckets
  ritual_phase: z.enum([
    'Foundations', 
    'Requirements', 
    'Execution', 
    'Boundaries', 
    'Concessions', 
    'Excellence'
  ]),
  
  title: z.string(),
  
  // The 11 Comprehensive Fiqh Classifications
  action_classification: z.enum([
    'Obligatory', 
    'Pillar', 
    'Recommended', 
    'Permissible', 
    'Disliked', 
    'Forbidden', 
    'Condition', 
    'Trigger', 
    'Impediment', 
    'Invalidator', 
    'Concession'
  ]),
  
  short_rule: z.string(),
  details: z.string(),
  actionable_steps: z.array(z.string()).nullable(),
  quran_hadith_evidence: z.string().nullable(),
  spiritual_wisdom: z.string().nullable(),
  
  madhhab_applicability: z.array(z.enum(['Hanafi', 'Maliki', "Shafi'i", 'Hanbali'])),
  gender_applicability: z.array(z.enum(['Male', 'Female', 'All'])),
  
  ui_icon_concept: z.string(),
  scenario_tags: z.array(z.string()),
  source_book: z.string(),
  author: z.string(),
  volume_page: z.string()
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
      results.errors.push(`Row ${index + 1}: ${result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join(", ")}`);
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
