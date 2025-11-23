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
    const brandResult = await (supabase as any)
      .from("brands")
      .select("*, personas(*)")
      .eq("id", brandId)
      .single()

    const brand = brandResult.data

    if (!brand) {
      return NextResponse.json(
        { error: "브랜드를 찾을 수 없습니다" },
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

    // Platform-specific content generation
    const platformSettings = {
      thread: {
        maxLength: 500,
        style: "감성적, 스토리텔링, 반말체 (친근하고 캐주얼한 톤)",
        format: "짧은 form"
      },
      linkedin: {
        maxLength: 1500,
        style: "전문적, 데이터 중심, ROI 중심",
        format: "긴 form"
      },
      instagram: {
        maxLength: 300,
        style: "비주얼 중심, 감성적",
        format: "캡션"
      },
      twitter: {
        maxLength: 280,
        style: "간결하고 임팩트 있는",
        format: "짧은 form"
      },
      naver: {
        maxLength: 2500,
        style: "친근하고 상세한, 한국 독자 맞춤, 실용적 정보 제공, SEO 최적화",
        format: "블로그 포스트"
      },
      tistory: {
        maxLength: 2000,
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

    // Determine which platforms to generate content for
    const platformsToGenerate = platform === 'all'
      ? ['thread', 'linkedin', 'twitter', 'instagram', 'naver', 'tistory']
      : [platform]

    const platformVariations: Record<string, { text: string; tone: string; length: string }> = {}

    // Ollama 모델 사용 여부 확인
    const ollamaModels = ['qwen2.5:7b', 'phi3:3.8b', 'llama3.2:3b', 'gemma2:2b']
    const useOllama = aiModel && ollamaModels.includes(aiModel)

    // Generate content for each platform
    console.log(`\n=== 플랫폼 생성 시작 ===`)
    console.log(`총 ${platformsToGenerate.length}개 플랫폼 생성 예정:`, platformsToGenerate)

    for (const platformKey of platformsToGenerate) {
      console.log(`\n--- ${platformKey} 콘텐츠 생성 중 ---`)
      const settings = platformSettings[platformKey as keyof typeof platformSettings]
      console.log(`설정: 최대 ${settings.maxLength}자, 스타일: ${settings.style}`)

      const prompt = `당신은 한국어만 사용하는 전문 마케팅 콘텐츠 작성자입니다.
절대 영어, 중국어, 일본어를 사용하지 마세요. 오직 한국어로만 답변하세요.

You are a professional Korean marketing content writer.
CRITICAL INSTRUCTION: You MUST write EXCLUSIVELY in Korean language (한글).
NEVER use English, Chinese, Japanese, or any other language.
If you write in English, Chinese, or any language other than Korean, you will FAIL this task.

당신은 ${typedBrand.name}의 전문 마케팅 콘텐츠 작성자입니다.
중요: 반드시 한국어로만 작성하세요. 영어, 중국어, 일본어 또는 다른 언어를 절대 사용하지 마세요.

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

타겟 페르소나:
${typedBrand.personas?.map((p: any) => `- ${p.name}: ${p.description}`).join("\n") || "일반 대중"}
${writerContext}

다음 지침을 따라 콘텐츠를 생성하세요:
1. **반드시 한국어로 작성** - 모든 콘텐츠는 한국어로 작성해야 합니다
${platformKey === 'thread' ? `2. **반말체 사용 필수** - "~요", "~니다" 대신 "~야", "~어", "~지" 등 반말로 작성
   예시: "이걸 알아야 해", "정말 좋아", "한번 해봐" 등의 친근한 반말체` : '2. 존댓말 사용'}
3. ${platformKey} 플랫폼에 최적화된 형식으로 작성
4. 브랜드 보이스와 톤 유지
5. 타겟 페르소나의 관심사와 페인 포인트 반영
6. 작성자 페르소나의 스타일과 특성 반영
7. 실제 가치 제공에 집중
8. CTA(Call-to-Action) 자연스럽게 포함
9. ${settings.maxLength}자 이내로 작성
${platformKey === 'naver' || platformKey === 'tistory' ? `
10. **블로그 형식** - 서론, 본론, 결론 구조 사용
11. **소제목 활용** - ## 마크다운으로 명확한 섹션 구분
12. **SEO 최적화** - 키워드 자연스럽게 배치
13. **가독성** - 단락 구분, 리스트 활용
14. **실용성** - 구체적 예시, 팁, 단계별 가이드 포함` : ''}

토픽: ${topic}

위 토픽으로 ${platformKey}에 발행할 콘텐츠를 작성해주세요.${platformKey === 'naver' || platformKey === 'tistory' ? ' 블로그 독자가 끝까지 읽고 실행할 수 있도록 상세하고 구조적으로 작성하세요.' : ' 플랫폼에 맞게 간결하고 임팩트 있게 작성하세요.'}

출력 요구사항 / OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 언어: 100% 한국어만 사용 (Korean language ONLY)
2. 영어 금지 (NO English words)
3. 중국어/일본어 금지 (NO Chinese/Japanese)
4. 코드 블록 사용 금지 (NO \`\`\`markdown blocks)
5. 마크다운 형식 사용 가능 (Use markdown: #, **, - for lists)
6. 바로 한국어 콘텐츠 작성 시작 (Start writing Korean content immediately)

⚠️ 경고: 영어나 다른 언어를 사용하면 실패합니다!
WARNING: Using English or other languages will FAIL this task!

지금 바로 한국어로만 콘텐츠를 작성하세요!
Start writing in Korean NOW!`

      let generatedContent: string

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

      // 마크다운 코드 블록 제거
      generatedContent = generatedContent
        .replace(/```markdown\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      platformVariations[platformKey] = {
        text: generatedContent,
        tone,
        length
      }

      console.log(`✅ ${platformKey} 생성 완료:`)
      console.log(`   - 길이: ${generatedContent.length}자`)
      console.log(`   - 미리보기: ${generatedContent.substring(0, 100)}...`)
    }

    console.log(`\n=== 모든 플랫폼 생성 완료 ===`)
    console.log(`생성된 플랫폼 수: ${Object.keys(platformVariations).length}`)
    console.log(`플랫폼 키:`, Object.keys(platformVariations))

    // Use the appropriate platform's content as the body
    const generatedContent = platform === 'all'
      ? platformVariations['thread'].text  // Use thread version as main body when generating all
      : platformVariations[platform].text

    // Save to database
    const contentResult = await (supabase as any)
      .from("contents")
      .insert({
        brand_id: brandId,
        writer_persona_id: (writerPersona as any)?.id || null,
        topic,
        body: generatedContent,
        content_type: "text",
        ai_model: aiModel || "claude-3-haiku-20240307",
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
