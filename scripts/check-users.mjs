import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sepnrqzjccjrtssvytow.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG5ycXpqY2NqcnRzc3Z5dG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTk4MDUsImV4cCI6MjA3ODc3NTgwNX0.9bSgdRlnjBQtAMNqoUAjIk8ZVd8WbzgQiLM-l-mu_dw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('👥 Checking users (auth.users)...\n')

  // Try to get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  console.log('Current authenticated user:', user ? user.email : 'Not authenticated')
  console.log('')

  // Check profiles table
  console.log('📊 Checking profiles table...\n')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (profilesError) {
    console.error('❌ Profiles Error:', profilesError.message)
  } else if (profiles && profiles.length > 0) {
    console.log(`✅ Found ${profiles.length} profile(s):\n`)
    profiles.forEach((profile, index) => {
      console.log(`[${index + 1}] Profile:`)
      console.log(`    ID: ${profile.id}`)
      console.log(`    Email: ${profile.email || 'N/A'}`)
      console.log(`    Full Name: ${profile.full_name || 'N/A'}`)
      console.log(`    Plan: ${profile.plan || 'N/A'}`)
      console.log(`    Created: ${new Date(profile.created_at).toLocaleString('ko-KR')}`)
      console.log('')
    })
  } else {
    console.log('ℹ️  No profiles found')
  }

  // Check brands table
  console.log('\n🏢 Checking brands table...\n')
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (brandsError) {
    console.error('❌ Brands Error:', brandsError.message)
  } else if (brands && brands.length > 0) {
    console.log(`✅ Found ${brands.length} brand(s):\n`)
    brands.forEach((brand, index) => {
      console.log(`[${index + 1}] ${brand.name}`)
      console.log(`    User ID: ${brand.user_id}`)
      console.log(`    Created: ${new Date(brand.created_at).toLocaleString('ko-KR')}`)
      console.log('')
    })
  } else {
    console.log('ℹ️  No brands found')
  }

  // Check content table
  console.log('\n📝 Checking content table...\n')
  const { data: contents, error: contentsError } = await supabase
    .from('content')
    .select('id, title, platform, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (contentsError) {
    console.error('❌ Content Error:', contentsError.message)
  } else if (contents && contents.length > 0) {
    console.log(`✅ Found ${contents.length} content(s):\n`)
    contents.forEach((content, index) => {
      console.log(`[${index + 1}] ${content.title || 'Untitled'}`)
      console.log(`    Platform: ${content.platform}`)
      console.log(`    Status: ${content.status}`)
      console.log(`    Created: ${new Date(content.created_at).toLocaleString('ko-KR')}`)
      console.log('')
    })
  } else {
    console.log('ℹ️  No content found')
  }
}

checkUsers()
