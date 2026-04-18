require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSampleData() {
  console.log('--- Cleaning Up Sample Data ---');

  // Deleting records that use the 'Taharah' module (Chapter 1 uses 'Purification')
  // and the one specific 'Salah' record from the sample set.
  const { data, error } = await supabase
    .from('fiqh_rulings')
    .delete()
    .or('module.eq.Taharah,title.eq.Asr Prayer Time')
    .select();

  if (error) {
    console.error('Error deleting data:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Successfully deleted ${data.length} sample records:`);
    data.forEach(r => console.log(` - [${r.module}] ${r.title}`));
  } else {
    console.log('No sample records found to delete.');
  }
}

deleteSampleData();
