import Anthropic from "@anthropic-ai/sdk"
import { Persona } from "@/types/persona.types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generatePersonas(brand: any): Promise<Persona[]> {
  const prompt = `
당신은 마케팅 전문가입니다. 다음 제품의 타겟 고객 페르소나를 생성하세요.

제품 정보:
- 이름: ${brand.name}
- 설명: ${brand.description}
- 타입: ${brand.product_type}
- 시장: ${brand.target_market?.join(", ")}

**중요: 반드시 서로 다른 3개의 페르소나를 생성하세요. 각 페르소나는 다른 직급, 산업, 목표를 가져야 합니다.**

예시:
1. Primary 페르소나 (핵심 의사결정자) - 예: CEO, 창업자
2. Secondary 페르소나 (실무 담당자) - 예: 마케팅 매니저, 팀 리더
3. Tertiary 페르소나 (영향력 있는 사용자) - 예: 프리랜서, 컨설턴트

다음 형식으로 3개의 서로 다른 페르소나를 생성하세요:

{
  "personas": [
    {
      "name": "페르소나 이름 (예: 바쁜 마케팅 매니저)",
      "description": "간단한 설명",
      "age_range": "25-34",
      "gender": "any",
      "location": ["한국", "미국"],
      "job_title": ["Marketing Manager", "CMO"],
      "industry": ["Technology", "SaaS"],
      "company_size": "10-100",
      "pain_points": [
        "콘텐츠 제작 시간 부족",
        "일관된 브랜드 톤 유지 어려움"
      ],
      "goals": [
        "마케팅 생산성 향상",
        "ROI 증대"
      ],
      "values": ["효율성", "품질", "데이터 기반 의사결정"],
      "platforms": ["threads", "linkedin"],
      "content_preferences": {
        "format": ["short_form", "case_studies"],
        "tone": "professional_but_friendly",
        "topics": ["productivity", "marketing_automation"]
      }
    }
  ]
}

JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.
`

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude")
  }

  const result = JSON.parse(content.text)

  return result.personas.map((p: any) => ({
    ...p,
    confidence_score: 0.85, // 초기 신뢰도
    data_sources: ["ai_analysis"],
  }))
}
