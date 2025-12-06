import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch website content
    let htmlContent = ''
    try {
      const response = await fetch(validUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MarketingBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      htmlContent = await response.text()
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch website. Please check the URL and try again.' },
        { status: 400 }
      )
    }

    // Extract relevant content (limit to avoid token issues)
    const cleanedContent = extractRelevantContent(htmlContent)

    // Use Claude to analyze the website
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `다음은 웹사이트의 HTML 내용입니다. 이 웹사이트를 분석하여 브랜드 정보를 추출해주세요.

웹사이트 URL: ${validUrl.toString()}

HTML 내용 (일부):
${cleanedContent}

다음 정보를 JSON 형식으로 추출해주세요:
1. name: 브랜드/회사 이름 (메타 태그, 타이틀, 로고 텍스트 등에서 추출)
2. description: 브랜드/서비스 설명 (2-3문장으로 요약, 무엇을 하는 회사인지, 어떤 가치를 제공하는지)
3. product_type: 아래 중 하나 선택
   - product (물리적 제품)
   - service (서비스)
   - b2b_saas (B2B SaaS)
   - b2c_saas (B2C SaaS)
   - ecommerce (이커머스)
   - education (교육)
   - consulting (컨설팅)
   - personal_brand (개인 브랜드)
   - company (회사/기업)
   - other (기타)

JSON 형식으로만 응답해주세요:
{
  "name": "브랜드 이름",
  "description": "브랜드 설명",
  "product_type": "타입"
}`
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          success: true,
          data: {
            name: parsed.name || '',
            description: parsed.description || '',
            product_type: parsed.product_type || 'other',
          }
        })
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze website content' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Analyze URL error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    )
  }
}

function extractRelevantContent(html: string): string {
  // Remove scripts, styles, and other non-content elements
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Extract title
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  // Extract meta tags
  const metaDescription = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
  const ogTitle = content.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
  const ogDescription = content.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
  const keywords = content.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''

  // Extract headings
  const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  const h1Content = h1Matches.slice(0, 3).map(h => h.replace(/<[^>]+>/g, '').trim()).join(' | ')

  const h2Matches = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h2Content = h2Matches.slice(0, 5).map(h => h.replace(/<[^>]+>/g, '').trim()).join(' | ')

  // Extract main content areas (limit text)
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let bodyText = ''
  if (bodyMatch) {
    bodyText = bodyMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
  }

  // Combine relevant parts
  return `
Title: ${title}
Meta Description: ${metaDescription}
OG Title: ${ogTitle}
OG Description: ${ogDescription}
Keywords: ${keywords}
Main Headings (H1): ${h1Content}
Sub Headings (H2): ${h2Content}
Body Content Preview: ${bodyText.slice(0, 2000)}
  `.trim()
}
