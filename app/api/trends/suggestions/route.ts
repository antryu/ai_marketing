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

// Industry-specific trending keywords with specific, actionable topics
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  '병원': [
    '신규 환자 유치를 위한 네이버 블로그 최적화 전략',
    '의료법 준수하는 병원 SNS 콘텐츠 가이드',
    '진료 후기 관리로 병원 신뢰도 높이는 법',
    '병원 예약률 2배 높이는 카카오톡 채널 활용법',
    '경쟁 병원과 차별화되는 의료 콘텐츠 기획',
  ],
  'IT': [
    'SaaS 제품의 프리미엄 전환율 높이는 온보딩 전략',
    '개발자 채용 경쟁력 강화하는 테크 블로그 운영법',
    'B2B 고객 확보를 위한 링크드인 콘텐츠 마케팅',
    'AI 기술 도입 사례로 제품 신뢰도 구축하기',
    '스타트업 투자 유치를 위한 데모데이 준비 전략',
  ],
  '스타트업': [
    '초기 스타트업의 제품-시장 적합성(PMF) 검증 방법',
    '린스타트업 방식으로 빠르게 MVP 출시하기',
    '엔젤 투자자 설득하는 피칭덱 작성 가이드',
    '그로스해킹으로 사용자 10배 늘리는 실전 전략',
    '스타트업 브랜딩: 차별화 포지셔닝 3단계',
  ],
  '이커머스': [
    '온라인 쇼핑몰 전환율 3배 높이는 상세페이지 구성법',
    '카카오톡 선물하기 입점으로 매출 늘리기',
    '고객 리뷰 10배 많이 받는 리뷰 마케팅 전략',
    '라이브커머스로 재고 소진율 높이는 방법',
    '이커머스 반품률 줄이는 사이즈 가이드 최적화',
  ],
  '교육': [
    '온라인 강의 수강 완료율 2배 높이는 커리큘럼 설계',
    '에듀테크 플랫폼 MAU 늘리는 gamification 전략',
    '학부모 신뢰 얻는 교육 콘텐츠 마케팅 사례',
    '무료 체험 수업에서 유료 전환율 높이는 법',
    'YouTube 교육 채널 구독자 1만 달성 전략',
  ],
  '부동산': [
    '부동산 중개 수수료 없이 직거래 성사시키는 방법',
    '아파트 투자 수익률 분석 콘텐츠로 신뢰도 구축',
    '네이버 부동산 최적화로 매물 조회수 10배 늘리기',
    '재건축·재개발 정보로 차별화된 부동산 콘텐츠',
    '1인 가구 맞춤형 원룸 매물 마케팅 전략',
  ],
  '음식점': [
    '배달앱 리뷰 평점 4.5점 이상 유지하는 방법',
    '인스타그램 감성샷으로 맛집 입소문 만들기',
    '주말 대기 시간 줄이는 예약 시스템 최적화',
    '메뉴판 심리학: 주문율 높이는 메뉴 배치 전략',
    '단골 고객 만드는 CRM 쿠폰 마케팅 활용법',
  ],
  '뷰티': [
    '뷰티 인플루언서 협업으로 제품 인지도 높이기',
    '피부 고민별 맞춤 화장품 추천 콘텐츠 전략',
    'K-뷰티 해외 수출을 위한 글로벌 마케팅',
    '화장품 성분 투명 공개로 소비자 신뢰 얻기',
    '뷰티 유튜브 쇼츠로 제품 사용법 바이럴',
  ],
  '패션': [
    '온라인 의류 쇼핑몰 반품률 30% 줄이는 전략',
    '패션 룩북 콘텐츠로 브랜드 정체성 구축하기',
    '인스타그램 릴스로 패션 아이템 판매 전환율 높이기',
    '지속가능 패션 브랜드 스토리텔링 방법',
    '시즌별 의류 재고 소진을 위한 플래시 세일 전략',
  ],
  'default': [
    '소셜미디어 참여율 3배 높이는 콘텐츠 기획법',
    '브랜드 인지도 구축을 위한 스토리텔링 전략',
    '광고 비용 없이 유기적 도달률 높이는 방법',
    '고객 충성도 높이는 커뮤니티 운영 전략',
    'ROI 측정 가능한 디지털 마케팅 KPI 설정법',
  ]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let industry = 'default'
    let brandName = '귀하'
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
        const personaData = persona as Persona
        personaName = personaData.name
        personaInfo = `${personaData.age_range} ${personaData.gender}`

        // Detect industry from persona's industry array
        if (personaData.industry && personaData.industry.length > 0) {
          const personaIndustry = personaData.industry[0].toLowerCase()

          if (personaIndustry.includes('병원') || personaIndustry.includes('의료') || personaIndustry.includes('클리닉')) {
            industry = '병원'
          } else if (personaIndustry.includes('it') || personaIndustry.includes('개발') || personaIndustry.includes('소프트웨어')) {
            industry = 'IT'
          } else if (personaIndustry.includes('스타트업') || personaIndustry.includes('창업')) {
            industry = '스타트업'
          } else if (personaIndustry.includes('쇼핑') || personaIndustry.includes('이커머스') || personaIndustry.includes('온라인')) {
            industry = '이커머스'
          } else if (personaIndustry.includes('교육') || personaIndustry.includes('학원') || personaIndustry.includes('강의')) {
            industry = '교육'
          } else if (personaIndustry.includes('부동산') || personaIndustry.includes('아파트') || personaIndustry.includes('주택')) {
            industry = '부동산'
          } else if (personaIndustry.includes('음식') || personaIndustry.includes('식당') || personaIndustry.includes('카페')) {
            industry = '음식점'
          } else if (personaIndustry.includes('뷰티') || personaIndustry.includes('화장품') || personaIndustry.includes('미용')) {
            industry = '뷰티'
          } else if (personaIndustry.includes('패션') || personaIndustry.includes('의류') || personaIndustry.includes('옷')) {
            industry = '패션'
          }
        }

        // Get brand name for the persona's brand
        const { data: brand } = await supabase
          .from('brands')
          .select('name')
          .eq('id', personaData.brand_id)
          .single()

        if (brand) {
          brandName = (brand as Brand).name
        }
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
        personaName,
        personaInfo,
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
  // Extract key action from keyword for more specific reason
  const reasons = [
    `타겟 고객의 실질적인 문제 해결에 집중한 실용적 주제로, 높은 콘텐츠 참여율이 예상됩니다`,
    `경쟁사 분석 결과 아직 많이 다루지 않은 차별화 가능한 토픽입니다`,
    `검색 의도가 명확해 구체적인 솔루션을 제공하면 고객 전환율이 높습니다`,
    `실행 가능한 전략을 담아 공유와 저장이 많이 발생하는 바이럴 잠재력이 높은 주제입니다`,
    `최근 ${industry} 업계의 공통 pain point를 해결하는 시의성 있는 콘텐츠입니다`,
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
