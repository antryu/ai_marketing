import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch user's custom prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user's custom prompts
    const { data: prompts, error } = await supabase
      .from('user_prompts')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching prompts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prompts: prompts || []
    })
  } catch (error) {
    console.error('Prompts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update a custom prompt
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { category, prompt_content, language = 'ko' } = await request.json()

    if (!category || !prompt_content) {
      return NextResponse.json(
        { error: 'Category and prompt_content are required' },
        { status: 400 }
      )
    }

    // Check if prompt already exists for this user and category
    const { data: existingPrompt } = await supabase
      .from('user_prompts')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category)
      .single()

    let result
    if (existingPrompt) {
      // Update existing prompt
      result = await supabase
        .from('user_prompts')
        .update({
          prompt_content,
          language,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPrompt.id)
        .select()
        .single()
    } else {
      // Create new prompt
      result = await supabase
        .from('user_prompts')
        .insert({
          user_id: user.id,
          category,
          prompt_content,
          language
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving prompt:', result.error)
      return NextResponse.json(
        { error: 'Failed to save prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prompt: result.data
    })
  } catch (error) {
    console.error('Prompts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a custom prompt (reset to default)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category)

    if (error) {
      console.error('Error deleting prompt:', error)
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt reset to default'
    })
  } catch (error) {
    console.error('Prompts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
