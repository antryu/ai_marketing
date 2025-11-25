import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Simple in-memory cache with 30-minute TTL
interface CacheEntry {
  data: any
  timestamp: number
}

const suggestionCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getCachedSuggestions(key: string): any | null {
  const entry = suggestionCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    suggestionCache.delete(key)
    return null
  }

  return entry.data
}

function setCachedSuggestions(key: string, data: any): void {
  suggestionCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

interface Brand {
  id: string
  name: string
  description?: string
  product_type?: string
  target_market?: string[]
  user_id: string
  created_at: string
}

interface Persona {
  id: string
  brand_id: string
  name: string
  description: string
  age_range: string
  gender: string
  job_title: string[]
  industry: string[]
  pain_points: string[]
  goals: string[]
}

// Removed hardcoded INDUSTRY_KEYWORDS - now using AI generation

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')
    const language = searchParams.get('language') || 'ko'
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let brandName = language === 'ko' ? '귀하' : 'You'
    let brandData: Brand | null = null
    let personaData: Persona | null = null
    let personaName = ''
    let personaInfo = ''

    if (personaId) {
      // Get persona information
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()

      if (persona) {
        personaData = persona as Persona
        personaName = personaData.name
        personaInfo = `${personaData.age_range} ${personaData.gender}`

        // Get brand information for the persona's brand
        const { data: brand } = await supabase
          .from('brands')
          .select('*')
          .eq('id', personaData.brand_id)
          .single()

        if (brand) {
          brandData = brand as Brand
          brandName = brandData.name
        }
      }
    }

    // Generate cache key based on brand and persona
    const cacheKey = `${brandData?.id || 'default'}-${personaData?.id || 'default'}-${language}`

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedSuggestions(cacheKey)
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: {
            brandName,
            personaName,
            personaInfo,
            industry: personaData?.industry?.[0] || 'general',
            suggestions: cachedData.suggestions,
            updatedAt: cachedData.updatedAt,
            aiGenerated: true,
            cached: true,
          },
        })
      }
    }

    // Generate AI-powered suggestions
    const suggestions = await generateAISuggestions(brandData, personaData, language)

    // Cache the result
    const responseData = {
      suggestions,
      updatedAt: new Date().toISOString(),
    }
    setCachedSuggestions(cacheKey, responseData)

    return NextResponse.json({
      success: true,
      data: {
        brandName,
        personaName,
        personaInfo,
        industry: personaData?.industry?.[0] || 'general',
        suggestions,
        updatedAt: responseData.updatedAt,
        aiGenerated: true,
        cached: false,
      },
    })
  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchRealTimeTrends(
  brand: Brand | null,
  persona: Persona | null,
  language: string
): Promise<string> {
  try {
    // Determine market and language settings
    const isKorean = language === 'ko'
    const geo = isKorean ? 'KR' : 'US'
    const langCode = isKorean ? 'ko' : 'en'
    const tz = isKorean ? '-540' : '-300' // KST vs EST

    // Determine search keywords based on brand and persona
    const searchKeywords: string[] = []

    if (brand?.product_type) {
      searchKeywords.push(brand.product_type)
    }
    if (persona?.industry && persona.industry.length > 0) {
      searchKeywords.push(...persona.industry.slice(0, 2))
    }
    if (brand?.target_market && brand.target_market.length > 0) {
      searchKeywords.push(...brand.target_market.slice(0, 1))
    }

    // Default to general marketing if no specific keywords
    if (searchKeywords.length === 0) {
      searchKeywords.push(isKorean ? '마케팅' : 'marketing', isKorean ? '콘텐츠' : 'content')
    }

    const trendPromises = searchKeywords.slice(0, 3).map(async (keyword) => {
      try {
        // Fetch Google Trends data for selected market
        const googleTrendsUrl = `https://trends.google.com/trends/api/dailytrends?hl=${langCode}&tz=${tz}&geo=${geo}&ns=15`
        const googleRes = await fetch(googleTrendsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })

        // Fetch Naver DataLab trends (for Korean market only)
        let naverTrends = null
        if (isKorean) {
          try {
            const naverRes = await fetch('https://openapi.naver.com/v1/datalab/search', {
              method: 'POST',
              headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, ''),
                endDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                timeUnit: 'date',
                keywordGroups: [
                  {
                    groupName: keyword,
                    keywords: [keyword]
                  }
                ]
              })
            })

            if (naverRes.ok) {
              naverTrends = await naverRes.json()
            }
          } catch (e) {
            console.error('Naver DataLab error:', e)
          }
        }

        // Reddit API removed - now paid API with strict limitations

        // Fetch Twitter/X trending topics for selected language
        const twitterRes = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword + ` lang:${langCode}`)}&max_results=10`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            },
          }
        ).catch(() => null)

        return {
          keyword,
          googleTrends: googleRes.ok ? await googleRes.text() : null,
          naverTrends,
          twitter: twitterRes?.ok ? await twitterRes.json() : null,
        }
      } catch (error) {
        console.error(`Error fetching trends for ${keyword}:`, error)
        return { keyword, googleTrends: null, naverTrends: null, twitter: null }
      }
    })

    const results = await Promise.all(trendPromises)

    // Format trend data for AI (in selected language)
    let trendContext = isKorean ? '최근 트렌드 데이터:\n\n' : 'Recent Trend Data:\n\n'

    results.forEach(({ keyword, googleTrends, naverTrends, twitter }) => {
      trendContext += isKorean ? `[${keyword} 관련]\n` : `[Related to ${keyword}]\n`

      // Naver DataLab (Korean market priority)
      if (naverTrends && naverTrends.results && naverTrends.results.length > 0) {
        const recentData = naverTrends.results[0].data.slice(-7) // Last 7 days
        const avgRatio = recentData.reduce((sum: number, d: any) => sum + d.ratio, 0) / recentData.length
        const trend = recentData[recentData.length - 1].ratio > avgRatio ? '상승' : '하락'
        trendContext += `네이버 검색 트렌드: "${keyword}" 검색량 ${trend} 추세 (최근 7일 평균 검색량: ${avgRatio.toFixed(1)})\n`
      }

      // Google Trends
      if (googleTrends) {
        try {
          const cleanJson = googleTrends.replace(/^\)\]\}'\n/, '')
          const data = JSON.parse(cleanJson)
          const topics = data.default?.trendingSearchesDays?.[0]?.trendingSearches || []
          if (topics.length > 0) {
            const label = isKorean ? 'Google 급상승 검색어' : 'Google Trending Searches'
            trendContext += `${label}: ${topics.slice(0, 3).map((t: any) => t.title.query).join(', ')}\n`
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }

      // Twitter/X
      if (twitter?.data) {
        const tweets = twitter.data.slice(0, 3)
        if (tweets.length > 0) {
          const label = isKorean ? 'Twitter 인기 주제' : 'Twitter Trending Topics'
          trendContext += `${label}: ${tweets.map((t: any) => t.text.substring(0, 50)).join(' | ')}\n`
        }
      }

      trendContext += '\n'
    })

    return trendContext
  } catch (error) {
    console.error('Error fetching real-time trends:', error)
    return language === 'ko'
      ? '실시간 트렌드 데이터를 가져올 수 없습니다.'
      : 'Unable to fetch real-time trend data.'
  }
}

async function generateAISuggestions(
  brand: Brand | null,
  persona: Persona | null,
  language: string
): Promise<Array<{ keyword: string; reason: string; priority: string }>> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Fetch real-time trend data for selected market
  const realTimeTrends = await fetchRealTimeTrends(brand, persona, language)

  // Build context for AI
  const brandContext = brand ? `
브랜드: ${brand.name}
${brand.description ? `설명: ${brand.description}` : ''}
${brand.product_type ? `제품/서비스 유형: ${brand.product_type}` : ''}
${brand.target_market?.length ? `타겟 시장: ${brand.target_market.join(', ')}` : ''}
  `.trim() : '일반 브랜드'

  const personaContext = persona ? `
타겟 고객: ${persona.name}
${persona.description ? `설명: ${persona.description}` : ''}
연령대: ${persona.age_range}
성별: ${persona.gender}
${persona.job_title?.length ? `직업: ${persona.job_title.join(', ')}` : ''}
${persona.industry?.length ? `산업: ${persona.industry.join(', ')}` : ''}
${persona.pain_points?.length ? `고민/문제: ${persona.pain_points.join(', ')}` : ''}
${persona.goals?.length ? `목표: ${persona.goals.join(', ')}` : ''}
  `.trim() : '일반 타겟 고객'

  const prompt = language === 'ko' ? `
당신은 마케팅 트렌드 전문가입니다. 다음 정보를 바탕으로 현재 한국 시장에서 효과적인 콘텐츠 마케팅 주제 5개를 추천해주세요.

${brandContext}

${personaContext}

${realTimeTrends}

요구사항:
1. 각 주제는 구체적이고 실행 가능해야 합니다
2. 타겟 고객의 고민과 목표를 직접적으로 해결하는 내용이어야 합니다
3. **위의 실시간 트렌드 데이터를 반드시 반영**하여, 지금 한국에서 검색되고 화제가 되는 주제와 연결해야 합니다
4. 브랜드의 산업 특성과 타겟 고객의 특성을 고려해야 합니다
5. 각 주제마다 왜 이 주제가 효과적인지 구체적인 이유를 제시해야 합니다 (실시간 트렌드 근거 포함)

JSON 형식으로 응답해주세요:
{
  "suggestions": [
    {
      "keyword": "구체적인 마케팅 주제 (예: 필라테스 스튜디오를 위한 인스타그램 릴스 활용법)",
      "reason": "이 주제가 왜 효과적인지 구체적인 이유 (실시간 트렌드, 타겟 고객, 브랜드 특성 언급)",
      "priority": "high/medium/low"
    }
  ]
}
` : `
You are a marketing trend expert. Based on the following information, recommend 5 effective content marketing topics for the current US/global market.

${brandContext}

${personaContext}

${realTimeTrends}

Requirements:
1. Each topic must be specific and actionable
2. Content must directly address target customer pain points and goals
3. **Must incorporate the real-time trend data above** - connect with topics currently being searched and discussed in the US/global market
4. Consider brand's industry characteristics and target customer profile
5. Provide specific reasons why each topic is effective (include real-time trend evidence)

Respond in JSON format:
{
  "suggestions": [
    {
      "keyword": "Specific marketing topic (e.g., Instagram Reels Strategy for Pilates Studios)",
      "reason": "Specific reason why this topic is effective (mention real-time trends, target audience, brand characteristics)",
      "priority": "high/medium/low"
    }
  ]
}
`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
        return parsed.suggestions || []
      }
    }

    // Fallback to default suggestions if AI fails
    return getDefaultSuggestions(language)
  } catch (error) {
    console.error('AI generation error:', error)
    return getDefaultSuggestions(language)
  }
}

function getDefaultSuggestions(language: string): Array<{ keyword: string; reason: string; priority: string }> {
  if (language === 'ko') {
    return [
      {
        keyword: '소셜미디어 참여율 3배 높이는 콘텐츠 기획법',
        reason: '타겟 고객의 실질적인 문제 해결에 집중한 실용적 주제로, 높은 콘텐츠 참여율이 예상됩니다',
        priority: 'high'
      },
      {
        keyword: '브랜드 인지도 구축을 위한 스토리텔링 전략',
        reason: '경쟁사 분석 결과 아직 많이 다루지 않은 차별화 가능한 토픽입니다',
        priority: 'high'
      },
      {
        keyword: '광고 비용 없이 유기적 도달률 높이는 방법',
        reason: '검색 의도가 명확해 구체적인 솔루션을 제공하면 고객 전환율이 높습니다',
        priority: 'high'
      },
      {
        keyword: '고객 충성도 높이는 커뮤니티 운영 전략',
        reason: '실행 가능한 전략을 담아 공유와 저장이 많이 발생하는 바이럴 잠재력이 높은 주제입니다',
        priority: 'medium'
      },
      {
        keyword: 'ROI 측정 가능한 디지털 마케팅 KPI 설정법',
        reason: '최근 업계의 공통 pain point를 해결하는 시의성 있는 콘텐츠입니다',
        priority: 'medium'
      }
    ]
  } else {
    return [
      {
        keyword: 'Content Planning Method to Triple Social Media Engagement',
        reason: 'Practical topic focused on solving real customer problems, expected high content engagement',
        priority: 'high'
      },
      {
        keyword: 'Storytelling Strategy to Build Brand Awareness',
        reason: 'Differentiated topic not widely covered by competitors yet based on competitive analysis',
        priority: 'high'
      },
      {
        keyword: 'How to Increase Organic Reach Without Advertising Cost',
        reason: 'Clear search intent leads to high customer conversion when providing specific solutions',
        priority: 'high'
      },
      {
        keyword: 'Community Management Strategy to Increase Customer Loyalty',
        reason: 'High viral potential with actionable strategies that generate shares and saves',
        priority: 'medium'
      },
      {
        keyword: 'Setting Measurable Digital Marketing KPIs for ROI Tracking',
        reason: 'Timely content addressing common pain points in the industry',
        priority: 'medium'
      }
    ]
  }
}

// Removed unused helper functions - now using AI generation
