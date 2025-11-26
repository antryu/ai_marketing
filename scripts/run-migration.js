const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🔧 Running migration 007_add_seo_keywords.sql...');
  console.log('📍 Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);

  const sql = `
    ALTER TABLE public.contents
    ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

    CREATE INDEX IF NOT EXISTS idx_contents_seo_keywords
    ON public.contents USING GIN (seo_keywords);
  `;

  // Use direct SQL execution via REST API
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ sql })
  });

  if (response.ok) {
    console.log('✅ Migration completed successfully!');
  } else {
    const error = await response.text();
    console.log('⚠️ Response:', error);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log(sql);
  }
}

runMigration().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
  console.log(`
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

CREATE INDEX IF NOT EXISTS idx_contents_seo_keywords
ON public.contents USING GIN (seo_keywords);

COMMENT ON COLUMN public.contents.seo_keywords IS 'SEO 키워드 배열 - 검색 최적화 및 콘텐츠 분류에 사용';
  `);
});
