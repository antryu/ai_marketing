import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Brand {
  id: string
  name: string
  description?: string
  product_type?: string
  target_market?: string[]
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

    const { topic, reason, brandId, targetAudience, language = 'ko' } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'ko' ? '토픽을 입력해주세요' : 'Please enter a topic' },
        { status: 400 }
      )
    }

    // Get brand information if provided
    let brandData: Brand | null = null
    if (brandId) {
      const { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (brand) {
        brandData = brand as Brand
      }
    }

    // Generate topic details
    const details = await generateTopicDetails(topic, reason, brandData, targetAudience, language)

    return NextResponse.json({
      success: true,
      data: details
    })
  } catch (error) {
    console.error('Topic Details API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate topic details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateTopicDetails(
  topic: string,
  reason: string,
  brand: Brand | null,
  targetAudience: string | null,
  language: string
): Promise<{
  titles: Array<{ title: string; angle: string }>
  hooks: string[]
  keywords: string[]
}> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const brandContext = brand ? `
브랜드: ${brand.name}
${brand.description ? `설명: ${brand.description}` : ''}
${brand.product_type ? `제품/서비스 유형: ${brand.product_type}` : ''}
${brand.target_market?.length ? `타겟 시장: ${brand.target_market.join(', ')}` : ''}
  `.trim() : ''

  const targetContext = targetAudience ? `타겟 고객: ${targetAudience}` : ''

  const prompt = language === 'ko' ? `
당신은 SNS 콘텐츠 마케팅 전문가입니다. 주어진 토픽에 대해 구체적인 콘텐츠 제목 아이디어를 생성해주세요.

**토픽: "${topic}"**
**토픽 선정 이유: ${reason || '없음'}**

${brandContext ? `\n${brandContext}\n` : ''}
${targetContext ? `\n${targetContext}\n` : ''}

다음 형식으로 JSON 응답해주세요:
{
  "titles": [
    {
      "title": "구체적이고 클릭을 유도하는 콘텐츠 제목",
      "angle": "이 제목의 앵글/관점 설명 (어떤 관점에서 접근하는지)"
    }
  ],
  "hooks": [
    "오프닝 훅 문장 1 (독자의 관심을 끄는 첫 문장)",
    "오프닝 훅 문장 2",
    "오프닝 훅 문장 3"
  ],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}

요구사항:
1. 제목은 5개 생성 (다양한 앵글에서)
2. 제목은 구체적이고 클릭을 유도하는 형태여야 함
3. 각 제목은 서로 다른 관점/앵글이어야 함 (예: 문제해결, 비교, 리스트, 스토리, 질문 등)
4. 훅은 3개 생성 (독자가 계속 읽고 싶게 만드는 첫 문장)
5. 키워드는 5개 생성 (SEO 및 해시태그용)
6. 모든 내용은 한국어로 작성
` : `
You are an SNS content marketing expert. Generate specific content title ideas for the given topic.

**Topic: "${topic}"**
**Why this topic: ${reason || 'Not specified'}**

${brandContext ? `\n${brandContext}\n` : ''}
${targetContext ? `\n${targetContext}\n` : ''}

Respond in JSON format:
{
  "titles": [
    {
      "title": "Specific, click-worthy content title",
      "angle": "The angle/perspective of this title"
    }
  ],
  "hooks": [
    "Opening hook sentence 1 (attention-grabbing first line)",
    "Opening hook sentence 2",
    "Opening hook sentence 3"
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Requirements:
1. Generate 5 titles (from various angles)
2. Titles should be specific and click-worthy
3. Each title should have a different angle (e.g., problem-solving, comparison, listicle, story, question)
4. Generate 3 hooks (first sentences that make readers want to continue)
5. Generate 5 keywords (for SEO and hashtags)
6. All content in English
`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          titles: parsed.titles || [],
          hooks: parsed.hooks || [],
          keywords: parsed.keywords || []
        }
      }
    }

    // Fallback response
    return {
      titles: [
        { title: topic, angle: reason || (language === 'ko' ? '기본 앵글' : 'Default angle') }
      ],
      hooks: [],
      keywords: []
    }
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}
