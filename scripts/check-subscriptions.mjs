import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sepnrqzjccjrtssvytow.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG5ycXpqY2NqcnRzc3Z5dG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTk4MDUsImV4cCI6MjA3ODc3NTgwNX0.9bSgdRlnjBQtAMNqoUAjIk8ZVd8WbzgQiLM-l-mu_dw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSubscriptions() {
  console.log('📊 Checking subscriptions...\n')

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No subscriptions found')
    return
  }

  console.log(`✅ Found ${data.length} subscription(s):\n`)

  data.forEach((sub, index) => {
    console.log(`[${index + 1}] Subscription ID: ${sub.id}`)
    console.log(`    User ID: ${sub.user_id}`)
    console.log(`    Plan: ${sub.plan_id}`)
    console.log(`    Status: ${sub.status}`)
    console.log(`    Created: ${new Date(sub.created_at).toLocaleString('ko-KR')}`)
    if (sub.current_period_end) {
      console.log(`    Period End: ${new Date(sub.current_period_end).toLocaleString('ko-KR')}`)
    }
    console.log('')
  })

  // Count by status
  const statusCounts = data.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1
    return acc
  }, {})

  console.log('📈 Status Summary:')
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`)
  })
}

checkSubscriptions()
