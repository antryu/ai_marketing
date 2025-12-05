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
import { TrendingUp, Search, Sparkles, BarChart3, Target, Zap, BookOpen, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [redditTrends, setRedditTrends] = useState<any[]>([])
  const [loadingReddit, setLoadingReddit] = useState(false)
  const [showContentTypeModal, setShowContentTypeModal] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState("")
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Load personas when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      loadPersonas()
    }
  }, [selectedBrandId])

  // Load suggestions when persona or language changes (only first time)
  useEffect(() => {
    if (selectedPersonaId && !hasLoadedOnce) {
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

    setLoadingSuggestions(true)
    try {
      const apiUrl = `/api/trends/suggestions?personaId=${selectedPersonaId}&language=${language}`
      console.log('🔄 Loading suggestions for:', { personaId: selectedPersonaId, language, apiUrl })

      const res = await fetch(apiUrl)
      const data = await res.json()

      console.log('✅ Suggestions received:', {
        personaName: data.data?.personaName,
        cached: data.data?.cached,
        suggestionCount: data.data?.suggestions?.length,
        firstSuggestion: data.data?.suggestions?.[0]?.keyword
      })

      if (data.success) {
        setSuggestions(data.data)
        setHasLoadedOnce(true)
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
      // Load Reddit trends after AI suggestions are displayed
      setTimeout(() => loadRedditTrends(), 100)
    }
  }

  const refreshSuggestions = async () => {
    if (!selectedPersonaId) return

    setLoadingSuggestions(true)
    try {
      // Add timestamp to bypass cache
      const apiUrl = `/api/trends/suggestions?personaId=${selectedPersonaId}&language=${language}&refresh=${Date.now()}`
      const res = await fetch(apiUrl)
      const data = await res.json()

      if (data.success) {
        setSuggestions(data.data)
        toast.success(language === "ko" ? "새로운 토픽을 가져왔습니다!" : "New topics loaded!")
      }
    } catch (error) {
      console.error("Failed to refresh suggestions:", error)
      toast.error(language === "ko" ? "토픽 새로고침 실패" : "Failed to refresh topics")
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const loadRedditTrends = async () => {
    setLoadingReddit(true)
    try {
      const res = await fetch(`/api/trends/reddit-suggestions?language=${language}`)
      const data = await res.json()

      if (data.success) {
        setRedditTrends(data.data)
        console.log('✅ Reddit trends loaded:', data.data.length, 'posts')
      }
    } catch (error) {
      console.error("Failed to load Reddit trends:", error)
    } finally {
      setLoadingReddit(false)
    }
  }

  const analyzeTrends = async (searchKeyword?: string) => {
    const targetKeyword = searchKeyword || keyword

    if (!targetKeyword.trim()) {
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
          body: JSON.stringify({ keyword: targetKeyword, language }),
        }),
        fetch("/api/trends/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: targetKeyword, language }),
        }),
        fetch("/api/trends/reddit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: targetKeyword, language }),
        }),
        fetch("/api/trends/naver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: targetKeyword, language }),
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
    setSelectedTopic(topic)
    setShowContentTypeModal(true)
  }

  const handleQuickGenerate = () => {
    router.push(`/content/create?topic=${encodeURIComponent(selectedTopic)}`)
    setShowContentTypeModal(false)
  }

  const handleScenarioGenerate = () => {
    router.push(`/content/storytelling?topic=${encodeURIComponent(selectedTopic)}`)
    setShowContentTypeModal(false)
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

        {/* Persona Selection + Data Sources - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Persona Selection - Only show if 2 or more personas exist */}
          {personas.length >= 2 && (
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <div className="flex items-center gap-4">
                <Target className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    {language === "ko" ? "타겟 고객 선택" : "Select Target Customer"}
                  </label>
                  <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                    <SelectTrigger className="w-full">
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

          {/* Data Source Information */}
          <Card className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium mb-2">
                  {language === "ko" ? "트렌드 데이터 출처" : "Trend Data Sources"}
                </h3>
                <div className="text-xs text-zinc-400 space-y-1">
                  {language === "ko" ? (
                    <>
                      <p className="text-zinc-300 font-medium mb-1.5">한국 시장 트렌드 분석:</p>
                      <p>• <span className="text-green-400 font-medium">Naver DataLab</span>: 네이버 검색 트렌드 (최우선)</p>
                      <p>• <span className="text-amber-400 font-medium">Google Trends KR</span>: 급상승 검색어</p>
                      <p>• <span className="text-blue-400 font-medium">Twitter/X 한국어</span>: 실시간 소셜 트렌드</p>
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-300 font-medium mb-1.5">US/Global Market Trends:</p>
                      <p>• <span className="text-amber-400 font-medium">Google Trends US</span>: Rising keywords</p>
                      <p>• <span className="text-blue-400 font-medium">Twitter/X English</span>: Social trends</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Suggestions Loading */}
        {loadingSuggestions && (
          <Card className="p-6 bg-gradient-to-br from-amber-400/10 via-zinc-900 to-zinc-900 border-amber-400/30 mb-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-4"></div>
              <h3 className="text-white text-lg font-medium mb-2">
                {language === "ko"
                  ? "AI가 맞춤 토픽을 생성하고 있습니다..."
                  : "AI is generating personalized topics..."
                }
              </h3>
              <p className="text-zinc-400 text-sm text-center max-w-md">
                {language === "ko"
                  ? "실시간 트렌드 데이터를 분석하고 있습니다. 최대 30초 정도 소요될 수 있습니다."
                  : "Analyzing real-time trend data. This may take up to 30 seconds."
                }
              </p>
            </div>
          </Card>
        )}

        {/* AI Suggestions */}
        {!loadingSuggestions && suggestions && (
          <Card className="p-6 bg-gradient-to-br from-amber-400/10 via-zinc-900 to-zinc-900 border-amber-400/30 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
              <Button
                onClick={refreshSuggestions}
                disabled={loadingSuggestions}
                variant="outline"
                size="sm"
                className="border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                {language === "ko" ? "새 토픽" : "New Topics"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.suggestions.slice(0, 6).map((sug: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setKeyword(sug.keyword)
                    setTrendData(null)
                    analyzeTrends(sug.keyword)
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
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>
                      {language === "ko"
                        ? "AI 생성 · 실시간 트렌드 기반"
                        : "AI Generated · Real-time Trends"
                      }
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Reddit Trending Topics */}
        {!loadingSuggestions && suggestions && (
          <Card className="p-4 bg-gradient-to-br from-orange-400/10 via-zinc-900 to-zinc-900 border-orange-400/30 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-400/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">
                  {language === "ko"
                    ? "🌍 Reddit 글로벌 트렌드"
                    : "🌍 Reddit Global Trends"
                  }
                </h2>
              </div>
            </div>

            {loadingReddit ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mr-3"></div>
                <p className="text-zinc-400 text-sm">
                  {language === "ko"
                    ? "로딩 중..."
                    : "Loading..."
                  }
                </p>
              </div>
            ) : redditTrends.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {redditTrends.slice(0, 8).map((post: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setKeyword(post.title)
                      setTrendData(null)
                      analyzeTrends(post.title)
                    }}
                    className="p-2 bg-zinc-950 rounded border border-zinc-800 hover:border-orange-400/50 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="text-sm">{post.icon}</span>
                      <h3 className="text-white font-medium text-xs flex-1 line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-zinc-500 text-sm">
                {language === "ko"
                  ? "Reddit 데이터를 불러올 수 없습니다"
                  : "Unable to load Reddit data"
                }
              </div>
            )}
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
              onClick={() => analyzeTrends()}
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-white group-hover:text-amber-400 transition-colors flex-1">
                          {query.query}
                        </h3>
                        <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded border border-amber-400/30 ml-3 whitespace-nowrap">
                          {language === "ko" ? "🌐 Google Trends (한국)" : "🌐 Google Trends (US)"}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3">
                        {language === "ko"
                          ? "검색 트렌드 급상승 키워드 · Google에서 인기 검색어로 선정"
                          : "Rising search trend keyword · Selected as popular search by Google"
                        }
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-400 font-medium">{language === "ko" ? "검색량" : "Search Volume"}: {query.value}/100</span>
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                          {tweet.text.split('.')[0] || tweet.text.substring(0, 80)}
                        </h3>
                        <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded border border-blue-400/30 ml-3 whitespace-nowrap">
                          {language === "ko" ? "𝕏 Twitter (한국)" : "𝕏 Twitter (Global)"}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                        {tweet.text}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400 font-medium">{language === "ko" ? "좋아요" : "Likes"}: {tweet.likes.toLocaleString()} · {language === "ko" ? "리트윗" : "Retweets"}: {tweet.retweets.toLocaleString()}</span>
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                        <span className="text-xs bg-orange-400/20 text-orange-400 px-2 py-1 rounded border border-orange-400/30 ml-3 whitespace-nowrap">
                          {language === "ko" ? "🗨️ Reddit (한국 관련)" : "🗨️ Reddit (Global)"}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                        {post.preview || (language === "ko"
                          ? `Reddit에서 ${post.score.toLocaleString()}명이 공감한 ${post.subreddit} 커뮤니티의 인기 토론 주제`
                          : `Popular discussion topic in ${post.subreddit} community with ${post.score.toLocaleString()} upvotes on Reddit`
                        )}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-orange-400 font-medium">{language === "ko" ? "추천" : "Upvotes"}: {post.score.toLocaleString()} · {language === "ko" ? "댓글" : "Comments"}: {post.comments.toLocaleString()}</span>
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

        {/* Content Type Selection Modal */}
        <Dialog open={showContentTypeModal} onOpenChange={setShowContentTypeModal}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">
                {language === "ko" ? "콘텐츠 생성 방식 선택" : "Select Content Type"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                <span className="text-amber-400 font-medium">{language === "ko" ? "토픽" : "Topic"}:</span> {selectedTopic}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {/* Quick Generate */}
                <button
                  onClick={handleQuickGenerate}
                  className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-amber-400/50 hover:bg-zinc-800/80 transition-all text-left group/quick"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium transition-colors group-hover/quick:text-amber-400">
                        {language === "ko" ? "빠른 생성" : "Quick Generate"}
                      </h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        {language === "ko"
                          ? "SEO 키워드 최적화와 함께 즉시 콘텐츠를 생성합니다"
                          : "Generate content instantly with SEO keyword optimization"
                        }
                      </p>
                    </div>
                  </div>
                </button>

                {/* Scenario Generate */}
                <button
                  onClick={handleScenarioGenerate}
                  className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-blue-400/50 hover:bg-zinc-800/80 transition-all text-left group/scenario"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium transition-colors group-hover/scenario:text-blue-400">
                        {language === "ko" ? "시나리오 생성" : "Scenario Generate"}
                      </h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        {language === "ko"
                          ? "스토리텔링 프레임을 선택하여 구조화된 콘텐츠를 생성합니다"
                          : "Create structured content with storytelling framework"
                        }
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
