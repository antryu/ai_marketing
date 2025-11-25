import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sepnrqzjccjrtssvytow.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG5ycXpqY2NqcnRzc3Z5dG93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5OTgwNSwiZXhwIjoyMDc4Nzc1ODA1fQ.IobDD_ocWogfYROBgU7yGuhHIFaV4E4f0DHG5y79EHw'

// Service role key로 생성하면 auth.users에 접근 가능
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAuthUsers() {
  console.log('👥 Checking authenticated users (auth.users)...\n')

  // Service role key로 모든 사용자 조회
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || !data.users || data.users.length === 0) {
    console.log('ℹ️  No users found')
    return
  }

  console.log(`✅ Found ${data.users.length} user(s):\n`)

  data.users.forEach((user, index) => {
    console.log(`[${index + 1}] User ID: ${user.id}`)
    console.log(`    Email: ${user.email}`)
    console.log(`    Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`    Created: ${new Date(user.created_at).toLocaleString('ko-KR')}`)
    console.log(`    Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('ko-KR') : 'Never'}`)
    console.log(`    Provider: ${user.app_metadata?.provider || 'email'}`)
    if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
      console.log(`    Metadata:`, user.user_metadata)
    }
    console.log('')
  })

  // Count email confirmations
  const confirmed = data.users.filter(u => u.email_confirmed_at).length
  const unconfirmed = data.users.length - confirmed

  console.log('📈 Summary:')
  console.log(`   Total Users: ${data.users.length}`)
  console.log(`   Email Confirmed: ${confirmed}`)
  console.log(`   Email Unconfirmed: ${unconfirmed}`)
}

checkAuthUsers()
