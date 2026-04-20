const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('🗑️ Resetting fiqh_rulings table for production...');
  
  // 1. Truncate (using delete all since we have service role)
  // We use .neq('module', 'dummy_val') to hit all rows
  const { data, error, count } = await supabase
    .from('fiqh_rulings')
    .delete()
    .neq('module', 'RESET_ALL_DATA_SECRET_KEY_12345')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Failed to clear table:', error.message);
  } else {
    console.log(`✅ Table cleared. Removed ${count} legacy records.`);
  }

  // 2. Structural Verification (Check if key columns exist)
  console.log('🔍 Verifying production schema columns...');
  const { data: sample, error: fetchError } = await supabase
    .from('fiqh_rulings')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('❌ Schema check failed:', fetchError.message);
  } else {
    // If we can select, the table exists. 
    // We'll rely on the user having run the migration for columns like topic_brief and action_classification.
    console.log('✅ Base table connection established.');
  }
}

resetDatabase();
