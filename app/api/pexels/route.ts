import { NextResponse } from 'next/server'

const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'business'
  const type = searchParams.get('type') || 'photos' // photos or videos
  const perPage = searchParams.get('per_page') || '5'

  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_api_key') {
    // Fallback to Unsplash Source (no API key needed)
    return NextResponse.json({
      success: true,
      source: 'unsplash',
      results: Array.from({ length: parseInt(perPage) }, (_, i) => ({
        id: `unsplash-${i}`,
        type: 'image',
        url: `https://source.unsplash.com/1280x720/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
        thumbnail: `https://source.unsplash.com/640x360/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
        width: 1280,
        height: 720,
        photographer: 'Unsplash'
      }))
    })
  }

  try {
    const endpoint = type === 'videos'
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
      : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Pexels API error')
    }

    const data = await response.json()

    if (type === 'videos') {
      return NextResponse.json({
        success: true,
        source: 'pexels',
        results: data.videos?.map((video: any) => ({
          id: video.id,
          type: 'video',
          url: video.video_files?.[0]?.link,
          thumbnail: video.image,
          width: video.width,
          height: video.height,
          duration: video.duration,
          photographer: video.user?.name
        })) || []
      })
    }

    return NextResponse.json({
      success: true,
      source: 'pexels',
      results: data.photos?.map((photo: any) => ({
        id: photo.id,
        type: 'image',
        url: photo.src?.large2x || photo.src?.large,
        thumbnail: photo.src?.medium,
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer
      })) || []
    })

  } catch (error: any) {
    console.error('Pexels API error:', error)

    // Fallback to Unsplash
    return NextResponse.json({
      success: true,
      source: 'unsplash-fallback',
      results: Array.from({ length: parseInt(perPage) }, (_, i) => ({
        id: `fallback-${i}`,
        type: 'image',
        url: `https://source.unsplash.com/1280x720/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
        thumbnail: `https://source.unsplash.com/640x360/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
        width: 1280,
        height: 720,
        photographer: 'Unsplash'
      }))
    })
  }
}
