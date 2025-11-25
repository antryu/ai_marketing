import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RedditPost {
  title: string
  subreddit: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  permalink: string
  url: string
  selftext?: string
}

interface RedditSearchResult {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  created: string
  preview?: string
}

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    // Reddit JSON API (no authentication needed for public data)
    // Search across all subreddits
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=top&t=month&limit=10`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'MarketingAutomation/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract top posts
    const posts: RedditSearchResult[] = data.data.children
      .map((child: any) => {
        const post: RedditPost = child.data
        return {
          title: post.title,
          subreddit: post.subreddit,
          score: post.score,
          comments: post.num_comments,
          url: `https://reddit.com${post.permalink}`,
          created: new Date(post.created_utc * 1000).toLocaleDateString(),
          preview: post.selftext ? post.selftext.substring(0, 200) : undefined,
        }
      })
      .filter((post: RedditSearchResult) => post.score > 10) // Filter low engagement posts

    // Get related subreddits by analyzing which subreddits appear most
    const subredditCounts = posts.reduce((acc: Record<string, number>, post) => {
      acc[post.subreddit] = (acc[post.subreddit] || 0) + 1
      return acc
    }, {})

    const relatedSubreddits = Object.entries(subredditCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([subreddit]) => ({
        name: subreddit,
        url: `https://reddit.com/r/${subreddit}`,
      }))

    // Also search in specific marketing-related subreddits
    const relevantSubreddits = [
      'marketing',
      'smallbusiness',
      'entrepreneur',
      'startups',
      'socialmedia',
      'content_marketing',
      'SEO',
      'PPC',
      'digital_marketing',
    ]

    // Generate search URLs for relevant subreddits
    const subredditSearches = relevantSubreddits.slice(0, 5).map(sub => ({
      name: `r/${sub}`,
      searchUrl: `https://reddit.com/r/${sub}/search?q=${encodeURIComponent(keyword)}&restrict_sr=1&sort=top&t=month`,
    }))

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        posts,
        relatedSubreddits,
        suggestedSearches: subredditSearches,
        totalResults: posts.length,
      },
    })
  } catch (error) {
    console.error('Reddit API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Reddit data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
