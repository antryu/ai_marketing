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

    // Build enhanced prompt - 사용자 프롬프트를 최우선으로
    const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['1:1']

    // 스타일에 따른 간단한 품질 키워드만 추가
    const qualityKeyword = style === 'realistic' ? 'photorealistic' :
                          style === 'illustration' ? 'digital illustration' :
                          style === 'minimal' ? 'minimalist design' :
                          style === 'vibrant' ? 'vibrant colors' : 'high quality'

    // 한국어 프롬프트를 영어로 번역 (Claude 사용)
    let englishPrompt = prompt

    // 한국어가 포함되어 있는지 확인
    const hasKorean = /[가-힣]/.test(prompt)

    if (hasKorean) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const translation = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `Translate the following Korean text to English for AI image generation. Create a detailed, vivid description that captures the essence and visual elements. Output ONLY the English translation, nothing else.

Korean: ${prompt}`
            }
          ]
        })

        const content = translation.content[0]
        if (content.type === 'text') {
          englishPrompt = content.text.trim()
        }
        console.log(`Translated prompt: ${prompt} -> ${englishPrompt}`)
      } catch (translateError) {
        console.error('Translation failed, using original:', translateError)
        englishPrompt = prompt
      }
    }

    // 영어 프롬프트 + 품질 키워드 + 텍스트 없음 지시
    // IMPORTANT: 이미지에 텍스트가 포함되지 않도록 명시적으로 지시
    const cleanPrompt = `${englishPrompt}, ${qualityKeyword}, high quality, no text, no letters, no words, no writing, no typography, no watermark, no signature, clean image without any text or characters`

    console.log('=== Image Generation Started ===')
    console.log(`User Prompt: ${prompt}`)
    console.log(`English Prompt: ${englishPrompt}`)
    console.log(`Final Prompt: ${cleanPrompt}`)
    console.log(`Style: ${style}, Aspect Ratio: ${aspectRatio}`)

    // FLUX.1 dev 모델 - guidance를 높여서 프롬프트 준수 강화
    console.log('Calling Replicate API...')
    console.log('API Token exists:', !!process.env.REPLICATE_API_TOKEN)

    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: cleanPrompt,
          num_outputs: 1,
          aspect_ratio: aspectRatio,
          output_format: "webp",
          output_quality: 90,
          guidance: 7.5,  // 높은 guidance = 프롬프트를 더 정확히 따름
          num_inference_steps: 30,
        }
      }
    )

    console.log('Replicate output type:', typeof output)
    console.log('Replicate output (raw):', output)

    // Replicate SDK v1.0+ returns FileOutput objects that need special handling
    // FileOutput extends URL, so we can access the href property directly
    let imageUrl: string = ''

    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0]
      console.log('First item:', firstItem)
      console.log('First item type:', typeof firstItem)
      console.log('First item constructor:', firstItem?.constructor?.name)

      // FileOutput is a URL subclass, check for href property
      if (firstItem && typeof firstItem === 'object' && 'href' in firstItem) {
        imageUrl = (firstItem as URL).href
        console.log('Got URL from href:', imageUrl)
      } else if (typeof firstItem === 'string') {
        imageUrl = firstItem
        console.log('Got string URL:', imageUrl)
      } else if (firstItem && firstItem.toString) {
        // Try toString() which should return the URL for FileOutput
        const strValue = firstItem.toString()
        if (strValue.startsWith('http')) {
          imageUrl = strValue
          console.log('Got URL from toString:', imageUrl)
        }
      }
    } else if (typeof output === 'string') {
      imageUrl = output
      console.log('Output is string:', imageUrl)
    } else if (output && typeof output === 'object' && 'href' in output) {
      imageUrl = (output as URL).href
      console.log('Got URL from single object href:', imageUrl)
    }

    // Final validation
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.error('Failed to extract valid URL. Output was:', output)
      console.error('Output keys:', output && typeof output === 'object' ? Object.keys(output) : 'N/A')
      throw new Error(`No valid image URL extracted from Replicate response`)
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
        ai_model: 'flux-dev',
        platform_variations: {
          default: {
            imageUrl,
            prompt: cleanPrompt,
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

    console.log('=== Preparing Response ===')
    console.log('imageUrl to return:', imageUrl)
    console.log('imageUrl type:', typeof imageUrl)
    console.log('imageUrl length:', imageUrl?.length)

    const responseData = {
      success: true,
      imageUrl: imageUrl,
      content,
      metadata: {
        prompt: cleanPrompt,
        style,
        aspectRatio,
        dimensions,
        model: 'flux-dev',
      }
    }

    console.log('Full response:', JSON.stringify(responseData, null, 2))

    return NextResponse.json(responseData)

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
