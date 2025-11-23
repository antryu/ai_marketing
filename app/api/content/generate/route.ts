import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic, brandId, platform, tone, length, writerPersonaId, aiModel } = await request.json()

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

    // Get writer persona if specified
    let writerPersona = null
    if (writerPersonaId) {
      const { data } = await supabase
        .from("writer_personas")
        .select("*")
        .eq("id", writerPersonaId)
        .single()
      writerPersona = data
    } else {
      // Get default writer persona
      const { data } = await supabase
        .from("writer_personas")
        .select("*")
        .eq("user_id" as any, user.id as any)
        .eq("is_default", true)
        .single()
      writerPersona = data
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

    // Build writer persona context
    let writerContext = ""
    if (writerPersona) {
      writerContext = `

작성자 페르소나 (당신의 특성):
- 이름: ${writerPersona.name}
- 글쓰기 스타일: ${writerPersona.writing_style}
- 톤: ${writerPersona.tone}
- 전문 분야: ${writerPersona.expertise_areas?.join(", ") || "일반"}
${writerPersona.unique_perspective ? `- 관점/시각: ${writerPersona.unique_perspective}` : ""}
${writerPersona.catchphrase ? `- 캐치프레이즈: "${writerPersona.catchphrase}"` : ""}

언어 스타일:
- 이모지 사용: ${writerPersona.language_preferences?.emoji_usage || "적당히"}
- 문장 길이: ${writerPersona.language_preferences?.sentence_length || "중간"}
- 기술 용어 사용: ${writerPersona.language_preferences?.technical_terms ? "예" : "아니오"}
- 비유/은유 사용: ${writerPersona.language_preferences?.use_analogies ? "예" : "아니오"}
- 데이터/통계 활용: ${writerPersona.language_preferences?.use_data_statistics ? "예" : "아니오"}

${writerPersona.signature_phrases?.length > 0 ? `자주 사용하는 표현: ${writerPersona.signature_phrases.join(", ")}` : ""}

이 작성자 페르소나의 스타일과 톤을 반영하여 콘텐츠를 작성해주세요.`
    }

    // Call AI API
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
${writerContext}

다음 지침을 따라 콘텐츠를 생성하세요:
1. 플랫폼에 최적화된 형식으로 작성
2. 브랜드 보이스와 톤 유지
3. 타겟 페르소나의 관심사와 페인 포인트 반영
4. 작성자 페르소나의 스타일과 특성 반영
5. 실제 가치 제공에 집중
6. CTA(Call-to-Action) 자연스럽게 포함

토픽: ${topic}

위 토픽으로 ${platform}에 발행할 콘텐츠를 작성해주세요.`

    let generatedContent: string

    // Ollama 모델 사용 여부 확인
    const ollamaModels = ['qwen2.5:7b', 'phi3:3.8b', 'llama3.2:3b', 'gemma2:2b']
    const useOllama = aiModel && ollamaModels.includes(aiModel)

    if (useOllama) {
      // Ollama로 생성
      generatedContent = await generateWithOllama(prompt, aiModel)
    } else {
      // Claude로 생성
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })

      const responseContent = response.content[0]
      if (responseContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      generatedContent = responseContent.text
    }

    // Save to database
    const { data: content, error } = await supabase
      .from("contents")
      .insert({
        brand_id: brandId,
        writer_persona_id: writerPersona?.id || null,
        topic,
        body: generatedContent,
        content_type: "text",
        ai_model: aiModel || "claude-3-haiku-20240307",
        platform_variations: {
          [platform]: {
            text: generatedContent,
            tone,
            length
          }
        },
        status: "draft"
      } as any)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update writer persona usage count
    if (writerPersona) {
      await supabase
        .from("writer_personas")
        .update({ usage_count: (writerPersona.usage_count || 0) + 1 })
        .eq("id", writerPersona.id)
    }

    return NextResponse.json({
      success: true,
      content,
      generated: generatedContent
    })

  } catch (error: any) {
    console.error("Content generation error:", error)
    return NextResponse.json(
      { error: error.message || "콘텐츠 생성 실패" },
      { status: 500 }
    )
  }
}
