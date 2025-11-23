import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 페르소나 템플릿 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('persona_templates')
      .select('*')
      .eq('is_active' as any, true as any)
      .order('popularity_score', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category' as any, category as any)
    }

    const { data, error } = await query

    if (error) {
      console.error('Template fetch error:', error)
      return NextResponse.json(
        { error: '템플릿을 불러오지 못했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: data || [] })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST - 템플릿으로부터 페르소나 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId, customizations } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 템플릿 조회
    const { data: template, error: templateError } = await supabase
      .from('persona_templates')
      .select('*')
      .eq('id' as any, templateId as any)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 템플릿 타입 변환
    const typedTemplate = template as any

    // 템플릿 기반 페르소나 생성
    const personaData = {
      user_id: user.id,
      name: customizations?.name || `${typedTemplate.name} 스타일`,
      description: customizations?.description || typedTemplate.description,
      writing_style: typedTemplate.writing_style,
      tone: typedTemplate.tone,
      preferred_structure: typedTemplate.preferred_structure,
      expertise_areas: typedTemplate.expertise_areas,
      unique_perspective: customizations?.unique_perspective || typedTemplate.unique_perspective,
      language_preferences: typedTemplate.language_preferences,
      signature_phrases: typedTemplate.signature_phrases,
      catchphrase: customizations?.catchphrase || typedTemplate.catchphrase,
      is_default: false,
      usage_count: 0
    }

    const { data: persona, error: createError } = await supabase
      .from('writer_personas')
      .insert(personaData as any)
      .select()
      .single()

    if (createError) {
      console.error('Persona creation error:', createError)
      return NextResponse.json(
        { error: '페르소나 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    // 템플릿 인기도 증가
    await supabase
      .from('persona_templates')
      .update({ popularity_score: (typedTemplate.popularity_score || 0) + 1 } as any)
      .eq('id' as any, templateId as any)

    return NextResponse.json({
      success: true,
      persona,
      message: `${typedTemplate.name} 스타일의 페르소나가 생성되었습니다`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
