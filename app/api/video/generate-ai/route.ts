import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video generation

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

interface GenerateVideoRequest {
  imageUrl: string  // Source image URL for image-to-video
  brandId: string
  motion?: 'low' | 'medium' | 'high'
  duration?: number // seconds (SVD generates ~4 seconds)
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

    const body: GenerateVideoRequest = await request.json()
    const {
      imageUrl,
      brandId,
      motion = 'medium',
      language = 'ko'
    } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: language === 'ko' ? '소스 이미지가 필요합니다' : 'Source image is required' },
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

    console.log('=== AI Video Generation Started ===')
    console.log(`Image URL: ${imageUrl}`)
    console.log(`Motion: ${motion}`)

    // Motion amount mapping (0-255, higher = more motion)
    const motionAmounts = {
      low: 80,
      medium: 127,
      high: 180
    }

    // Use Stable Video Diffusion via Replicate
    // Model: stability-ai/stable-video-diffusion
    console.log('Calling Replicate Stable Video Diffusion API...')

    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
      {
        input: {
          input_image: imageUrl,
          motion_bucket_id: motionAmounts[motion],
          cond_aug: 0.02,
          decoding_t: 7,
          video_length: "25_frames_with_svd_xt",
          sizing_strategy: "maintain_aspect_ratio",
          frames_per_second: 8
        }
      }
    )

    console.log('Replicate output type:', typeof output)
    console.log('Replicate output:', output)

    // Extract video URL from output
    let videoUrl: string = ''

    if (typeof output === 'string') {
      videoUrl = output
    } else if (output && typeof output === 'object' && 'href' in output) {
      videoUrl = (output as URL).href
    } else if (output && (output as any).toString) {
      const strValue = (output as any).toString()
      if (strValue.startsWith('http')) {
        videoUrl = strValue
      }
    }

    if (!videoUrl || !videoUrl.startsWith('http')) {
      console.error('Failed to extract video URL. Output was:', output)
      throw new Error('No valid video URL extracted from Replicate response')
    }

    console.log('=== AI Video Generation Completed ===')
    console.log(`Video URL: ${videoUrl}`)

    // Save to database
    const { data: content, error: insertError } = await supabase
      .from('contents')
      .insert({
        brand_id: brandId,
        topic: language === 'ko' ? 'AI 생성 비디오' : 'AI Generated Video',
        body: videoUrl,
        content_type: 'ai_video',
        ai_model: 'stable-video-diffusion',
        platform_variations: {
          default: {
            videoUrl,
            sourceImage: imageUrl,
            motion,
            model: 'stable-video-diffusion',
          }
        },
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Video was generated but DB save failed - still return the video
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      content,
      metadata: {
        sourceImage: imageUrl,
        motion,
        model: 'stable-video-diffusion-xt',
        duration: '~3 seconds',
        frames: 25,
        fps: 8
      }
    })

  } catch (error) {
    console.error('AI Video generation error:', error)

    // Replicate API error handling
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
        error: 'AI 비디오 생성 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
