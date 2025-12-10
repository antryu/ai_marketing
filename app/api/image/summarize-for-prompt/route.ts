import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface SummarizeRequest {
  topic: string
  content: string
  style?: 'realistic' | 'illustration' | 'minimal' | 'vibrant'
  language?: 'ko' | 'en'
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json()
    const { topic, content, style = 'realistic', language = 'ko' } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'ko' ? '콘텐츠가 필요합니다' : 'Content is required' },
        { status: 400 }
      )
    }

    // Style descriptions for better image generation
    const styleDescriptions: Record<string, string> = {
      realistic: 'photorealistic, professional photography style',
      illustration: 'digital illustration, artistic and creative',
      minimal: 'minimalist, clean and simple design',
      vibrant: 'vibrant colors, bold and eye-catching'
    }

    const styleDesc = styleDescriptions[style] || styleDescriptions.realistic

    // Use Claude to extract visual elements and create an optimal image prompt
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are an expert at creating image generation prompts. Analyze the following marketing content and create a concise, vivid image prompt that captures the visual essence.

Topic: ${topic}

Content:
${content}

Style: ${styleDesc}

Instructions:
1. Extract the main visual concept or scene that would best represent this content
2. Focus on concrete visual elements (objects, settings, colors, mood)
3. Avoid abstract concepts that can't be visualized
4. Do NOT include any text, words, letters, or typography in the image description
5. Keep the prompt under 100 words
6. Output ONLY the English image prompt, nothing else

Image Prompt:`
        }
      ]
    })

    const promptContent = response.content[0]
    if (promptContent.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const imagePrompt = promptContent.text.trim()

    console.log('=== AI Image Prompt Generated ===')
    console.log(`Topic: ${topic}`)
    console.log(`Original content length: ${content.length}`)
    console.log(`Generated prompt: ${imagePrompt}`)

    return NextResponse.json({
      success: true,
      imagePrompt,
      originalTopic: topic,
      style
    })

  } catch (error) {
    console.error('Summarize for prompt error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
