import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content, topic } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const prompt = `다음 콘텐츠를 분석하여 SEO 최적화를 위한 키워드, 해시태그, 연관 검색어를 추천해주세요.

콘텐츠 주제: ${topic || '제공되지 않음'}

콘텐츠:
${content}

다음 형식으로 JSON 응답만 제공해주세요. 설명 없이 JSON만 반환하세요:

{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4", "#해시태그5"],
  "relatedSearches": ["연관검색어1", "연관검색어2", "연관검색어3", "연관검색어4", "연관검색어5"]
}

규칙:
1. 키워드는 1-3단어로 구성된 핵심 키워드 5-10개
2. 해시태그는 # 포함하여 SNS에서 사용 가능한 태그 5-10개
3. 연관 검색어는 사용자가 검색할 만한 구체적인 문구 5-10개
4. 모든 항목은 한글로 작성`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const suggestions = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('SEO keyword suggestion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate keyword suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
