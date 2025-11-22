"use client"

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
    const { data } = await supabase
      .from("analytics")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])

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
    { name: "Thread", views: analytics?.platformBreakdown?.thread?.views || 0, engagement: analytics?.platformBreakdown?.thread?.engagement || 0, color: "purple" },
    { name: "LinkedIn", views: analytics?.platformBreakdown?.linkedin?.views || 0, engagement: analytics?.platformBreakdown?.linkedin?.engagement || 0, color: "blue" },
    { name: "Instagram", views: analytics?.platformBreakdown?.instagram?.views || 0, engagement: analytics?.platformBreakdown?.instagram?.engagement || 0, color: "pink" },
    { name: "Twitter/X", views: analytics?.platformBreakdown?.twitter?.views || 0, engagement: analytics?.platformBreakdown?.twitter?.engagement || 0, color: "sky" },
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
                    <span className="text-white font-normal">{platform.name}</span>
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
