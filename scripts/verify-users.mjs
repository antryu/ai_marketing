import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sepnrqzjccjrtssvytow.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG5ycXpqY2NqcnRzc3Z5dG93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5OTgwNSwiZXhwIjoyMDc4Nzc1ODA1fQ.IobDD_ocWogfYROBgU7yGuhHIFaV4E4f0DHG5y79EHw'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const unverifiedUsers = [
  { id: 'a934524e-bfae-497e-93fb-d62ab194b09f', email: 'kumbung@naver.com', name: '함봉다리' },
  { id: 'b722f716-1984-48a5-b1b3-744acd44a2bb', email: 'andante98@naver.com', name: '윤태훈' },
  { id: 'f6157141-de15-4bbf-9766-4650b59de718', email: 'lavender130@naver.com', name: '이나임' }
]

async function verifyUsers() {
  console.log('🔐 강제 이메일 인증 처리 시작...\n')

  for (const user of unverifiedUsers) {
    console.log(`처리 중: ${user.name} (${user.email})`)

    try {
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            email_verified: true
          }
        }
      )

      if (error) {
        console.log(`   ❌ 실패: ${error.message}`)
      } else {
        console.log(`   ✅ 성공: 이메일 인증 완료`)
      }
    } catch (err) {
      console.log(`   ❌ 에러: ${err.message}`)
    }
    console.log('')
  }

  console.log('\n📊 최종 확인...\n')

  const { data: allUsers } = await supabase.auth.admin.listUsers()
  const verified = allUsers.users.filter(u => u.email_confirmed_at).length
  const total = allUsers.users.length

  console.log(`✅ 총 사용자: ${total}명`)
  console.log(`✅ 인증 완료: ${verified}명`)
  console.log(`⚠️  인증 미완료: ${total - verified}명`)
}

verifyUsers()
