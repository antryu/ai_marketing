import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

interface GenerateImageRequest {
  prompt: string
  brandId: string
  style?: 'realistic' | 'illustration' | 'minimal' | 'vibrant'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
  language?: 'ko' | 'en'
}

// 스타일별 프롬프트 수정자
const STYLE_MODIFIERS: Record<string, string> = {
  realistic: 'photorealistic, high quality, detailed, professional photography',
  illustration: 'digital illustration, artistic, colorful, creative design',
  minimal: 'minimalist, clean, simple, modern design, white space',
  vibrant: 'vibrant colors, eye-catching, bold, dynamic composition',
}

// 비율별 크기 설정
const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
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

    const body: GenerateImageRequest = await request.json()
    const {
      prompt,
      brandId,
      style = 'realistic',
      aspectRatio = '1:1',
      language = 'ko'
    } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'ko' ? '프롬프트를 입력해주세요' : 'Please enter a prompt' },
        { status: 400 }
      )
    }

    if (!brandId) {
      return NextResponse.json(
        { error: language === 'ko' ? '브랜드를 선택해주세요' : 'Please select a brand' },
        { status: 400 }
      )
    }

    // Get brand information
    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (!brand) {
      return NextResponse.json(
        { error: language === 'ko' ? '브랜드를 찾을 수 없습니다' : 'Brand not found' },
        { status: 404 }
      )
    }

    // Build enhanced prompt
    const styleModifier = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.realistic
    const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['1:1']

    // 브랜드 컨텍스트를 프롬프트에 추가
    const brandContext = brand.brand_voice?.style
      ? `, ${brand.brand_voice.style} style`
      : ''

    const enhancedPrompt = `${prompt}, ${styleModifier}${brandContext}, marketing image, professional`

    console.log('=== Image Generation Started ===')
    console.log(`Prompt: ${enhancedPrompt}`)
    console.log(`Style: ${style}, Aspect Ratio: ${aspectRatio}`)

    // FLUX.1 schnell 모델 사용 (빠르고 무료 친화적)
    console.log('Calling Replicate API...')
    console.log('API Token exists:', !!process.env.REPLICATE_API_TOKEN)

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          aspect_ratio: aspectRatio,
          output_format: "webp",
          output_quality: 90,
          go_fast: true,
        }
      }
    )

    console.log('Replicate output type:', typeof output)
    console.log('Replicate output:', JSON.stringify(output, null, 2))

    // output 형식 처리 - 배열이거나 단일 URL이거나 FileOutput 객체일 수 있음
    let imageUrl: string

    if (Array.isArray(output)) {
      // 배열인 경우
      const firstItem = output[0]
      if (typeof firstItem === 'string') {
        imageUrl = firstItem
      } else if (firstItem && typeof firstItem === 'object') {
        // FileOutput 객체인 경우
        imageUrl = (firstItem as any).url || (firstItem as any).toString()
      } else {
        throw new Error('Invalid output format from Replicate')
      }
    } else if (typeof output === 'string') {
      imageUrl = output
    } else if (output && typeof output === 'object') {
      // 단일 FileOutput 객체인 경우
      imageUrl = (output as any).url || (output as any).toString()
    } else {
      throw new Error('No image generated - unexpected output format')
    }

    if (!imageUrl) {
      throw new Error('No image URL in response')
    }

    console.log('=== Image Generation Completed ===')
    console.log(`Image URL: ${imageUrl}`)

    // Save to database
    const { data: content, error: insertError } = await supabase
      .from('contents')
      .insert({
        brand_id: brandId,
        topic: prompt,
        body: imageUrl,
        content_type: 'image',
        ai_model: 'flux-schnell',
        platform_variations: {
          default: {
            imageUrl,
            prompt: enhancedPrompt,
            style,
            aspectRatio,
            dimensions,
          }
        },
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      // 이미지는 생성되었지만 DB 저장 실패 - 이미지는 반환
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      content,
      metadata: {
        prompt: enhancedPrompt,
        style,
        aspectRatio,
        dimensions,
        model: 'flux-schnell',
      }
    })

  } catch (error) {
    console.error('Image generation error:', error)

    // Replicate API 에러 처리
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('API token')) {
        return NextResponse.json(
          { error: 'Replicate API 인증 오류. API 토큰을 확인해주세요.' },
          { status: 401 }
        )
      }
      if (error.message.includes('402') || error.message.includes('Payment Required') || error.message.includes('Insufficient credit')) {
        return NextResponse.json(
          { error: 'Replicate 계정에 크레딧이 부족합니다. https://replicate.com/account/billing 에서 결제 정보를 등록해주세요.' },
          { status: 402 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: '요청 한도 초과. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      {
        error: '이미지 생성 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
