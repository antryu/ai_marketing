import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePersonas } from "@/lib/ai/personas"

export async function POST(request: Request) {
  try {
    const { brandId } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // DEVELOPMENT ONLY: Skip authentication checks
    // TODO: Remove this in production!
    const userId = session?.user?.id || "00000000-0000-0000-0000-000000000000" // Mock user ID for development

    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // 브랜드 정보 가져오기
    const brandResult = await (supabase as any)
      .from("brands")
      .select("*")
      .eq("id", brandId)
      // .eq("user_id", userId) // Skip user ownership check in development
      .single()

    if (brandResult.error) throw brandResult.error

    const brand = brandResult.data

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // AI로 페르소나 생성
    const personas = await generatePersonas(brand)

    // DB에 저장
    const personasResult = await (supabase as any)
      .from("personas")
      .insert(
        personas.map((p, index) => ({
          brand_id: brandId,
          name: p.name,
          description: p.description,
          age_range: p.age_range,
          gender: p.gender,
          location: p.location,
          job_title: p.job_title,
          industry: p.industry,
          company_size: p.company_size,
          pain_points: p.pain_points,
          goals: p.goals,
          values: p.values,
          platforms: p.platforms,
          content_preferences: p.content_preferences,
          confidence_score: p.confidence_score,
          data_sources: p.data_sources,
          is_primary: index === 0, // 첫 번째를 primary로
        }))
      )
      .select()

    if (personasResult.error) throw personasResult.error

    return NextResponse.json(personasResult.data)
  } catch (error: any) {
    console.error("Persona generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate personas" },
      { status: 500 }
    )
  }
}
