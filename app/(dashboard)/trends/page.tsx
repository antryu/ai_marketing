"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBrand } from "@/contexts/BrandContext"
import { createClient } from "@/lib/supabase/client"
import { translations, TranslationKey } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Search, ExternalLink, Sparkles, BarChart3, Target } from "lucide-react"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

interface TrendData {
  googleTrends?: {
    topQueries: Array<{ query: string; value: number }>
    risingQueries: Array<{ query: string; value: number }>
    timeline: Array<{ time: string; value: number }>
  }
  twitter?: {
    primaryUrl: string
    primaryQuery: string
    tweets?: Array<{
      id: string
      text: string
      author: string
      likes: number
      retweets: number
      created: string
      url: string
    }>
    notice?: string
  }
  reddit?: {
    posts: Array<{
      title: string
      subreddit: string
      score: number
      comments: number
      url: string
      created: string
      preview?: string
    }>
    relatedSubreddits: Array<{
      name: string
      url: string
    }>
    suggestedSearches: Array<{
      name: string
      searchUrl: string
    }>
  }
  naver?: {
    timeline: Array<{ date: string; value: number }>
    relatedKeywords?: string[]
    mockData?: boolean
    notice?: string
  }
}

interface Persona {
  id: string
  name: string
  description: string
  age_range: string
  gender: string
  job_title: string[]
  industry: string[]
  pain_points: string[]
  goals: string[]
}

export default function TrendsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { selectedBrandId } = useBrand()
  const t = (key: TranslationKey) => translations[key][language]

  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("")

  // Load personas when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      loadPersonas()
    }
  }, [selectedBrandId])

  // Load suggestions when persona or language changes
  useEffect(() => {
    if (selectedPersonaId) {
      loadSuggestions()
    }
  }, [selectedPersonaId, language])

  const loadPersonas = async () => {
    try {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from("personas")
        .select("id, name, description, age_range, gender, job_title, industry, pain_points, goals")
        .eq("brand_id", selectedBrandId)
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        setPersonas(data)
        // Auto-select first persona
        if (!selectedPersonaId) {
          setSelectedPersonaId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error loading personas:", error)
    }
  }

  const loadSuggestions = async () => {
    if (!selectedPersonaId) return

    try {
      const res = await fetch(`/api/trends/suggestions?personaId=${selectedPersonaId}&language=${language}`)
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.data)
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const analyzeTrends = async () => {
    if (!keyword.trim()) {
      toast.error(t("keywordRequired"))
      return
    }

    setLoading(true)

    try {
      // Fetch all trend data in parallel
      const [googleRes, twitterRes, redditRes, naverRes] = await Promise.all([
        fetch("/api/trends/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        }),
        fetch("/api/trends/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        }),
        fetch("/api/trends/reddit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        }),
        fetch("/api/trends/naver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        }),
      ])

      const [googleData, twitterData, redditData, naverData] = await Promise.all([
        googleRes.json(),
        twitterRes.json(),
        redditRes.json(),
        naverRes.json(),
      ])

      const newTrendData = {
        googleTrends: googleData.success ? googleData.data : null,
        twitter: twitterData.success ? twitterData.data : null,
        reddit: redditData.success ? redditData.data : null,
        naver: naverData.data || null,
      }

      console.log('Trend Data:', newTrendData)
      console.log('Reddit posts:', newTrendData.reddit?.posts?.length)

      setTrendData(newTrendData)

      if (naverData.data?.mockData) {
        toast.info(naverData.data.notice || "Using sample data for Naver")
      }

      // Show success message with data counts
      toast.success(`분석 완료: Google ${googleData.success ? '✓' : '✗'} | Twitter ${twitterData.success ? '✓' : '✗'} | Reddit ${redditData.success ? '✓' : '✗'} (${redditData.data?.posts?.length || 0}개)`)
    } catch (error) {
      console.error("Trend analysis error:", error)
      toast.error(t("trendsError"))
    } finally {
      setLoading(false)
    }
  }

  const createContentWithTopic = (topic: string) => {
    router.push(`/content/create?topic=${encodeURIComponent(topic)}`)
  }

  const formatMetric = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Persona Selection - Only show if 2 or more personas exist */}
        {personas.length >= 2 && (
          <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
            <div className="flex items-center gap-4">
              <Target className="h-5 w-5 text-amber-400" />
              <div className="flex-1">
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  {language === "ko" ? "타겟 고객 선택" : "Select Target Customer"}
                </label>
                <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.name} ({persona.age_range} · {persona.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPersonaId && personas.find(p => p.id === selectedPersonaId) && (
                  <p className="text-xs text-zinc-500 mt-2">
                    {personas.find(p => p.id === selectedPersonaId)?.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* AI Suggestions */}
        {!loadingSuggestions && suggestions && (
          <Card className="p-6 bg-gradient-to-br from-amber-400/10 via-zinc-900 to-zinc-900 border-amber-400/30 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <div>
                <h2 className="text-xl font-medium text-white">
                  {language === "ko"
                    ? `${suggestions.personaName ? `${suggestions.personaName} (${suggestions.personaInfo})` : suggestions.brandName}님을 위한 AI 추천 토픽`
                    : `AI Recommended Topics for ${suggestions.personaName ? `${suggestions.personaName} (${suggestions.personaInfo})` : suggestions.brandName}`
                  }
                </h2>
                <p className="text-zinc-400 text-sm">
                  {language === "ko"
                    ? `${suggestions.industry} 업계 · ${suggestions.personaName ? '타겟 고객 기반' : '브랜드 기반'} · 실시간 트렌드 자동 생성`
                    : `${suggestions.industry} Industry · ${suggestions.personaName ? 'Target Customer Based' : 'Brand Based'} · Real-time Trend Generation`
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.suggestions.slice(0, 6).map((sug: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setKeyword(sug.keyword)
                    setTrendData(null)
                    analyzeTrends()
                  }}
                  className="p-4 bg-zinc-950 rounded border border-zinc-800 hover:border-amber-400/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium group-hover:text-amber-400 transition-colors">
                      {sug.keyword}
                    </h3>
                    {sug.priority === 'high' && (
                      <span className="text-xs bg-amber-400 text-black px-2 py-0.5 rounded font-medium">
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm mb-3 line-clamp-2">
                    {sug.reason}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>
                      {language === "ko" ? "추천 토픽" : "Recommended Topic"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Search Input */}
        <Card className="p-6 bg-zinc-900 border-zinc-800 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("industryPlaceholder")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && analyzeTrends()}
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={analyzeTrends}
              disabled={loading}
              className="bg-amber-400 text-black hover:bg-amber-500"
            >
              {loading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  {t("analyzing")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t("analyzeTrends")}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {!trendData && !loading && (
          <div className="text-center py-16">
            <BarChart3 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">{t("enterKeywordToAnalyze")}</p>
          </div>
        )}

        {trendData && (
          <div className="space-y-6">
            {/* Unified Trend Cards */}
            <div className="grid grid-cols-1 gap-4">
              {/* Google Trends Topics */}
              {trendData.googleTrends && trendData.googleTrends.topQueries.slice(0, 5).map((query, idx) => (
                <Card key={`google-${idx}`} className="p-5 bg-zinc-900 border-zinc-800 hover:border-amber-400/50 transition-all cursor-pointer group"
                  onClick={() => createContentWithTopic(query.query)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-amber-400 transition-colors">
                        {query.query}
                      </h3>
                      <p className="text-zinc-400 text-sm mb-3">
                        {language === "ko"
                          ? "검색 트렌드 급상승 키워드 · Google에서 인기 검색어로 선정"
                          : "Rising search trend keyword · Selected as popular search by Google"
                        }
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-400 font-medium">Google Trends {language === "ko" ? "검색량" : "Search Volume"}: {query.value}/100</span>
                        </div>
                        <button className="px-4 py-2 bg-amber-400 text-black rounded hover:bg-amber-500 transition-colors flex items-center gap-2 text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); createContentWithTopic(query.query) }}>
                          <Sparkles className="h-4 w-4" />
                          {language === "ko" ? "콘텐츠 생성" : "Create Content"}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Twitter/X Posts */}
              {trendData.twitter && trendData.twitter.tweets && trendData.twitter.tweets.slice(0, 5).map((tweet) => (
                <Card key={`twitter-${tweet.id}`} className="p-5 bg-zinc-900 border-zinc-800 hover:border-blue-400/50 transition-all cursor-pointer group"
                  onClick={() => createContentWithTopic(tweet.text)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {tweet.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {tweet.text.split('.')[0] || tweet.text.substring(0, 80)}
                      </h3>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                        {tweet.text}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400 font-medium">Twitter/X {language === "ko" ? "좋아요" : "Likes"}: {tweet.likes.toLocaleString()} · {language === "ko" ? "리트윗" : "Retweets"}: {tweet.retweets.toLocaleString()}</span>
                          <span className="text-zinc-500">@{tweet.author}</span>
                        </div>
                        <button className="px-4 py-2 bg-amber-400 text-black rounded hover:bg-amber-500 transition-colors flex items-center gap-2 text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); createContentWithTopic(tweet.text) }}>
                          <Sparkles className="h-4 w-4" />
                          {language === "ko" ? "콘텐츠 생성" : "Create Content"}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Reddit Posts */}
              {trendData.reddit && trendData.reddit.posts.slice(0, 5).map((post, idx) => (
                <Card key={`reddit-${idx}`} className="p-5 bg-zinc-900 border-zinc-800 hover:border-orange-400/50 transition-all cursor-pointer group"
                  onClick={() => createContentWithTopic(post.title)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                        {post.preview || (language === "ko"
                          ? `Reddit에서 ${post.score.toLocaleString()}명이 공감한 ${post.subreddit} 커뮤니티의 인기 토론 주제`
                          : `Popular discussion topic in ${post.subreddit} community with ${post.score.toLocaleString()} upvotes on Reddit`
                        )}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-orange-400 font-medium">Reddit {language === "ko" ? "추천" : "Upvotes"}: {post.score.toLocaleString()} · {language === "ko" ? "댓글" : "Comments"}: {post.comments.toLocaleString()}</span>
                          <span className="text-zinc-500">r/{post.subreddit}</span>
                        </div>
                        <button className="px-4 py-2 bg-amber-400 text-black rounded hover:bg-amber-500 transition-colors flex items-center gap-2 text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); createContentWithTopic(post.title) }}>
                          <Sparkles className="h-4 w-4" />
                          {language === "ko" ? "콘텐츠 생성" : "Create Content"}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
