import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Simple in-memory cache with 30-minute TTL
interface CacheEntry {
  data: any
  timestamp: number
}

const redditCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getCachedReddit(key: string): any | null {
  const entry = redditCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    redditCache.delete(key)
    return null
  }

  return entry.data
}

function setCachedReddit(key: string, data: any): void {
  redditCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'ko'

    // Check cache first
    const cacheKey = `reddit-${language}`
    const cached = getCachedReddit(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      })
    }

    console.log('🔥 Fetching Reddit RSS feeds...')

    // Fetch both hot and top weekly posts
    const [hotRes, topRes] = await Promise.all([
      fetch('https://www.reddit.com/r/all/hot/.rss?limit=15', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000) // 10s timeout
      }).catch(() => null),
      fetch('https://www.reddit.com/r/all/top/.rss?sort=top&t=week&limit=15', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000) // 10s timeout
      }).catch(() => null)
    ])

    const parseRedditRSS = (rssText: string) => {
      // Extract titles from Atom XML using regex
      const titleMatches = rssText.matchAll(/<title>(.*?)<\/title>/g)
      const titles: string[] = []
      let isFirst = true
      for (const match of titleMatches) {
        const title = match[1].trim()
        // Skip the first title (it's "all subreddits")
        if (isFirst) {
          isFirst = false
          continue
        }
        if (title && title.length > 0) {
          titles.push(title)
        }
      }
      return titles
    }

    let redditData: any[] = []

    if (hotRes && hotRes.ok) {
      const hotText = await hotRes.text()
      const hotTitles = parseRedditRSS(hotText)
      redditData.push(...hotTitles.slice(0, 5).map(title => ({
        title,
        source: 'hot',
        icon: '🔥'
      })))
    }

    if (topRes && topRes.ok) {
      const topText = await topRes.text()
      const topTitles = parseRedditRSS(topText)
      redditData.push(...topTitles.slice(0, 5).map(title => ({
        title,
        source: 'top_week',
        icon: '📈'
      })))
    }

    // Cache the result
    setCachedReddit(cacheKey, redditData)

    console.log(`✅ Reddit RSS fetched: ${redditData.length} posts`)

    return NextResponse.json({
      success: true,
      data: redditData,
      cached: false
    })
  } catch (error) {
    console.error('Reddit RSS error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Reddit data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
