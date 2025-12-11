import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoUrl = searchParams.get('url')

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Fetch video from external URL
    const response = await fetch(videoUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: response.status }
      )
    }

    const blob = await response.blob()
    const headers = new Headers()
    headers.set('Content-Type', 'video/mp4')
    headers.set('Content-Disposition', `attachment; filename="ai-video-${Date.now()}.mp4"`)
    headers.set('Content-Length', blob.size.toString())

    return new NextResponse(blob, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Video download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
