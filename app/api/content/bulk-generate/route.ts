import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 플랫폼별 최적화 함수
function optimizeForPlatform(baseContent: string, platform: string): { text: string; hashtags: string[] } {
  const hashtags: string[] = []

  switch (platform) {
    case "threads":
      // Threads: 300자 이내, 캐주얼, 2-3개 해시태그, 이모지 활용
      const threadsText = baseContent.slice(0, 280) + (baseContent.length > 280 ? "..." : "")
      return {
        text: threadsText + " ✨",
        hashtags: ["#마케팅자동화", "#AI콘텐츠"],
      }

    case "linkedin":
      // LinkedIn: 1300자 이내, 전문적, 비즈니스 인사이트
      const linkedinText = baseContent.slice(0, 1280) + (baseContent.length > 1280 ? "..." : "")
      return {
        text: linkedinText + "\n\n💼 비즈니스 성장을 위한 스마트한 선택",
        hashtags: ["#마케팅", "#AI", "#비즈니스자동화", "#디지털마케팅"],
      }

    case "x":
      // X.com: 280자 이내, 간결하고 임팩트
      const xText = baseContent.slice(0, 260) + (baseContent.length > 260 ? "..." : "")
      return {
        text: xText,
        hashtags: ["#AI", "#마케팅"],
      }

    default:
      return { text: baseContent, hashtags: [] }
  }
}

// AI 콘텐츠 생성 함수 (Ollama 사용)
async function generateWithOllama(prompt: string, model: string = "qwen2.5:7b"): Promise<string> {
  try {
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
    return data.response || ""
  } catch (error) {
    console.error("Ollama generation error:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 })
    }

    const { productInfo, count, platforms, aiModel } = await request.json()

    if (!productInfo || !count || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "필수 정보 누락" }, { status: 400 })
    }

    if (count < 1 || count > 50) {
      return NextResponse.json({ error: "생성 개수는 1-50 사이여야 합니다" }, { status: 400 })
    }

    // AI 모델 기본값 설정
    const selectedModel = aiModel || "qwen2.5:7b"

    // 사용자의 첫 번째 브랜드 가져오기 (없으면 생성)
    const { data: brands } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id" as any, user.id)
      .limit(1)

    let brandId: string
    if (!brands || brands.length === 0) {
      const { data: newBrand, error: brandError } = await supabase
        .from("brands")
        .insert({
          user_id: user.id,
          name: "기본 브랜드",
          description: "자동 생성된 브랜드",
        })
        .select("id")
        .single()

      if (brandError || !newBrand) {
        return NextResponse.json({ error: "브랜드 생성 실패" }, { status: 500 })
      }
      brandId = newBrand.id
    } else {
      brandId = brands[0].id
    }

    const contents = []

    // 일괄 생성 (병렬 처리)
    const generationPromises = Array.from({ length: count }, async (_, index) => {
      try {
        const prompt = `다음 제품/서비스에 대한 마케팅 콘텐츠를 한국어로 작성해주세요. 매번 다른 각도와 메시지로 작성하세요.

제품 정보: ${productInfo}

콘텐츠 번호: ${index + 1}/${count}

다음 요구사항을 만족하는 콘텐츠를 작성해주세요:
1. 매력적이고 설득력 있는 메시지
2. 제품의 핵심 가치 전달
3. 타겟 고객의 문제 해결 강조
4. 명확한 행동 유도 (CTA)
5. 200-300자 분량
6. 반드시 한국어로만 작성

IMPORTANT: 답변은 반드시 한국어로만 작성하세요. 영어나 중국어를 사용하지 마세요.
콘텐츠만 작성하고, 다른 설명은 하지 마세요.`

        const aiContent = await generateWithOllama(prompt, selectedModel)

        // 플랫폼별 최적화
        const platformVariations: any = {}
        platforms.forEach((platform: string) => {
          const optimized = optimizeForPlatform(aiContent, platform)
          platformVariations[platform] = {
            text: optimized.text,
            hashtags: optimized.hashtags,
          }
        })

        // DB에 저장
        const { data: savedContent, error: saveError } = await supabase
          .from("contents")
          .insert({
            brand_id: brandId,
            title: `자동 생성 콘텐츠 #${index + 1}`,
            body: aiContent,
            platform_variations: platformVariations,
            ai_model: selectedModel,
            status: "draft",
          })
          .select()
          .single()

        if (saveError) {
          console.error("Save error:", saveError)
          return {
            success: false,
            error: "저장 실패",
            index: index + 1,
            aiModel: selectedModel,
          }
        }

        return {
          success: true,
          body: aiContent,
          platforms,
          contentId: savedContent.id,
          index: index + 1,
          aiModel: selectedModel,
        }
      } catch (error: any) {
        console.error(`Generation error for content ${index + 1}:`, error)
        return {
          success: false,
          error: error.message || "생성 실패",
          index: index + 1,
          aiModel: selectedModel,
        }
      }
    })

    // 모든 생성 작업 대기
    const results = await Promise.all(generationPromises)

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      contents: results,
      summary: {
        total: count,
        success: successCount,
        failed: failCount,
      },
    })
  } catch (error: any) {
    console.error("Bulk generate error:", error)
    return NextResponse.json(
      { error: error.message || "일괄 생성 실패" },
      { status: 500 }
    )
  }
}
