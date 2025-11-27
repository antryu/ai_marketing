import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - 구독자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin은 모든 구독자 조회, 일반 사용자는 본인 구독자만 조회
    const isAdmin = user.email === 'seongpilryu@gmail.com'

    let query = supabase
      .from('subscribers')
      .select('*')

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: subscribers, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch subscribers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscribers })
  } catch (error) {
    console.error('Subscribers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 구독자 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name } = body

    // 이메일 필수 확인
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // 구독자 추가
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .insert({
        user_id: user.id,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      // 중복 이메일 에러 처리
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already subscribed' }, { status: 409 })
      }
      console.error('Failed to add subscriber:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscriber }, { status: 201 })
  } catch (error) {
    console.error('Subscribers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
