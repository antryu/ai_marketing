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

    // Global subreddits only
    const subreddits = ['all', 'popular']  // Global trends for all languages

    // Fetch both hot and top weekly posts from language-specific subreddits
    const fetchPromises = subreddits.flatMap(subreddit => [
      fetch(`https://www.reddit.com/r/${subreddit}/hot/.rss?limit=10`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      }).catch(() => null),
      fetch(`https://www.reddit.com/r/${subreddit}/top/.rss?sort=top&t=week&limit=10`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      }).catch(() => null)
    ])

    const responses = await Promise.all(fetchPromises)
    const [hotRes, topRes] = responses.filter(r => r !== null).slice(0, 2)

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

    // Process all responses and collect posts
    for (let i = 0; i < responses.length; i++) {
      const res = responses[i]
      if (res && res.ok) {
        const text = await res.text()
        const titles = parseRedditRSS(text)
        const isHot = i % 2 === 0  // Even indices are hot, odd are top

        redditData.push(...titles.map(title => ({
          title,
          source: isHot ? 'hot' : 'top_week',
          icon: isHot ? '🔥' : '📈'
        })))
      }
    }

    // Remove duplicates and limit to 10 posts
    const uniquePosts = Array.from(
      new Map(redditData.map(post => [post.title, post])).values()
    ).slice(0, 10)

    // Cache the result
    setCachedReddit(cacheKey, uniquePosts)

    console.log(`✅ Reddit RSS fetched: ${uniquePosts.length} posts (${language === 'ko' ? 'Korean subreddits' : 'English subreddits'})`)

    return NextResponse.json({
      success: true,
      data: uniquePosts,
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
