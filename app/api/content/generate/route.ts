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

    const { topic, brandId, platform, tone, length, writerPersonaId, aiModel, language } = await request.json()

    if (!topic || !brandId) {
      return NextResponse.json(
        { error: language === "en" ? "Topic and brand are required" : "토픽과 브랜드는 필수입니다" },
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

    // Platform-specific content generation
    const platformSettings = {
      thread: {
        maxLength: 500,
        style: "감성적, 스토리텔링, 완전한 반말체 (존댓말 절대 사용 금지, 친구에게 말하듯 편하고 캐주얼한 톤)",
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

      const prompt = `${language === "en"
        ? `You are a professional marketing content writer.
CRITICAL INSTRUCTION: You MUST write EXCLUSIVELY in English.
NEVER use Korean, Chinese, Japanese, or any other language.
If you write in any language other than English, you will FAIL this task.

You are a professional marketing content writer for ${typedBrand.name}.
Important: You must write ONLY in English. Never use Korean, Chinese, Japanese, or any other language.`
        : `당신은 한국어만 사용하는 전문 마케팅 콘텐츠 작성자입니다.
절대 영어, 중국어, 일본어를 사용하지 마세요. 오직 한국어로만 답변하세요.

You are a professional Korean marketing content writer.
CRITICAL INSTRUCTION: You MUST write EXCLUSIVELY in Korean language (한글).
NEVER use English, Chinese, Japanese, or any other language.
If you write in English, Chinese, or any language other than Korean, you will FAIL this task.

당신은 ${typedBrand.name}의 전문 마케팅 콘텐츠 작성자입니다.
중요: 반드시 한국어로만 작성하세요. 영어, 중국어, 일본어 또는 다른 언어를 절대 사용하지 마세요.`}

${language === "en" ? `
Product Information:
- Name: ${typedBrand.name}
- Description: ${typedBrand.description}
- Target Market: ${typedBrand.target_market?.join(", ") || "Global"}
- Brand Tone: ${typedBrand.brand_voice?.tone || "Professional"}
- Brand Style: ${typedBrand.brand_voice?.style || "Friendly"}

Platform: ${platformKey}
Style: ${settings.style}
Max Length: ${settings.maxLength} characters
Format: ${settings.format}

Target Personas:` : `
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

타겟 페르소나:`}
${typedBrand.personas?.map((p: any) => {
  let personaInfo = `- ${p.name}: ${p.description}`

  // 성격 특성 추가
  const traits = []
  if (p.mbti) traits.push(`MBTI ${p.mbti}`)
  if (p.generation) traits.push(`${p.generation}`)
  if (p.blood_type) traits.push(`${p.blood_type}형`)
  if (p.zodiac_sign) traits.push(`${p.zodiac_sign}`)

  if (traits.length > 0) {
    personaInfo += ` (${traits.join(", ")})`
  }

  return personaInfo
}).join("\n") || "일반 대중"}

${typedBrand.personas?.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 타겟 맞춤 콘텐츠 전략 (반드시 적용):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${typedBrand.personas?.map((p: any) => {
  let strategy = []

  // MBTI별 전략
  if (p.mbti) {
    const mbtiStrategies: Record<string, string> = {
      'ENFP': '창의적이고 열정적인 톤 사용. 새로운 가능성과 아이디어 강조. 감정적 연결 중시. 자유로운 표현과 다양한 옵션 제시.',
      'INFP': '진정성과 가치 중심 메시지. 깊은 의미와 개인적 성장 강조. 이상주의적 비전 제시. 감성적이고 따뜻한 톤.',
      'ENFJ': '사람 중심, 공감적 접근. 공동체와 관계의 가치 강조. 긍정적이고 격려하는 톤. 타인에게 도움이 되는 측면 부각.',
      'INFJ': '통찰력 있는 메시지. 장기적 비전과 의미 강조. 깊이 있는 내용. 이상과 현실의 조화.',
      'ENTP': '논리적이고 혁신적인 접근. 새로운 아이디어와 가능성 탐구. 지적 호기심 자극. 창의적 문제해결 강조.',
      'INTP': '논리적 분석과 정확성 중시. 원리와 시스템 설명. 객관적 데이터 제시. 깊이 있는 사고 자극.',
      'ENTJ': '효율성과 결과 중심. 명확한 목표와 전략 제시. 리더십과 성취 강조. 체계적이고 논리적인 구조.',
      'INTJ': '전략적이고 논리적인 접근. 장기 계획과 효율성 강조. 데이터 기반 통찰. 독립적 의사결정 지원.',
      'ESFP': '즐겁고 생동감 있는 톤. 즉각적 경험과 재미 강조. 실용적 혜택 부각. 시각적이고 감각적 표현.',
      'ISFP': '미적 감각과 개성 존중. 개인적 경험과 감정 중시. 자유로운 선택 강조. 부드럽고 섬세한 접근.',
      'ESFJ': '친근하고 따뜻한 톤. 관계와 조화 중시. 실용적 도움 제공. 구체적이고 상세한 정보.',
      'ISFJ': '신뢰와 안정성 강조. 세심한 배려와 책임감. 전통과 검증된 방법. 구체적이고 실용적 조언.',
      'ESTP': '역동적이고 직접적인 톤. 즉각적 행동과 결과 강조. 실용적 해결책 제시. 에너지 넘치는 표현.',
      'ISTP': '간결하고 효율적인 접근. 실용성과 기능성 중시. 논리적 분석. 문제해결 능력 강조.',
      'ESTJ': '체계적이고 명확한 구조. 효율성과 책임감 강조. 실질적 결과 중시. 구체적 계획과 단계 제시.',
      'ISTJ': '신뢰성과 정확성 중시. 사실 기반 정보 제공. 체계적이고 논리적 구성. 검증된 방법 강조.'
    }
    if (mbtiStrategies[p.mbti]) {
      strategy.push(`📌 MBTI ${p.mbti} 맞춤: ${mbtiStrategies[p.mbti]}`)
    }
  }

  // 세대별 전략
  if (p.generation) {
    const genStrategies: Record<string, string> = {
      'Z세대': '짧고 임팩트 있는 메시지. 솔직하고 직설적인 톤. 밈과 트렌드 활용. 비주얼 중심. 진정성과 다양성 중시. 빠른 정보 전달.',
      '밀레니얼': '경험과 가치 중심. 밸런스와 의미 추구. 데이터와 후기 중시. 실용적이면서 감성적. 디지털 친화적. 투명성 중요.',
      'X세대': '실용성과 효율성 강조. 균형 잡힌 시각. 검증된 정보 선호. 독립적 의사결정. 구체적 혜택 제시. 신뢰성 중요.',
      '베이비부머': '상세하고 신뢰할 수 있는 정보. 전문성과 권위 강조. 명확한 설명. 안정성과 가치 중시. 존중하는 톤. 단계별 가이드.'
    }
    if (genStrategies[p.generation]) {
      strategy.push(`📌 ${p.generation} 맞춤: ${genStrategies[p.generation]}`)
    }
  }

  // 혈액형별 전략 (한국 문화권)
  if (p.blood_type) {
    const bloodStrategies: Record<string, string> = {
      'A': '완벽주의 성향 고려. 세심한 정보와 디테일 제공. 계획적이고 체계적인 접근. 안정성과 신뢰성 강조.',
      'B': '자유롭고 창의적인 표현. 다양성과 개성 존중. 유연한 옵션 제시. 독특하고 혁신적인 측면 부각.',
      'O': '리더십과 추진력 강조. 목표 지향적 메시지. 실행력과 결단력 중시. 주도적 행동 유도.',
      'AB': '합리적이고 객관적인 접근. 논리와 감성의 균형. 독특한 관점 제시. 다면적 분석.'
    }
    if (bloodStrategies[p.blood_type]) {
      strategy.push(`📌 ${p.blood_type}형 맞춤: ${bloodStrategies[p.blood_type]}`)
    }
  }

  return strategy.length > 0 ? `\n${p.name} 타겟 전략:\n${strategy.join('\n')}` : ''
}).filter(Boolean).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}
${writerContext}

${language === "en" ? `
Please follow these guidelines to generate content:
1. **Write in English ONLY** - All content must be written in English
${platformKey === 'thread' ? `2. **Use casual tone** - Write in a friendly, conversational style
   Example: "You should know this", "Really great", "Try it out"` : '2. Use formal/professional tone'}
3. Optimize format for ${platformKey} platform
4. Maintain brand voice and tone
5. **Apply the 🎯 Target-specific content strategy above** - Use tone, style, and approach that matches each target's personality traits
6. Reflect target persona's interests and pain points
7. Reflect writer persona's style and characteristics
8. Focus on providing real value
9. Include Call-to-Action (CTA) naturally
10. Keep within ${settings.maxLength} characters
${platformKey === 'naver' || platformKey === 'tistory' ? `
10. **Blog format** - Use introduction, body, conclusion structure
11. **Use subheadings** - Clear section divisions with ## markdown
12. **SEO optimization** - Natural keyword placement
13. **Readability** - Paragraph breaks, use of lists
14. **Practicality** - Include specific examples, tips, step-by-step guides` : ''}

Topic: ${topic}

Please write content for ${platformKey} on the above topic.${platformKey === 'naver' || platformKey === 'tistory' ? ' Write in detail and structured so blog readers can read to the end and take action.' : ' Write concisely and impactfully for the platform.'}

OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Language: 100% English ONLY
2. NO Korean words
3. NO Chinese/Japanese
4. NO code blocks (\`\`\`markdown blocks)
5. Use markdown formatting (#, **, - for lists)
6. Start writing English content immediately

⚠️ WARNING: Using Korean or other languages will FAIL this task!

Start writing in English NOW!` : `
다음 지침을 따라 콘텐츠를 생성하세요:
1. **반드시 한국어로 작성** - 모든 콘텐츠는 한국어로 작성해야 합니다
${platformKey === 'thread' ? `2. **반말체 사용 필수** - 첫 문장부터 마지막 문장까지 100% 반말로만 작성
   ⚠️ 절대 금지: "~요", "~니다", "~세요", "~습니다" 등의 존댓말
   ✅ 반드시 사용: "~야", "~어", "~지", "~거야", "~다", "~해" 등의 반말
   예시 문장: "이거 진짜 대박이야", "꼭 한번 해봐", "너도 알겠지만 이건 정말 좋아"
   첫 문장 예: "요즘 이거 때문에 고민이지?" (O) / "요즘 이것 때문에 고민이시죠?" (X)
   마지막 문장 예: "꼭 한번 해봐!" (O) / "꼭 한번 해보세요!" (X)` : '2. 존댓말 사용'}
3. ${platformKey} 플랫폼에 최적화된 형식으로 작성
4. 브랜드 보이스와 톤 유지
5. **위의 🎯 타겟 맞춤 콘텐츠 전략을 반드시 적용** - 각 타겟의 성격 특성에 맞는 톤, 스타일, 접근 방식 사용
6. 타겟 페르소나의 관심사와 페인 포인트 반영
7. 작성자 페르소나의 스타일과 특성 반영
8. 실제 가치 제공에 집중
9. CTA(Call-to-Action) 자연스럽게 포함
10. ${settings.maxLength}자 이내로 작성
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
Start writing in Korean NOW!`}
`

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
    const { language } = await request.json().catch(() => ({ language: "ko" }))
    return NextResponse.json(
      { error: error.message || (language === "en" ? "Content generation failed" : "콘텐츠 생성 실패") },
      { status: 500 }
    )
  }
}
