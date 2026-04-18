require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('--- Database Integrity Check ---');
  
  // Get total count
  const { count, error } = await supabase
    .from('fiqh_rulings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching count:', error.message);
    return;
  }

  console.log(`Total unique records in database: ${count}`);

  // Check for specific overlaps by module/topic/title
  const { data: overlaps, error: overlapError } = await supabase
    .rpc('get_duplicate_ruling_count'); // I don't have this RPC, I'll just use a clever query to see if any are suspicious

  // Alternative: Fetch all and check for common names across categories
  const { data: rows } = await supabase
    .from('fiqh_rulings')
    .select('module, topic, title');

  const seen = new Set();
  const duplicates = [];

  rows.forEach(r => {
    const key = `${r.module}|${r.topic}|${r.title}`;
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  });

  if (duplicates.length > 0) {
    console.log('Duplicates found (local check):');
    duplicates.forEach(d => console.log(` - ${d}`));
  } else {
    console.log('No exact duplicates (module|topic|title) found in the current dataset.');
  }
}

checkDuplicates();
