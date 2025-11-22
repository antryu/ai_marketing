import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Ollama API 호출 함수
async function generateWithOllama(prompt: string, model: string = "qwen2.5:14b-instruct-q4_K_M") {
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

// Claude API 호출 함수
async function generateWithClaude(prompt: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1000,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }]
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic, brandId, platform, tone, length, ollamaModel } = await request.json()

    if (!topic || !brandId) {
      return NextResponse.json(
        { error: "토픽과 브랜드는 필수입니다" },
        { status: 400 }
      )
    }

    // Get brand information
    const { data: brand } = await supabase
      .from("brands")
      .select("*, personas(*)")
      .eq("id", brandId)
      .single()

    if (!brand) {
      return NextResponse.json(
        { error: "브랜드를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Platform-specific content generation
    const platformSettings = {
      thread: {
        maxLength: 500,
        style: "감성적, 스토리텔링",
        format: "짧은 form"
      },
      linkedin: {
        maxLength: 1500,
        style: "데이터 중심, ROI 중심",
        format: "긴 form"
      },
      instagram: {
        maxLength: 300,
        style: "비주얼 중심, 감성적",
        format: "캡션"
      }
    }

    const settings = platformSettings[platform as keyof typeof platformSettings] || platformSettings.thread

    // 프롬프트 생성
    const prompt = `당신은 ${brand.name}의 전문 마케팅 콘텐츠 작성자입니다.

제품 정보:
- 이름: ${brand.name}
- 설명: ${brand.description}
- 타겟 시장: ${brand.target_market?.join(", ") || "글로벌"}
- 브랜드 톤: ${brand.brand_voice?.tone || "전문적인"}
- 브랜드 스타일: ${brand.brand_voice?.style || "친근한"}

플랫폼: ${platform}
스타일: ${settings.style}
최대 길이: ${settings.maxLength}자
형식: ${settings.format}

타겟 페르소나:
${brand.personas?.map((p: any) => `- ${p.name}: ${p.description}`).join("\n") || "일반 대중"}

다음 지침을 따라 콘텐츠를 생성하세요:
1. 플랫폼에 최적화된 형식으로 작성
2. 브랜드 보이스와 톤 유지
3. 타겟 페르소나의 관심사와 페인 포인트 반영
4. 실제 가치 제공에 집중
5. CTA(Call-to-Action) 자연스럽게 포함

토픽: ${topic}

위 토픽으로 ${platform}에 발행할 콘텐츠를 작성해주세요.`

    // 병렬로 두 AI 모델 실행
    const startTime = Date.now()

    const [claudeResult, ollamaResult] = await Promise.allSettled([
      generateWithClaude(prompt),
      generateWithOllama(prompt, ollamaModel || "qwen2.5:14b-instruct-q4_K_M")
    ])

    const endTime = Date.now()

    // 결과 처리
    const claudeContent = claudeResult.status === 'fulfilled' ? claudeResult.value : null
    const claudeError = claudeResult.status === 'rejected' ? (claudeResult.reason as Error).message : null

    const ollamaContent = ollamaResult.status === 'fulfilled' ? ollamaResult.value : null
    const ollamaError = ollamaResult.status === 'rejected' ? (ollamaResult.reason as Error).message : null

    // Claude 결과 저장 (성공한 경우)
    let claudeContentId = null
    if (claudeContent) {
      const { data: saved } = await supabase
        .from("contents")
        .insert({
          brand_id: brandId,
          topic,
          body: claudeContent,
          content_type: "text",
          ai_model: "claude-3-haiku-20240307",
          platform_variations: {
            [platform]: {
              text: claudeContent,
              tone,
              length
            }
          },
          status: "draft"
        })
        .select()
        .single()

      claudeContentId = saved?.id
    }

    // Ollama 결과 저장 (성공한 경우)
    let ollamaContentId = null
    if (ollamaContent) {
      const { data: saved } = await supabase
        .from("contents")
        .insert({
          brand_id: brandId,
          topic: `${topic} (Ollama)`,
          body: ollamaContent,
          content_type: "text",
          ai_model: ollamaModel || "qwen2.5:14b",
          platform_variations: {
            [platform]: {
              text: ollamaContent,
              tone,
              length
            }
          },
          status: "draft"
        })
        .select()
        .single()

      ollamaContentId = saved?.id
    }

    return NextResponse.json({
      success: true,
      comparison: {
        claude: {
          content: claudeContent,
          contentId: claudeContentId,
          error: claudeError,
          model: "claude-3-haiku-20240307"
        },
        ollama: {
          content: ollamaContent,
          contentId: ollamaContentId,
          error: ollamaError,
          model: ollamaModel || "qwen2.5:14b"
        },
        generationTime: endTime - startTime
      }
    })

  } catch (error: any) {
    console.error("Content comparison error:", error)
    return NextResponse.json(
      { error: error.message || "콘텐츠 비교 생성 실패" },
      { status: 500 }
    )
  }
}
