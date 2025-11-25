import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    // Check for Naver DataLab API credentials
    const clientId = process.env.NAVER_CLIENT_ID
    const clientSecret = process.env.NAVER_CLIENT_SECRET

    // Return mock data immediately if no credentials
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: true,
        data: {
          keyword,
          notice: 'Naver DataLab API requires authentication. Using sample data.',
          mockData: true,
          timeline: generateMockTimeline(),
          relatedKeywords: generateMockRelatedKeywords(keyword),
        }
      })
    }

    // Calculate date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    // Naver DataLab API request body
    const requestBody = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      timeUnit: 'date',
      keywordGroups: [
        {
          groupName: keyword,
          keywords: [keyword]
        }
      ]
    }

    // Call Naver DataLab API
    const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract timeline data
    const timeline = data.results?.[0]?.data || []

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        timeline: timeline.map((item: any) => ({
          date: item.period,
          value: item.ratio,
        })),
        source: 'naver_datalab',
      },
    })
  } catch (error) {
    console.error('Naver DataLab API error:', error)

    // Return mock data on error
    const { keyword } = await request.json()
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Naver DataLab data',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: {
        keyword,
        notice: 'Using mock data due to API error',
        mockData: true,
        timeline: generateMockTimeline(),
        relatedKeywords: generateMockRelatedKeywords(keyword),
      }
    })
  }
}

// Helper function to generate mock timeline data
function generateMockTimeline() {
  const timeline = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    timeline.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100) + 1,
    })
  }

  return timeline
}

// Helper function to generate mock related keywords
function generateMockRelatedKeywords(keyword: string) {
  return [
    `${keyword} 방법`,
    `${keyword} 추천`,
    `${keyword} 가격`,
    `${keyword} 후기`,
    `${keyword} 비교`,
  ]
}
