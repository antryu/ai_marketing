import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface AutoSaveRequest {
  contentId?: string  // 기존 콘텐츠 업데이트시 사용
  brandId: string
  writerPersonaId?: string
  topic: string
  body?: string
  contentType: 'text' | 'image' | 'video' | 'ai_video'
  aiModel?: string
  seoKeywords?: string[]
  platformVariations?: Record<string, any>
  language?: 'ko' | 'en'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: AutoSaveRequest = await request.json()
    const {
      contentId,
      brandId,
      writerPersonaId,
      topic,
      body: contentBody,
      contentType,
      aiModel,
      seoKeywords,
      platformVariations,
      language = 'ko'
    } = body

    if (!brandId) {
      return NextResponse.json(
        { error: language === 'ko' ? '브랜드를 선택해주세요' : 'Please select a brand' },
        { status: 400 }
      )
    }

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'ko' ? '주제를 입력해주세요' : 'Please enter a topic' },
        { status: 400 }
      )
    }

    // Verify brand belongs to user
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single()

    if (!brand) {
      return NextResponse.json(
        { error: language === 'ko' ? '브랜드를 찾을 수 없습니다' : 'Brand not found' },
        { status: 404 }
      )
    }

    const contentData = {
      brand_id: brandId,
      writer_persona_id: writerPersonaId || null,
      topic,
      body: contentBody || '',
      content_type: contentType,
      ai_model: aiModel || 'claude',
      seo_keywords: seoKeywords || [],
      platform_variations: platformVariations || {},
      status: 'draft',
      updated_at: new Date().toISOString()
    }

    let result

    if (contentId) {
      // Update existing content
      const { data, error } = await supabase
        .from('contents')
        .update(contentData)
        .eq('id', contentId)
        .eq('brand_id', brandId)  // Security: ensure content belongs to brand
        .select()
        .single()

      if (error) {
        console.error('Auto-save update error:', error)
        return NextResponse.json(
          { error: language === 'ko' ? '자동 저장 실패' : 'Auto-save failed', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log(`=== Content auto-saved (updated) === ID: ${contentId}`)
    } else {
      // Create new content
      const { data, error } = await supabase
        .from('contents')
        .insert({
          ...contentData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Auto-save insert error:', error)
        return NextResponse.json(
          { error: language === 'ko' ? '자동 저장 실패' : 'Auto-save failed', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log(`=== Content auto-saved (created) === ID: ${result.id}`)
    }

    return NextResponse.json({
      success: true,
      contentId: result.id,
      message: language === 'ko' ? '자동 저장됨' : 'Auto-saved',
      content: result
    })

  } catch (error) {
    console.error('Auto-save error:', error)
    return NextResponse.json(
      {
        error: 'Auto-save failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: Retrieve draft content by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID required' },
        { status: 400 }
      )
    }

    // Get content with brand verification
    const { data: content, error } = await supabase
      .from('contents')
      .select(`
        *,
        brands!inner(user_id)
      `)
      .eq('id', contentId)
      .single()

    if (error || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (content.brands.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      content: {
        id: content.id,
        brandId: content.brand_id,
        writerPersonaId: content.writer_persona_id,
        topic: content.topic,
        body: content.body,
        contentType: content.content_type,
        aiModel: content.ai_model,
        seoKeywords: content.seo_keywords,
        platformVariations: content.platform_variations,
        status: content.status,
        createdAt: content.created_at,
        updatedAt: content.updated_at
      }
    })

  } catch (error) {
    console.error('Get content error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve content' },
      { status: 500 }
    )
  }
}
