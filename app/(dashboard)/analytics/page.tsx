"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart3, TrendingUp, Eye, Heart, Share2, MessageCircle, ArrowUp, ArrowDown } from "lucide-react"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d") // 7d, 30d, 90d

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    const supabase = createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    if (timeRange === "7d") startDate.setDate(startDate.getDate() - 7)
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30)
    else startDate.setDate(startDate.getDate() - 90)

    // Get analytics data
    const result = await (supabase as any)
      .from("analytics")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])

    const data = result.data as any[]

    // Aggregate data
    const aggregated = {
      totalViews: data?.reduce((sum, item) => sum + (item.views || 0), 0) || 0,
      totalImpressions: data?.reduce((sum, item) => sum + (item.impressions || 0), 0) || 0,
      totalLikes: data?.reduce((sum, item) => sum + (item.likes || 0), 0) || 0,
      totalComments: data?.reduce((sum, item) => sum + (item.comments || 0), 0) || 0,
      totalShares: data?.reduce((sum, item) => sum + (item.shares || 0), 0) || 0,
      avgEngagementRate: data && data.length > 0
        ? data.reduce((sum, item) => sum + (parseFloat(item.engagement_rate) || 0), 0) / data.length
        : 0,
      platformBreakdown: {} as any,
    }

    // Platform breakdown
    const platforms = ["thread", "linkedin", "instagram", "twitter"]
    platforms.forEach(platform => {
      const platformData = data?.filter(item => item.platform === platform) || []
      aggregated.platformBreakdown[platform] = {
        views: platformData.reduce((sum, item) => sum + (item.views || 0), 0),
        engagement: platformData.reduce((sum, item) => sum + (item.likes + item.comments + item.shares || 0), 0),
      }
    })

    setAnalytics(aggregated)
    setLoading(false)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const stats = [
    {
      name: "총 조회수",
      value: analytics?.totalViews || 0,
      icon: Eye,
      change: "+12.5%",
      trend: "up"
    },
    {
      name: "총 노출수",
      value: analytics?.totalImpressions || 0,
      icon: TrendingUp,
      change: "+8.2%",
      trend: "up"
    },
    {
      name: "총 좋아요",
      value: analytics?.totalLikes || 0,
      icon: Heart,
      change: "+15.3%",
      trend: "up"
    },
    {
      name: "평균 참여율",
      value: `${analytics?.avgEngagementRate?.toFixed(1) || 0}%`,
      icon: Share2,
      change: "+2.1%",
      trend: "up"
    },
  ]

  const platformStats = [
    {
      name: "Threads",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.815-3.21 1.815-4.065 0-1.138-.243-2.08-.722-2.804-.448-.677-1.089-1.204-1.905-1.568.654-.282 1.204-.7 1.633-1.244.512-.65.77-1.41.77-2.262 0-1.743-1.301-3.127-3.14-3.127-1.839 0-3.14 1.384-3.14 3.127 0 .396.069.772.203 1.118.134.346.33.659.582.932.252.273.555.5.901.676.346.176.73.282 1.143.315.587.047 1.143-.02 1.65-.198.506-.178.944-.459 1.302-.836.358-.377.626-.84.8-1.379.174-.54.243-1.138.243-1.785 0-1.138-.243-2.08-.722-2.804-.448-.677-1.089-1.204-1.905-1.568.654-.282 1.204-.7 1.633-1.244.512-.65.77-1.41.77-2.262 0-1.743-1.301-3.127-3.14-3.127-1.839 0-3.14 1.384-3.14 3.127 0 .396.069.772.203 1.118z"/>
        </svg>
      ),
      views: analytics?.platformBreakdown?.thread?.views || 0,
      engagement: analytics?.platformBreakdown?.thread?.engagement || 0,
      color: "purple"
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      views: analytics?.platformBreakdown?.linkedin?.views || 0,
      engagement: analytics?.platformBreakdown?.linkedin?.engagement || 0,
      color: "blue"
    },
    {
      name: "Instagram",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      views: analytics?.platformBreakdown?.instagram?.views || 0,
      engagement: analytics?.platformBreakdown?.instagram?.engagement || 0,
      color: "pink"
    },
    {
      name: "X",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      views: analytics?.platformBreakdown?.twitter?.views || 0,
      engagement: analytics?.platformBreakdown?.twitter?.engagement || 0,
      color: "sky"
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 font-normal">데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-light tracking-wide text-white">분석</h1>
              <p className="text-zinc-300 font-normal text-base tracking-wide">
                콘텐츠 성과를 추적하세요
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[
              { value: "7d", label: "7일" },
              { value: "30d", label: "30일" },
              { value: "90d", label: "90일" },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 text-sm font-normal tracking-wide transition-all duration-300 ${
                  timeRange === range.value
                    ? "bg-amber-600 text-white border border-amber-500"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-400/50"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-6 hover:shadow-lg hover:shadow-amber-400/5"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-6 h-6 text-zinc-400 group-hover:text-amber-400 transition-colors duration-300" />
                <div className={`flex items-center gap-1 text-xs font-normal ${
                  stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {stat.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-light mb-2 text-white group-hover:text-amber-400 transition-colors duration-300">
                {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
              </div>
              <div className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
                {stat.name}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <h2 className="text-2xl font-light text-white mb-6 tracking-wide">플랫폼별 성과</h2>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="grid gap-6 md:grid-cols-2">
            {platformStats.map((platform) => {
              const maxViews = Math.max(...platformStats.map(p => p.views))
              const viewsPercentage = maxViews > 0 ? (platform.views / maxViews) * 100 : 0

              return (
                <div key={platform.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${
                        platform.color === "purple" ? "text-purple-400" :
                        platform.color === "blue" ? "text-blue-400" :
                        platform.color === "pink" ? "text-pink-400" :
                        "text-sky-400"
                      }`}>
                        {platform.icon}
                      </div>
                      <span className="text-white font-normal">{platform.name}</span>
                    </div>
                    <span className="text-zinc-400 text-sm font-normal">
                      {formatNumber(platform.views)} 조회
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-zinc-800 border border-zinc-700 relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        platform.color === "purple" ? "bg-purple-600" :
                        platform.color === "blue" ? "bg-blue-600" :
                        platform.color === "pink" ? "bg-pink-600" :
                        "bg-sky-600"
                      }`}
                      style={{ width: `${viewsPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 font-normal">
                    <span>{formatNumber(platform.engagement)} 참여</span>
                    <span>{((platform.engagement / (platform.views || 1)) * 100).toFixed(1)}% 참여율</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Content */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <h2 className="text-2xl font-light text-white mb-6 tracking-wide">인기 콘텐츠</h2>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="text-center py-16 border border-dashed border-zinc-700">
            <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 font-normal mb-2">분석 데이터 수집 중</p>
            <p className="text-sm text-zinc-500 font-normal">
              콘텐츠를 발행하면 성과 데이터가 여기에 표시됩니다
            </p>
          </div>
        </div>

        {/* Engagement Timeline */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <h2 className="text-2xl font-light text-white mb-6 tracking-wide">참여도 추이</h2>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="text-center py-16 border border-dashed border-zinc-700">
            <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 font-normal mb-2">차트 데이터 준비 중</p>
            <p className="text-sm text-zinc-500 font-normal">
              시간별 참여도 차트가 곧 추가됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
