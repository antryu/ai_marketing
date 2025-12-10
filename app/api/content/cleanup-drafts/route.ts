import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// This API can be called by:
// 1. A cron job (e.g., Vercel Cron)
// 2. Manual admin trigger
// 3. On user login (check user's old drafts)

interface CleanupRequest {
  daysOld?: number  // Default 30 days
  userId?: string   // Optional: clean only specific user's drafts
  dryRun?: boolean  // Optional: just count without deleting
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check for admin auth or cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Verify authorization (cron secret or authenticated user)
    let isAuthorized = false
    let targetUserId: string | undefined

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Cron job - can clean all users' drafts
      isAuthorized = true
    } else {
      // Check user authentication - can only clean their own drafts
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        isAuthorized = true
        targetUserId = user.id
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CleanupRequest = await request.json().catch(() => ({}))
    const {
      daysOld = 30,
      userId = targetUserId,
      dryRun = false
    } = body

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    const cutoffISOString = cutoffDate.toISOString()

    console.log(`=== Draft Cleanup Started ===`)
    console.log(`Cutoff date: ${cutoffISOString} (${daysOld} days ago)`)
    console.log(`Dry run: ${dryRun}`)
    if (userId) {
      console.log(`Target user: ${userId}`)
    }

    // Build query
    let query = supabase
      .from('contents')
      .select('id, topic, created_at, brand_id')
      .eq('status', 'draft')
      .lt('created_at', cutoffISOString)

    // If userId specified, filter by brand ownership
    if (userId) {
      const { data: userBrands } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', userId)

      if (userBrands && userBrands.length > 0) {
        const brandIds = userBrands.map(b => b.id)
        query = query.in('brand_id', brandIds)
      } else {
        // User has no brands, nothing to clean
        return NextResponse.json({
          success: true,
          message: 'No brands found for user',
          deletedCount: 0,
          dryRun
        })
      }
    }

    // Get drafts to delete
    const { data: draftsToDelete, error: selectError } = await query

    if (selectError) {
      console.error('Failed to find old drafts:', selectError)
      return NextResponse.json(
        { error: 'Failed to find old drafts', details: selectError.message },
        { status: 500 }
      )
    }

    const count = draftsToDelete?.length || 0
    console.log(`Found ${count} drafts older than ${daysOld} days`)

    if (dryRun || count === 0) {
      return NextResponse.json({
        success: true,
        message: dryRun ? 'Dry run complete' : 'No old drafts to delete',
        draftsFound: count,
        deletedCount: 0,
        dryRun,
        cutoffDate: cutoffISOString,
        drafts: draftsToDelete?.map(d => ({
          id: d.id,
          topic: d.topic,
          createdAt: d.created_at
        }))
      })
    }

    // Delete old drafts
    const draftIds = draftsToDelete!.map(d => d.id)

    const { error: deleteError } = await supabase
      .from('contents')
      .delete()
      .in('id', draftIds)

    if (deleteError) {
      console.error('Failed to delete old drafts:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete old drafts', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`=== Draft Cleanup Completed ===`)
    console.log(`Deleted ${count} drafts`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} drafts older than ${daysOld} days`,
      deletedCount: count,
      dryRun: false,
      cutoffDate: cutoffISOString,
      deletedDrafts: draftsToDelete?.map(d => ({
        id: d.id,
        topic: d.topic,
        createdAt: d.created_at
      }))
    })

  } catch (error) {
    console.error('Draft cleanup error:', error)
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: Check old drafts count (for dashboard display)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysOld = parseInt(searchParams.get('daysOld') || '30')

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Get user's brands
    const { data: userBrands } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)

    if (!userBrands || userBrands.length === 0) {
      return NextResponse.json({
        success: true,
        oldDraftsCount: 0,
        totalDraftsCount: 0,
        daysOld
      })
    }

    const brandIds = userBrands.map(b => b.id)

    // Count old drafts
    const { count: oldCount } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .in('brand_id', brandIds)
      .lt('created_at', cutoffDate.toISOString())

    // Count total drafts
    const { count: totalCount } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .in('brand_id', brandIds)

    return NextResponse.json({
      success: true,
      oldDraftsCount: oldCount || 0,
      totalDraftsCount: totalCount || 0,
      daysOld,
      cutoffDate: cutoffDate.toISOString()
    })

  } catch (error) {
    console.error('Get drafts count error:', error)
    return NextResponse.json(
      { error: 'Failed to get drafts count' },
      { status: 500 }
    )
  }
}
