import { NextRequest, NextResponse } from 'next/server'
import googleTrends from 'google-trends-api'

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

    // Get related queries
    const relatedQueriesPromise = googleTrends.relatedQueries({
      keyword,
      geo: 'KR', // South Korea
      hl: 'ko', // Korean language
    })

    // Get interest over time (last 30 days)
    const interestOverTimePromise = googleTrends.interestOverTime({
      keyword,
      geo: 'KR',
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    })

    const [relatedQueriesRaw, interestOverTimeRaw] = await Promise.all([
      relatedQueriesPromise,
      interestOverTimePromise,
    ])

    // Parse results
    const relatedQueries = JSON.parse(relatedQueriesRaw)
    const interestOverTime = JSON.parse(interestOverTimeRaw)

    // Extract top related queries
    const topQueries = relatedQueries?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10) || []
    const risingQueries = relatedQueries?.default?.rankedList?.[1]?.rankedKeyword?.slice(0, 10) || []

    // Extract timeline data
    const timeline = interestOverTime?.default?.timelineData || []

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        topQueries: topQueries.map((q: any) => ({
          query: q.query,
          value: q.value,
        })),
        risingQueries: risingQueries.map((q: any) => ({
          query: q.query,
          value: q.value,
        })),
        timeline: timeline.map((t: any) => ({
          time: t.formattedTime,
          value: t.value[0],
        })),
      },
    })
  } catch (error) {
    console.error('Google Trends API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Google Trends data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
