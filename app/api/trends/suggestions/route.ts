import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Brand {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
}

// Industry-specific trending keywords
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  '병원': ['병원 마케팅', '의료 광고', '환자 유치', '병원 SNS', '의료 콘텐츠'],
  'IT': ['IT 스타트업', '개발자 채용', 'SaaS 마케팅', '테크 트렌드', 'AI 기술'],
  '스타트업': ['스타트업 마케팅', '그로스해킹', '린스타트업', '펀딩', 'PMF'],
  '이커머스': ['온라인쇼핑', '이커머스 트렌드', '배송', '고객리뷰', '전환율'],
  '교육': ['온라인교육', '에듀테크', '학습콘텐츠', '강의마케팅', '교육트렌드'],
  '부동산': ['부동산마케팅', '아파트', '주택시장', '부동산트렌드', '투자'],
  '음식점': ['맛집마케팅', '배달', '음식점SNS', '메뉴개발', '고객리뷰'],
  '뷰티': ['뷰티트렌드', '화장품', '스킨케어', '뷰티마케팅', '인플루언서'],
  '패션': ['패션트렌드', '의류', '스타일링', '패션마케팅', '브랜드'],
  'default': ['마케팅', '콘텐츠', 'SNS', '광고', '브랜딩']
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user's brand information
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's brand
    const { data: brands } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    let industry = 'default'
    let brandName = '귀하'

    if (brands && brands.length > 0) {
      const brand = brands[0] as Brand
      brandName = brand.name

      // Detect industry from brand name or description
      const text = `${brand.name} ${brand.description || ''}`.toLowerCase()

      if (text.includes('병원') || text.includes('의료') || text.includes('클리닉')) {
        industry = '병원'
      } else if (text.includes('it') || text.includes('개발') || text.includes('소프트웨어')) {
        industry = 'IT'
      } else if (text.includes('스타트업') || text.includes('창업')) {
        industry = '스타트업'
      } else if (text.includes('쇼핑') || text.includes('이커머스') || text.includes('온라인')) {
        industry = '이커머스'
      } else if (text.includes('교육') || text.includes('학원') || text.includes('강의')) {
        industry = '교육'
      } else if (text.includes('부동산') || text.includes('아파트') || text.includes('주택')) {
        industry = '부동산'
      } else if (text.includes('음식') || text.includes('식당') || text.includes('카페')) {
        industry = '음식점'
      } else if (text.includes('뷰티') || text.includes('화장품') || text.includes('미용')) {
        industry = '뷰티'
      } else if (text.includes('패션') || text.includes('의류') || text.includes('옷')) {
        industry = '패션'
      }
    }

    const keywords = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.default

    // Generate rich suggestions with mock engagement data
    const suggestions = keywords.map((keyword, idx) => ({
      keyword,
      industry,
      reason: generateReason(keyword, industry),
      metrics: {
        googleTrends: {
          searchVolume: Math.floor(Math.random() * 100) + 1,
          growthRate: Math.floor(Math.random() * 50) + 10,
        },
        socialMedia: {
          twitter: {
            mentions: Math.floor(Math.random() * 5000) + 500,
            likes: Math.floor(Math.random() * 10000) + 1000,
            retweets: Math.floor(Math.random() * 2000) + 200,
          },
          reddit: {
            posts: Math.floor(Math.random() * 100) + 10,
            upvotes: Math.floor(Math.random() * 5000) + 500,
            comments: Math.floor(Math.random() * 500) + 50,
          }
        },
        engagement: {
          totalReach: formatNumber(Math.floor(Math.random() * 500000) + 50000),
          engagementRate: (Math.random() * 5 + 2).toFixed(1) + '%',
        }
      },
      sources: [
        { name: 'Google Trends', value: Math.floor(Math.random() * 100) + 1 },
        { name: 'Twitter/X', value: Math.floor(Math.random() * 10000) + 1000 },
        { name: 'Reddit', value: Math.floor(Math.random() * 5000) + 500 },
      ],
      priority: idx < 3 ? 'high' : idx < 6 ? 'medium' : 'low',
    }))

    return NextResponse.json({
      success: true,
      data: {
        brandName,
        industry,
        suggestions,
        updatedAt: new Date().toISOString(),
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

function generateReason(keyword: string, industry: string): string {
  const reasons = [
    `${industry} 업계에서 최근 30일간 검색량이 급증한 키워드입니다`,
    `SNS에서 높은 참여율을 보이는 인기 주제입니다`,
    `경쟁사들이 활발히 다루고 있는 트렌드 토픽입니다`,
    `고객들의 관심도가 높아지고 있는 주제입니다`,
    `검색 트렌드와 소셜 미디어 인기도가 모두 상승 중입니다`,
  ]

  return reasons[Math.floor(Math.random() * reasons.length)]
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
