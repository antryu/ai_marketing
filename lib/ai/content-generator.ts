import OpenAI from "openai"
import { GenerateContentParams, GenerateContentResponse } from "@/types/content.types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateContent({
  brand,
  persona,
  topic,
  platform,
}: GenerateContentParams): Promise<GenerateContentResponse> {
  const platformRules = {
    threads: {
      max_length: 500,
      optimal_length: "150-300",
      tone: "conversational, friendly",
      structure: "Hook (1-2 lines) → Body (2-3 paragraphs) → CTA (1 line)",
      hashtags: "3-5개",
      emoji: "2-3개 적당히",
    },
    linkedin: {
      max_length: 3000,
      optimal_length: "1200-1500",
      tone: "professional but authentic",
      structure: "Hook (2 lines) → Story/Data (3-4 paragraphs) → Insight → CTA",
      hashtags: "3-5개",
      emoji: "최소한만",
    },
  }

  const rules = platformRules[platform]

  const prompt = `
당신은 ${brand.name}의 ${platform} 마케터입니다.

브랜드 정보:
- 톤: ${brand.brand_voice?.tone || "professional"}
- 스타일: ${brand.brand_voice?.style || "friendly"}

타겟 고객:
- 페르소나: ${persona.name}
- 주요 고민: ${persona.pain_points?.join(", ")}
- 관심사: ${persona.content_preferences?.topics?.join(", ")}

토픽: ${topic}

${platform.toUpperCase()} 최적화 규칙:
- 길이: ${rules.optimal_length}자
- 톤: ${rules.tone}
- 구조: ${rules.structure}
- 해시태그: ${rules.hashtags}
- 이모지: ${rules.emoji}

다음 JSON 형식으로 응답하세요:
{
  "content": "생성된 콘텐츠",
  "hashtags": ["해시태그1", "해시태그2"],
  "metadata": {
    "hook_strength": "high|medium|low",
    "estimated_engagement": "high|medium|low",
    "length": 숫자
  }
}
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert ${platform} content creator. Always respond in valid JSON.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  })

  const result = JSON.parse(response.choices[0].message.content || "{}")

  return result
}
