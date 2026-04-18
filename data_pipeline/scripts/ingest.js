require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { validateRulings } = require('./validator');

// Initialize Supabase Client - Prioritize Service Role Key for Pipeline access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the .env file at the root.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const inputsDir = path.join(__dirname, '../inputs');
const archiveRoot = path.join(__dirname, '../archive');

// --- Helper Functions ---

function getTodayArchivePath() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const archivePath = path.join(archiveRoot, today);
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
  }
  return archivePath;
}

function archiveFile(filePath) {
  const archiveDir = getTodayArchivePath();
  const fileName = path.basename(filePath);
  const destPath = path.join(archiveDir, fileName);
  
  try {
    fs.renameSync(filePath, destPath);
    console.log(`📦 Archived: ${fileName} -> archive/${path.basename(archiveDir)}/`);
  } catch (err) {
    console.error(`⚠️ Failed to archive ${fileName}:`, err.message);
  }
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(fileContent);

    // 1. Validation Layer (Aligned with Supabase)
    const { isValid, validData, errors } = validateRulings(rawData);

    if (!isValid) {
      console.error(`❌ Validation failed for ${fileName}:`);
      errors.forEach(err => console.error(`   - ${err}`));
      console.log(`⏭️ Skipping file. Please fix errors and try again.`);
      return false;
    }

    // 2. Database Upsert
    // Note: onConflict uses the internal column names module/topic/title
    console.log(`🚀 Uploading ${validData.length} records to Supabase...`);
    const { error } = await supabase
      .from('fiqh_rulings')
      .upsert(validData, { onConflict: 'module,topic,title,source_book' });

    if (error) {
      console.error(`❌ Database error:`, error.message);
      return false;
    }

    console.log(`✅ Success: ${validData.length} rulings ingested.`);
    return true;

  } catch (err) {
    console.error(`💥 Fatal error processing ${fileName}:`, err.message);
    return false;
  }
}

async function runPipeline() {
  console.log('====================================');
  console.log('   FIQH DATA PIPELINE (ALIGNED)     ');
  console.log('====================================');

  if (!fs.existsSync(inputsDir)) {
    console.error(`❌ Error: Inputs directory not found at ${inputsDir}`);
    return;
  }

  const files = fs.readdirSync(inputsDir).filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON files found in inputs/. Pipeline idle.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(inputsDir, file);
    const success = await processFile(filePath);
    
    if (success) {
      archiveFile(filePath);
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n====================================');
  console.log(`🏁 Pipeline Summary:`);
  console.log(`   - Files Processed: ${successCount}`);
  console.log(`   - Files Failed:    ${failCount}`);
  console.log('====================================');
}

runPipeline();
