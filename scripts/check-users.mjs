import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: profiles, error } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('\n=== 로그인한 사용자 목록 ===\n');
console.log('총 ' + profiles.length + '명\n');

profiles.forEach((profile, idx) => {
  console.log((idx + 1) + '. ' + profile.email);
  if (profile.full_name) console.log('   이름: ' + profile.full_name);
  console.log('   가입: ' + new Date(profile.created_at).toLocaleString('ko-KR'));
  console.log('');
});
