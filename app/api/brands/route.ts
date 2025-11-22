import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure profile exists (create if not)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single()

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || session.user.email,
      })
    }

    const body = await request.json()
    const { name, description, product_type, target_market, brand_voice } = body

    // Create brand
    const { data: brand, error: brandError } = await supabase
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

    if (brandError) throw brandError

    return NextResponse.json(brand)
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
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's brands
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(brands)
  } catch (error: any) {
    console.error("Brands fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    )
  }
}
