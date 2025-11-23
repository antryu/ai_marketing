import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Ollama API 호출 함수
async function analyzeWithOllama(text: string, model: string = "qwen2.5:7b") {
  const prompt = `다음 글을 분석하여 작성자의 글쓰기 특성을 파악해주세요.

글:
${text}

다음 형식의 JSON으로 분석 결과를 반환해주세요:
{
  "writing_style": "professional|casual|technical|storytelling|humorous 중 하나",
  "tone": "formal|friendly|authoritative|conversational|inspirational 중 하나",
  "emoji_usage": "heavy|moderate|minimal|none 중 하나",
  "sentence_length": "short|medium|long|mixed 중 하나",
  "technical_terms": true 또는 false,
  "use_analogies": true 또는 false,
  "use_data_statistics": true 또는 false,
  "expertise_areas": ["분야1", "분야2"],
  "unique_perspective": "작성자의 독특한 관점이나 시각 설명",
  "signature_phrases": ["자주 사용하는 표현1", "표현2"],
  "suggested_name": "이 스타일에 어울리는 페르소나 이름"
}

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.response
}

export async function POST(request: Request) {
  try {
    const { text, aiModel } = await request.json()

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: '최소 50자 이상의 글을 입력해주세요' },
        { status: 400 }
      )
    }

    const prompt = `다음 글을 분석하여 작성자의 글쓰기 특성을 파악해주세요.

글:
${text}

다음 항목들을 분석해주세요:

1. 글쓰기 스타일 (professional/casual/technical/storytelling/humorous)
2. 톤 (formal/friendly/authoritative/conversational/inspirational)
3. 이모지 사용 빈도 (heavy/moderate/minimal/none)
4. 문장 길이 선호도 (short/medium/long/mixed)
5. 기술 용어 사용 여부
6. 비유/은유 사용 여부
7. 데이터/통계 활용 여부
8. 전문 분야 (예: 기술, 마케팅, 창업 등)
9. 독특한 관점이나 시각
10. 자주 사용하는 시그니처 표현들
11. 이 스타일에 어울리는 페르소나 이름 제안

다음 JSON 형식으로만 응답해주세요:
{
  "writing_style": "값",
  "tone": "값",
  "emoji_usage": "값",
  "sentence_length": "값",
  "technical_terms": true/false,
  "use_analogies": true/false,
  "use_data_statistics": true/false,
  "expertise_areas": ["분야1", "분야2"],
  "unique_perspective": "설명",
  "signature_phrases": ["표현1", "표현2"],
  "suggested_name": "페르소나 이름"
}`

    let responseText: string

    // Ollama 모델 사용 여부 확인
    const ollamaModels = ['qwen2.5:7b', 'phi3:3.8b', 'llama3.2:3b', 'gemma2:2b']
    const useOllama = aiModel && ollamaModels.includes(aiModel)

    if (useOllama) {
      // Ollama로 분석
      responseText = await analyzeWithOllama(text, aiModel)
    } else {
      // Claude로 분석
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }
      responseText = content.text
    }

    // JSON 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON을 찾을 수 없습니다')
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      analysis,
      aiModel: aiModel || 'claude-3-haiku-20240307'
    })

  } catch (error: any) {
    console.error('Writing analysis error:', error)
    return NextResponse.json(
      { error: error.message || '글 분석 실패' },
      { status: 500 }
    )
  }
}
