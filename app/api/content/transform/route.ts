import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, targetPlatform, language } = await request.json()

    if (!contentId || !targetPlatform) {
      return NextResponse.json(
        { error: language === "en" ? "Content ID and target platform are required" : "콘텐츠 ID와 타겟 플랫폼은 필수입니다" },
        { status: 400 }
      )
    }

    // Get existing content
    const contentResult = await (supabase as any)
      .from("contents")
      .select("*, brands(*), writer_personas(*)")
      .eq("id", contentId)
      .single()

    const content = contentResult.data

    if (!content) {
      return NextResponse.json(
        { error: language === "en" ? "Content not found" : "콘텐츠를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Check if platform variation already exists
    if (content.platform_variations && content.platform_variations[targetPlatform]) {
      return NextResponse.json({
        text: content.platform_variations[targetPlatform].text
      })
    }

    // Platform-specific settings
    const platformSettings = {
      thread: {
        maxLength: 500,
        minLength: 400,
        maxTokens: 800,
        style: "감성적, 스토리텔링, 완전한 반말체",
        format: "짧은 form"
      },
      linkedin: {
        maxLength: 1500,
        minLength: 1200,
        maxTokens: 2400,
        style: "전문적, 데이터 중심, ROI 중심",
        format: "긴 form"
      },
      instagram: {
        maxLength: 300,
        minLength: 200,
        maxTokens: 500,
        style: "비주얼 중심, 감성적",
        format: "캡션"
      },
      twitter: {
        maxLength: 280,
        minLength: 200,
        maxTokens: 450,
        style: "간결하고 임팩트 있는",
        format: "짧은 form"
      },
      naver: {
        maxLength: 2500,
        minLength: 2000,
        maxTokens: 4000,
        style: "친근하고 상세한, 한국 독자 맞춤",
        format: "블로그 포스트"
      },
      tistory: {
        maxLength: 2000,
        minLength: 1600,
        maxTokens: 3200,
        style: "체계적이고 구조화된",
        format: "블로그 포스트"
      }
    }

    const settings = platformSettings[targetPlatform as keyof typeof platformSettings]

    if (!settings) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    // Build writer persona context
    let writerContext = ""
    const writerPersona = content.writer_personas
    if (writerPersona) {
      writerContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 작성자 페르소나: ${writerPersona.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${writerPersona.description || ''}

문체 및 톤:
- 공식성: ${writerPersona.formality_level || 'N/A'}
- 문장 길이: ${writerPersona.sentence_length || 'N/A'}
- 문단 길이: ${writerPersona.paragraph_length || 'N/A'}
${writerPersona.signature_phrases?.length > 0 ? `자주 사용하는 표현: ${writerPersona.signature_phrases.join(", ")}` : ""}

이 작성자 페르소나의 스타일과 톤을 반영하여 콘텐츠를 작성해주세요.`
    }

    // Transform prompt
    const prompt = `${language === "en"
      ? `You are a professional marketing content writer.
CRITICAL INSTRUCTION: You MUST write EXCLUSIVELY in English.`
      : `당신은 한국어만 사용하는 전문 마케팅 콘텐츠 작성자입니다.
절대 영어, 중국어, 일본어를 사용하지 마세요. 오직 한국어로만 답변하세요.`}

${writerContext}

원본 콘텐츠 (네이버 블로그 형식):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content.body}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

타겟 플랫폼: ${targetPlatform}
스타일: ${settings.style}
최대 길이: ${settings.maxLength}자
최소 길이: ${settings.minLength}자
형식: ${settings.format}

위 원본 콘텐츠를 ${targetPlatform} 플랫폼에 맞게 재작성해주세요.

중요 지침:
1. 원본의 핵심 메시지와 가치는 유지
2. ${targetPlatform} 플랫폼의 특성에 맞게 톤과 구조 조정
3. ${settings.minLength}-${settings.maxLength}자 사이로 작성
4. 플랫폼 특성: ${settings.style}
${targetPlatform === 'thread' ? '5. 완전한 반말체 사용 (친구에게 말하듯)' : ''}
${targetPlatform === 'twitter' ? '5. 280자 제한 엄수' : ''}
${targetPlatform === 'instagram' ? '5. 이모지 적절히 활용' : ''}
${targetPlatform === 'linkedin' ? '5. 전문성과 인사이트 강조' : ''}

출력 요구사항:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 언어: 100% 한국어만 사용
2. 마크다운 형식 사용 가능
3. 코드 블록 사용 금지
4. 바로 콘텐츠 작성 시작

지금 바로 한국어로만 콘텐츠를 작성하세요!`

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
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

    let transformedContent = responseContent.text
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Update database with new platform variation
    const updatedPlatformVariations = {
      ...content.platform_variations,
      [targetPlatform]: {
        text: transformedContent,
        tone: content.platform_variations?.naver?.tone || "professional",
        length: content.platform_variations?.naver?.length || "medium"
      }
    }

    await (supabase as any)
      .from("contents")
      .update({
        platform_variations: updatedPlatformVariations
      })
      .eq("id", contentId)

    return NextResponse.json({
      text: transformedContent
    })

  } catch (error: any) {
    console.error("Transform error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to transform content" },
      { status: 500 }
    )
  }
}
