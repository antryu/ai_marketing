import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoScene, VideoGenerationParams } from '@/types/video.types'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Ollama API 호출 함수
async function generateWithOllama(prompt: string, model: string = "qwen2.5:7b") {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.response
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brandId, topic, platform, duration, style, aiModel } = await request.json() as VideoGenerationParams & { brandId: string, aiModel?: string }

    if (!topic || !brandId) {
      return NextResponse.json(
        { error: '토픽과 브랜드는 필수입니다' },
        { status: 400 }
      )
    }

    // Get brand information
    const brandResult: any = await supabase
      .from('brands')
      .select('*, personas(*)')
      .eq('id' as any, brandId as any)
      .single()

    const brand = brandResult.data

    if (!brand) {
      return NextResponse.json(
        { error: '브랜드를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Call AI to generate video script
    const scenes = await generateVideoScenes({
      brand,
      topic,
      platform: platform || 'youtube',
      duration: duration || 15,
      style: style || 'professional',
      aiModel: aiModel || 'claude'
    })

    // Save video project to database
    const projectResult: any = await supabase
      .from('video_projects')
      .insert({
        brand_id: brandId,
        title: `${topic} - AI 생성`,
        format: getFormatForPlatform(platform || 'youtube'),
        quality: '1080p',
        duration: duration || 15,
        scenes: scenes,
        status: 'draft',
        metadata: {
          ai_generated: true,
          model: aiModel || 'claude',
          topic,
          platform,
          style
        }
      } as any)
      .select()
      .single()

    if (projectResult.error) {
      throw projectResult.error
    }

    const project = projectResult.data

    return NextResponse.json({
      success: true,
      project,
      scenes
    })

  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: error.message || '비디오 생성 실패' },
      { status: 500 }
    )
  }
}

async function generateVideoScenes(params: VideoGenerationParams & { aiModel?: string }): Promise<VideoScene[]> {
  const { brand, topic, platform, duration, style, aiModel } = params

  const platformSpecs = {
    youtube: {
      format: '16:9',
      style: '전문적이고 정보 중심적',
      avgSceneDuration: 5
    },
    instagram: {
      format: '9:16',
      style: '감성적이고 시각적',
      avgSceneDuration: 3
    },
    tiktok: {
      format: '9:16',
      style: '역동적이고 트렌디',
      avgSceneDuration: 2
    },
    linkedin: {
      format: '16:9',
      style: 'B2B 전문적, 데이터 중심',
      avgSceneDuration: 4
    }
  }

  const spec = platformSpecs[platform] || platformSpecs.youtube

  // Type assertion for brand
  const typedBrand = brand as any

  const prompt = `당신은 전문 비디오 스크립트 작성자입니다.

브랜드 정보:
- 이름: ${typedBrand.name}
- 설명: ${typedBrand.description}
- 타겟 시장: ${typedBrand.target_market?.join(', ') || '글로벌'}
- 브랜드 톤: ${typedBrand.brand_voice?.tone || '전문적인'}

비디오 사양:
- 플랫폼: ${platform}
- 총 길이: ${duration}초
- 스타일: ${style}
- 형식: ${spec.format}
- 플랫폼 특성: ${spec.style}

주제: ${topic}

위 정보를 바탕으로 ${duration}초 분량의 비디오를 위한 씬별 스크립트를 작성해주세요.
각 씬은 다음 JSON 형식으로 작성해주세요:

{
  "scenes": [
    {
      "order": 0,
      "duration": 3,
      "script": "씬에서 보여줄 내용",
      "visualDescription": "시각적 요소 설명",
      "textElements": [
        {
          "content": "화면에 표시될 텍스트",
          "emphasis": "high|medium|low"
        }
      ],
      "backgroundColor": "hex color or gradient suggestion"
    }
  ]
}

응답은 반드시 유효한 JSON 형식이어야 합니다. JSON만 반환하고 다른 텍스트는 포함하지 마세요.`

  let responseText: string

  // Ollama 모델 사용 여부 확인
  const ollamaModels = ['qwen2.5:7b', 'phi3:3.8b', 'llama3.2:3b', 'gemma2:2b', 'gemini-3-pro-preview:latest']
  const useOllama = aiModel && ollamaModels.includes(aiModel)

  if (useOllama) {
    // Ollama로 생성
    responseText = await generateWithOllama(prompt, aiModel)
  } else {
    // Claude로 생성
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }
    responseText = content.text
  }

  // JSON 추출 (응답에서 JSON 부분만 파싱)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 응답에서 JSON을 찾을 수 없습니다')
  }

  const scriptData = JSON.parse(jsonMatch[0])

  // Convert AI-generated script to VideoScene format
  const scenes: VideoScene[] = scriptData.scenes.map((scene: any, index: number) => {
    const backgroundColor = parseBackgroundColor(scene.backgroundColor)

    return {
      id: `scene-${Date.now()}-${index}`,
      order: index,
      duration: scene.duration || spec.avgSceneDuration,
      background: backgroundColor,
      elements: scene.textElements.map((text: any, textIndex: number) => ({
        id: `element-${Date.now()}-${index}-${textIndex}`,
        type: 'text' as const,
        position: {
          x: 50,
          y: 40 + (textIndex * 10)
        },
        size: {
          width: 80,
          height: 10
        },
        content: text.content,
        style: {
          fontSize: text.emphasis === 'high' ? 56 : text.emphasis === 'medium' ? 40 : 32,
          fontWeight: text.emphasis === 'high' ? 700 : 600,
          color: '#ffffff',
          textAlign: 'center' as const,
          shadow: {
            x: 0,
            y: 2,
            blur: 10,
            color: 'rgba(0,0,0,0.2)'
          }
        },
        animation: {
          type: 'fadeIn',
          duration: 0.8,
          delay: textIndex * 0.3
        }
      })),
      transition: index < scriptData.scenes.length - 1 ? {
        type: 'fade',
        duration: 0.5
      } : undefined
    }
  })

  return scenes
}

function parseBackgroundColor(colorString: string): VideoScene['background'] {
  if (!colorString) {
    return {
      type: 'gradient',
      value: {
        type: 'linear',
        colors: ['#667eea', '#764ba2'],
        angle: 135
      }
    }
  }

  // Check if it's a gradient description
  if (colorString.toLowerCase().includes('gradient')) {
    return {
      type: 'gradient',
      value: {
        type: 'linear',
        colors: ['#6366f1', '#8b5cf6'],
        angle: 135
      }
    }
  }

  // Single color
  return {
    type: 'color',
    value: colorString
  }
}

function getFormatForPlatform(platform: string): '16:9' | '9:16' | '1:1' | '4:5' {
  const formats = {
    youtube: '16:9',
    instagram: '9:16',
    tiktok: '9:16',
    linkedin: '16:9',
    facebook: '1:1',
    twitter: '16:9'
  } as const

  return formats[platform as keyof typeof formats] || '16:9'
}
