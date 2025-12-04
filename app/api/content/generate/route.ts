import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"
import {
  StoryFrame,
  GenerationMode,
  EmotionalTone,
  EngagementGoal,
  STORY_FRAME_TEMPLATES,
  EMOTIONAL_TONE_STYLES,
  ENGAGEMENT_GOAL_CTAS,
  ContentMetadata
} from "@/types/mirra-content.types"

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

// 스토리 프레임별 프롬프트 생성
function buildStoryFramePrompt(
  storyFrame: StoryFrame,
  topic: string,
  customHook?: string
): string {
  const template = STORY_FRAME_TEMPLATES[storyFrame]

  let prompt = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 스토리 프레임: ${template.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**목적**: ${template.description}

**구조** (반드시 이 순서대로 작성):
${template.structure.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

**시작 훅 스타일**:
${template.hookExamples.map(hook => `- "${hook}"`).join('\n')}

${customHook ? `\n**사용자 지정 훅**: "${customHook}"` : ''}

**토픽**: ${topic}

위 구조를 따라 자연스럽고 몰입감 있는 스토리를 작성하세요.
각 단계가 매끄럽게 연결되도록 하고, 독자가 끝까지 읽고 싶어지도록 만드세요.
`

  return prompt
}

// 감정 톤 프롬프트 생성
function buildEmotionalTonePrompt(tone: EmotionalTone): string {
  return `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 감정 톤: ${tone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${EMOTIONAL_TONE_STYLES[tone]}

이 톤을 콘텐츠 전체에 일관되게 유지하세요.
`
}

// 목표 프롬프트 생성
function buildEngagementGoalPrompt(goal: EngagementGoal): string {
  const ctas = ENGAGEMENT_GOAL_CTAS[goal]

  return `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 콘텐츠 목표: ${goal}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 목표를 달성하기 위한 CTA 예시:
${ctas.map(cta => `- "${cta}"`).join('\n')}

콘텐츠의 흐름과 결론이 이 목표를 자연스럽게 달성하도록 구성하세요.
`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      topic,
      brandId,
      platform,
      tone,
      length,
      writerPersonaId,
      aiModel,
      language,
      seoKeywords,
      // Mirra 스타일 필드
      storyFrame,
      generationMode,
      emotionalTone,
      engagementGoal,
      customHook
    } = await request.json()

    if (!topic || !brandId) {
      return NextResponse.json(
        { error: language === "en" ? "Topic and brand are required" : "토픽과 브랜드는 필수입니다" },
        { status: 400 }
      )
    }

    // Mirra 스타일 필드 검증
    if (!storyFrame || !emotionalTone || !engagementGoal) {
      return NextResponse.json(
        { error: "스토리 프레임, 감정 톤, 목표는 필수입니다" },
        { status: 400 }
      )
    }

    // Get brand information
    const brandResult = await (supabase as any)
      .from("brands")
      .select("*, personas(*)")
      .eq("id", brandId)
      .single()

    const brand = brandResult.data

    if (!brand) {
      return NextResponse.json(
        { error: language === "en" ? "Brand not found" : "브랜드를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Get writer persona if specified
    let writerPersona = null
    if (writerPersonaId) {
      const result = await (supabase as any)
        .from("writer_personas")
        .select("*")
        .eq("id", writerPersonaId)
        .single()
      writerPersona = result.data
    } else {
      // Get default writer persona
      const result = await (supabase as any)
        .from("writer_personas")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single()
      writerPersona = result.data
    }

    // Length multipliers based on user selection
    const lengthMultipliers = {
      short: 0.7,
      medium: 1.0,
      long: 1.3
    }
    const multiplier = lengthMultipliers[length as keyof typeof lengthMultipliers] || 1.0

    // Platform-specific content generation
    const platformSettings = {
      thread: {
        maxLength: Math.round(500 * multiplier),
        minLength: Math.round(400 * multiplier),
        maxTokens: Math.round(800 * multiplier),
        style: "감성적, 스토리텔링, 완전한 반말체 (존댓말 절대 사용 금지, 친구에게 말하듯 편하고 캐주얼한 톤)",
        format: "짧은 form"
      },
      linkedin: {
        maxLength: Math.round(1500 * multiplier),
        minLength: Math.round(1200 * multiplier),
        maxTokens: Math.round(2400 * multiplier),
        style: "전문적, 데이터 중심, ROI 중심",
        format: "긴 form"
      },
      instagram: {
        maxLength: Math.round(300 * multiplier),
        minLength: Math.round(200 * multiplier),
        maxTokens: Math.round(500 * multiplier),
        style: "비주얼 중심, 감성적",
        format: "캡션"
      },
      twitter: {
        maxLength: Math.min(280, Math.round(280 * multiplier)),
        minLength: Math.round(200 * multiplier),
        maxTokens: Math.round(450 * multiplier),
        style: "간결하고 임팩트 있는",
        format: "짧은 form"
      },
      naver: {
        maxLength: Math.round(2500 * multiplier),
        minLength: Math.round(2000 * multiplier),
        maxTokens: Math.round(4000 * multiplier),
        style: "친근하고 상세한, 한국 독자 맞춤, 실용적 정보 제공, SEO 최적화",
        format: "블로그 포스트"
      },
      tistory: {
        maxLength: Math.round(2000 * multiplier),
        minLength: Math.round(1600 * multiplier),
        maxTokens: Math.round(3200 * multiplier),
        style: "체계적이고 구조화된, 단계별 가이드, 기술적 디테일 포함",
        format: "블로그 포스트"
      }
    }

    // Build writer persona context
    let writerContext = ""
    if (writerPersona) {
      const persona = writerPersona as any
      writerContext = `

작성자 페르소나 (당신의 특성):
- 이름: ${persona.name}
- 글쓰기 스타일: ${persona.writing_style}
- 톤: ${persona.tone}
- 전문 분야: ${persona.expertise_areas?.join(", ") || "일반"}
${persona.unique_perspective ? `- 관점/시각: ${persona.unique_perspective}` : ""}
${persona.catchphrase ? `- 캐치프레이즈: "${persona.catchphrase}"` : ""}

언어 스타일:
- 이모지 사용: ${persona.language_preferences?.emoji_usage || "적당히"}
- 문장 길이: ${persona.language_preferences?.sentence_length || "중간"}
- 기술 용어 사용: ${persona.language_preferences?.technical_terms ? "예" : "아니오"}
- 비유/은유 사용: ${persona.language_preferences?.use_analogies ? "예" : "아니오"}
- 데이터/통계 활용: ${persona.language_preferences?.use_data_statistics ? "예" : "아니오"}

${persona.signature_phrases?.length > 0 ? `자주 사용하는 표현: ${persona.signature_phrases.join(", ")}` : ""}

이 작성자 페르소나의 스타일과 톤을 반영하여 콘텐츠를 작성해주세요.`
    }

    // Type assertion for brand
    const typedBrand = brand as any

    // Use the platform specified in the request
    const platformKey = platform || 'naver'
    const settings = platformSettings[platformKey as keyof typeof platformSettings] || platformSettings.naver

    console.log(`\n=== Mirra 스타일 ${platformKey} 콘텐츠 생성 시작 ===`)
    console.log(`스토리 프레임: ${storyFrame}`)
    console.log(`감정 톤: ${emotionalTone}`)
    console.log(`목표: ${engagementGoal}`)

    // Ollama 모델 사용 여부 확인
    const ollamaModels = ['qwen2.5:7b', 'phi3:3.8b', 'llama3.2:3b', 'gemma2:2b']
    const useOllama = aiModel && ollamaModels.includes(aiModel)

    // Mirra 스타일 프롬프트 구성
    const storyFramePrompt = buildStoryFramePrompt(storyFrame, topic, customHook)
    const emotionalTonePrompt = buildEmotionalTonePrompt(emotionalTone)
    const engagementGoalPrompt = buildEngagementGoalPrompt(engagementGoal)

    const prompt = `당신은 한국어만 사용하는 전문 마케팅 콘텐츠 작성자입니다.
절대 영어, 중국어, 일본어를 사용하지 마세요. 오직 한국어로만 답변하세요.

당신은 ${typedBrand.name}의 전문 마케팅 콘텐츠 작성자입니다.
중요: 반드시 한국어로만 작성하세요.

제품 정보:
- 이름: ${typedBrand.name}
- 설명: ${typedBrand.description}
- 타겟 시장: ${typedBrand.target_market?.join(", ") || "글로벌"}
- 브랜드 톤: ${typedBrand.brand_voice?.tone || "전문적인"}
- 브랜드 스타일: ${typedBrand.brand_voice?.style || "친근한"}

플랫폼: ${platformKey}
스타일: ${settings.style}
최대 길이: ${settings.maxLength}자
형식: ${settings.format}
${seoKeywords && seoKeywords.length > 0 ? `
SEO 키워드 (반드시 포함): ${seoKeywords.join(", ")}
- 이 키워드들을 자연스럽게 본문에 포함시켜주세요` : ""}

타겟 페르소나:
${typedBrand.personas?.map((p: any) => {
  let personaInfo = `- ${p.name}: ${p.description}`
  const traits = []
  if (p.mbti) traits.push(`MBTI ${p.mbti}`)
  if (p.generation) traits.push(`${p.generation}`)
  if (p.blood_type) traits.push(`${p.blood_type}형`)
  if (traits.length > 0) {
    personaInfo += ` (${traits.join(", ")})`
  }
  return personaInfo
}).join("\n") || "일반 대중"}

${writerContext}

${storyFramePrompt}
${emotionalTonePrompt}
${engagementGoalPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 중요: 글자수 요구사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최소 글자수: ${settings.minLength}자 (필수)
최대 글자수: ${settings.maxLength}자 (절대 초과 금지)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 작성 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **스토리 프레임 구조를 철저히 따르세요**
   - 각 단계가 자연스럽게 연결되어야 합니다
   - 독자가 다음 문장을 읽고 싶어지도록 만드세요

2. **감정 톤을 일관되게 유지하세요**
   - 문장 구조, 단어 선택, 표현 방식 모두 톤에 맞춰야 합니다

3. **목표를 향해 나아가세요**
   - 콘텐츠 전체가 설정된 목표를 달성하도록 구성하세요
   - 마지막에는 자연스러운 CTA로 마무리하세요

4. **진정성을 담으세요**
   - 뻔한 말이나 클리셰는 피하세요
   - 구체적인 예시와 디테일을 사용하세요
   - 독자가 "나의 이야기"라고 느끼도록 만드세요

5. **마크다운 형식 사용**
   - ## 로 소제목 구분
   - **굵게** 강조
   - - 리스트 활용

출력 요구사항:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 언어: 100% 한국어만 사용
2. 코드 블록 사용 금지 (NO \`\`\`markdown blocks)
3. 마크다운 형식 사용 가능
4. 바로 콘텐츠 작성 시작

지금 바로 한국어로만 콘텐츠를 작성하세요!
`

    let generatedContent: string

    if (useOllama) {
      generatedContent = await generateWithOllama(prompt, aiModel)
    } else {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: settings.maxTokens,
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

    // 마크다운 코드 블록 제거
    generatedContent = generatedContent
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    console.log(`✅ ${platformKey} 콘텐츠 생성 완료:`)
    console.log(`   - 길이: ${generatedContent.length}자`)
    console.log(`   - 미리보기: ${generatedContent.substring(0, 100)}...`)

    // Store content for the specified platform
    const platformVariations: Record<string, {
      text: string;
      tone: string;
      length: string;
      metadata?: {
        storyFrame?: StoryFrame;
        generationMode?: GenerationMode;
        emotionalTone?: EmotionalTone;
        engagementGoal?: EngagementGoal;
        selectedHook?: string;
      }
    }> = {
      [platformKey]: {
        text: generatedContent,
        tone,
        length
      }
    }

    // Mirra 스타일 메타데이터 (platform_variations에 포함)
    if (storyFrame || emotionalTone || engagementGoal) {
      platformVariations[platformKey].metadata = {
        storyFrame,
        generationMode: generationMode || 'creative',
        emotionalTone,
        engagementGoal,
        selectedHook: customHook
      }
    }

    // Save to database
    const contentResult = await (supabase as any)
      .from("contents")
      .insert({
        brand_id: brandId,
        writer_persona_id: (writerPersona as any)?.id || null,
        topic,
        body: generatedContent,
        content_type: "text",
        ai_model: aiModel || "claude-opus-4-20250514",
        platform_variations: platformVariations,
        status: "draft"
      })
      .select()
      .single()

    if (contentResult.error) {
      throw contentResult.error
    }

    const content = contentResult.data

    // Update writer persona usage count
    if (writerPersona) {
      const persona = writerPersona as any
      await (supabase as any)
        .from("writer_personas")
        .update({ usage_count: (persona.usage_count || 0) + 1 })
        .eq("id", persona.id)
    }

    return NextResponse.json({
      success: true,
      content,
      generated: generatedContent,
      metadata: platformVariations[platformKey].metadata || null
    })

  } catch (error: any) {
    console.error("Content generation error:", error)
    const { language } = await request.json().catch(() => ({ language: "ko" }))
    return NextResponse.json(
      { error: error.message || (language === "en" ? "Content generation failed" : "콘텐츠 생성 실패") },
      { status: 500 }
    )
  }
}

// PUT 메서드 - 콘텐츠 정제
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, action, customInstruction } = await request.json()

    if (!contentId || !action) {
      return NextResponse.json(
        { error: "콘텐츠 ID와 액션은 필수입니다" },
        { status: 400 }
      )
    }

    // Get existing content
    const contentResult = await (supabase as any)
      .from("contents")
      .select("*")
      .eq("id", contentId)
      .single()

    if (contentResult.error || !contentResult.data) {
      return NextResponse.json(
        { error: "콘텐츠를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    const existingContent = contentResult.data
    const currentBody = existingContent.body
    // metadata는 platform_variations에서 가져옴
    const platformKey = Object.keys(existingContent.platform_variations || {})[0]
    const metadata = platformKey ? existingContent.platform_variations[platformKey]?.metadata : null

    // 액션별 프롬프트 생성
    let refinePrompt = ""

    switch (action) {
      case "refine":
        refinePrompt = `다음 콘텐츠를 더 완성도 있게 다듬어주세요:
- 문장을 더 자연스럽고 매끄럽게
- 표현을 더 생동감 있게
- 논리 흐름을 더 명확하게
- 불필요한 부분은 삭제

원본:
${currentBody}

개선된 버전을 작성하세요.`
        break

      case "add_hook":
        refinePrompt = `다음 콘텐츠의 시작 부분을 더 강력한 훅으로 개선해주세요:
- 첫 문장이 독자의 시선을 사로잡아야 합니다
- 호기심을 자극하는 질문이나 놀라운 사실로 시작
- 공감을 불러일으키는 상황 묘사

원본:
${currentBody}

훅이 강화된 버전을 작성하세요.`
        break

      case "shorten":
        refinePrompt = `다음 콘텐츠를 30% 더 짧게 만들어주세요:
- 핵심 메시지는 유지
- 불필요한 수식어 제거
- 중복 내용 통합
- 간결하고 임팩트 있게

원본 (${currentBody.length}자):
${currentBody}

짧아진 버전을 작성하세요.`
        break

      case "expand":
        refinePrompt = `다음 콘텐츠를 30% 더 길게 확장해주세요:
- 구체적인 예시 추가
- 더 많은 디테일과 설명
- 추가 인사이트 제공
- 독자에게 더 많은 가치 전달

원본 (${currentBody.length}자):
${currentBody}

확장된 버전을 작성하세요.`
        break

      case "adjust_tone":
        refinePrompt = `다음 콘텐츠의 톤을 조정해주세요:
${customInstruction ? `- 목표 톤: ${customInstruction}` : '- 더 진솔하고 공감 가는 톤으로'}
- 메시지는 유지하되 톤만 변경
- 일관된 톤을 유지

원본:
${currentBody}

톤이 조정된 버전을 작성하세요.`
        break

      default:
        return NextResponse.json(
          { error: "지원하지 않는 액션입니다" },
          { status: 400 }
        )
    }

    // Claude로 정제
    const response = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `당신은 전문 콘텐츠 에디터입니다.

${refinePrompt}

중요:
- 한국어로만 작성
- 코드 블록 사용 금지
- 마크다운 형식 유지
- 바로 결과물만 작성 (설명 없이)`
        }
      ]
    })

    const responseContent = response.content[0]
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const refinedContent = responseContent.text
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // 메타데이터 업데이트 (platform_variations에 포함)
    const updatedPlatformVariations = { ...existingContent.platform_variations }
    if (platformKey && updatedPlatformVariations[platformKey]) {
      updatedPlatformVariations[platformKey].metadata = {
        ...metadata,
        status: 'refined'
      }
    }

    // Update database
    const updateResult = await (supabase as any)
      .from("contents")
      .update({
        body: refinedContent,
        platform_variations: updatedPlatformVariations,
        updated_at: new Date().toISOString()
      })
      .eq("id", contentId)
      .select()
      .single()

    if (updateResult.error) {
      throw updateResult.error
    }

    return NextResponse.json({
      success: true,
      content: updateResult.data,
      refined: refinedContent,
      action
    })

  } catch (error: any) {
    console.error("Content refine error:", error)
    return NextResponse.json(
      { error: error.message || "콘텐츠 정제 실패" },
      { status: 500 }
    )
  }
}
