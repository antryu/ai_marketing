import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { keyword, industry, language = 'ko' } = await request.json()

    if (!keyword && !industry) {
      return NextResponse.json(
        { error: 'Keyword or industry is required' },
        { status: 400 }
      )
    }

    const searchTerm = keyword || industry

    // Generate sample tweets based on keyword and language
    // In production, use Twitter API v2 with elevated access
    const sampleTweets = language === 'ko' ? [
      {
        id: '1',
        text: `${searchTerm}에 대한 최신 트렌드를 분석했습니다. 올해 시장 성장률이 예상보다 높게 나타나고 있습니다. #${searchTerm} #마케팅`,
        author: 'MarketingInsights',
        likes: 1250,
        retweets: 340,
        created: '2시간 전',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:1000 lang:ko`)}&src=typed_query&f=top`
      },
      {
        id: '2',
        text: `${searchTerm} 관련 성공 사례를 공유합니다. 작은 변화가 큰 결과를 만들어냈습니다. 실무에서 바로 적용할 수 있는 팁입니다.`,
        author: 'BusinessCoach',
        likes: 890,
        retweets: 245,
        created: '5시간 전',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:500 lang:ko`)}&src=typed_query&f=top`
      },
      {
        id: '3',
        text: `요즘 ${searchTerm} 업계에서 가장 핫한 키워드는 무엇일까요? 데이터로 살펴본 2025년 트렌드 TOP 10`,
        author: 'TrendReport',
        likes: 650,
        retweets: 180,
        created: '1일 전',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:500 lang:ko`)}&src=typed_query&f=top`
      },
      {
        id: '4',
        text: `${searchTerm} 전문가들이 말하는 2025년 전망. 준비해야 할 것들과 주목해야 할 변화들을 정리했습니다.`,
        author: 'ExpertNetwork',
        likes: 520,
        retweets: 145,
        created: '2일 전',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} lang:ko`)}&src=typed_query&f=top`
      },
      {
        id: '5',
        text: `실전 ${searchTerm} 가이드: 초보자도 쉽게 따라할 수 있는 5단계 프로세스. 실제 결과 데이터 포함!`,
        author: 'PracticalGuide',
        likes: 450,
        retweets: 120,
        created: '3일 전',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} lang:ko`)}&src=typed_query&f=top`
      }
    ] : [
      {
        id: '1',
        text: `Latest ${searchTerm} trends analysis shows higher than expected market growth this year. #${searchTerm} #Marketing`,
        author: 'MarketingInsights',
        likes: 1250,
        retweets: 340,
        created: '2h ago',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:1000 lang:en`)}&src=typed_query&f=top`
      },
      {
        id: '2',
        text: `Sharing ${searchTerm} success case study. Small changes led to big results. Practical tips you can apply immediately.`,
        author: 'BusinessCoach',
        likes: 890,
        retweets: 245,
        created: '5h ago',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:500 lang:en`)}&src=typed_query&f=top`
      },
      {
        id: '3',
        text: `What are the hottest ${searchTerm} keywords right now? Data-driven look at TOP 10 trends for 2025`,
        author: 'TrendReport',
        likes: 650,
        retweets: 180,
        created: '1d ago',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} min_faves:500 lang:en`)}&src=typed_query&f=top`
      },
      {
        id: '4',
        text: `${searchTerm} experts discuss 2025 outlook. Key preparations and changes to watch for.`,
        author: 'ExpertNetwork',
        likes: 520,
        retweets: 145,
        created: '2d ago',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} lang:en`)}&src=typed_query&f=top`
      },
      {
        id: '5',
        text: `Practical ${searchTerm} guide: 5-step process anyone can follow. Includes real results data!`,
        author: 'PracticalGuide',
        likes: 450,
        retweets: 120,
        created: '3d ago',
        url: `https://twitter.com/search?q=${encodeURIComponent(`${searchTerm} lang:en`)}&src=typed_query&f=top`
      }
    ]

    // Build search query
    const searchQuery = `${searchTerm} min_faves:500 lang:ko`
    const encodedQuery = encodeURIComponent(searchQuery)
    const twitterUrl = `https://twitter.com/search?q=${encodedQuery}&src=typed_query&f=top`

    return NextResponse.json({
      success: true,
      data: {
        keyword: searchTerm,
        primaryUrl: twitterUrl,
        primaryQuery: searchQuery,
        tweets: sampleTweets,
        notice: 'Sample tweets. Twitter API integration available with API keys.'
      },
    })
  } catch (error) {
    console.error('Twitter URL generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate Twitter search URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
