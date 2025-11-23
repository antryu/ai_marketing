import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure profile exists (create if not)
    const profileResult = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single()

    if (!profileResult.data) {
      await (supabase as any).from("profiles").insert({
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || session.user.email,
      })
    }

    const body = await request.json()
    const { name, description, product_type, target_market, brand_voice } = body

    // Create brand
    const brandResult = await (supabase as any)
      .from("brands")
      .insert({
        user_id: session.user.id,
        name,
        description,
        product_type,
        target_market,
        brand_voice,
      })
      .select()
      .single()

    if (brandResult.error) throw brandResult.error

    return NextResponse.json(brandResult.data)
  } catch (error: any) {
    console.error("Brand creation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's brands
    const brandsResult = await (supabase as any)
      .from("brands")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (brandsResult.error) throw brandsResult.error

    return NextResponse.json(brandsResult.data)
  } catch (error: any) {
    console.error("Brands fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    )
  }
}
