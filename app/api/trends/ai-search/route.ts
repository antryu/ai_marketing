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

    const { topic, brandId, targetAudience, language = 'ko' } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'ko' ? '검색할 주제를 입력해주세요' : 'Please enter a topic to search' },
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

    // Perform AI-powered web search and topic generation
    const searchResults = await performAIWebSearch(topic, brandData, targetAudience, language)

    return NextResponse.json({
      success: true,
      data: searchResults
    })
  } catch (error) {
    console.error('AI Web Search API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform AI web search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function performAIWebSearch(
  topic: string,
  brand: Brand | null,
  targetAudience: string | null,
  language: string
): Promise<{
  searchTopic: string
  topics: Array<{ keyword: string; reason: string; source: string; priority: string }>
  relatedTopics: Array<{ keyword: string; reason: string; category: string }>
  webInsights: string
}> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const now = new Date()
  const currentDateKo = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
  const currentDateEn = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const brandContext = brand ? `
브랜드: ${brand.name}
${brand.description ? `설명: ${brand.description}` : ''}
${brand.product_type ? `제품/서비스 유형: ${brand.product_type}` : ''}
${brand.target_market?.length ? `타겟 시장: ${brand.target_market.join(', ')}` : ''}
  `.trim() : ''

  const targetContext = targetAudience ? `타겟 고객: ${targetAudience}` : ''

  const prompt = language === 'ko' ? `
당신은 마케팅 트렌드 리서치 전문가입니다. 사용자가 입력한 주제에 대해 인터넷 검색을 통해 얻을 수 있는 최신 정보와 트렌드를 바탕으로 마케팅 콘텐츠 토픽을 추천해주세요.

**검색 주제: "${topic}"**
**오늘 날짜: ${currentDateKo}**

${brandContext ? `\n${brandContext}\n` : ''}
${targetContext ? `\n${targetContext}\n` : ''}

당신의 역할:
1. "${topic}" 주제에 대해 현재 인터넷에서 어떤 내용들이 논의되고 있는지 추론합니다
2. 해당 주제와 관련된 최신 트렌드, 뉴스, 논쟁점, 인기 키워드를 파악합니다
3. 마케팅 콘텐츠로 활용할 수 있는 구체적인 토픽 5개를 추천합니다
4. 추가로, 검색 주제와 연관되지만 사용자가 생각하지 못했을 수 있는 색다른 관점의 토픽 3개도 추천합니다

요구사항:
- 각 토픽은 구체적이고 콘텐츠로 바로 만들 수 있어야 합니다
- 메인 토픽은 "${topic}" 주제와 직접적으로 연관되어야 합니다
- 연관 토픽(relatedTopics)은 검색 주제와 간접적으로 연결되거나, 다른 각도에서 접근하는 새로운 아이디어여야 합니다
- 현재 시점(${now.getFullYear()}년 ${now.getMonth() + 1}월)에 맞는 시의성 있는 내용이어야 합니다
- 각 토픽이 왜 효과적인지 이유를 설명해주세요

JSON 형식으로 응답해주세요:
{
  "webInsights": "${topic}에 대한 현재 인터넷 트렌드 요약 (2-3문장)",
  "topics": [
    {
      "keyword": "구체적인 콘텐츠 토픽",
      "reason": "이 토픽이 효과적인 이유",
      "source": "이 주제가 논의되는 플랫폼/매체 (예: 네이버 블로그, 유튜브, 인스타그램, 뉴스 등)",
      "priority": "high/medium/low"
    }
  ],
  "relatedTopics": [
    {
      "keyword": "연관된 색다른 토픽",
      "reason": "이 토픽을 추천하는 이유",
      "category": "카테고리 (예: 다른 관점, 연관 산업, 트렌드 확장, 숨겨진 니즈 등)"
    }
  ]
}
` : `
You are a marketing trend research expert. Based on the topic entered by the user, recommend marketing content topics using the latest information and trends that could be found through internet search.

**Search Topic: "${topic}"**
**Today's Date: ${currentDateEn}**

${brandContext ? `\n${brandContext}\n` : ''}
${targetContext ? `\n${targetContext}\n` : ''}

Your role:
1. Infer what content is currently being discussed on the internet about "${topic}"
2. Identify latest trends, news, controversies, and popular keywords related to the topic
3. Recommend 5 specific topics that can be used for marketing content
4. Additionally, recommend 3 alternative topics that are related but offer fresh perspectives the user might not have considered

Requirements:
- Each topic must be specific and ready to create content
- Main topics must be directly related to "${topic}"
- Related topics (relatedTopics) should be indirectly connected or approach from a different angle
- Content must be timely and relevant to the current time (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
- Explain why each topic is effective

Respond in JSON format:
{
  "webInsights": "Summary of current internet trends about ${topic} (2-3 sentences)",
  "topics": [
    {
      "keyword": "Specific content topic",
      "reason": "Why this topic is effective",
      "source": "Platform/media where this topic is discussed (e.g., YouTube, Instagram, News, Reddit, etc.)",
      "priority": "high/medium/low"
    }
  ],
  "relatedTopics": [
    {
      "keyword": "Related alternative topic",
      "reason": "Why this topic is recommended",
      "category": "Category (e.g., Different Angle, Related Industry, Trend Extension, Hidden Needs, etc.)"
    }
  ]
}
`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2000,
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
          searchTopic: topic,
          topics: parsed.topics || [],
          relatedTopics: parsed.relatedTopics || [],
          webInsights: parsed.webInsights || ''
        }
      }
    }

    // Fallback response
    return {
      searchTopic: topic,
      topics: [],
      relatedTopics: [],
      webInsights: language === 'ko'
        ? '검색 결과를 가져오는 데 문제가 발생했습니다.'
        : 'There was an issue retrieving search results.'
    }
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}
