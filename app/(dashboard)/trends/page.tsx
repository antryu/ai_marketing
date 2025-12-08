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
import { TrendingUp, Search, Sparkles, Target, Zap, BookOpen, RefreshCw, Globe, Lightbulb, Settings, ChevronRight, FileText, Hash, ArrowRight, Users, Edit3, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

// 기본 타겟 프리셋 (브랜드 페르소나가 없을 때 사용)
const DEFAULT_TARGET_PRESETS = {
  office_30s: {
    ko: "30대 직장인 (커리어 성장, 워라밸 중시)",
    en: "30s Professionals (career growth, work-life balance)"
  },
  gen_mz: {
    ko: "MZ세대 (트렌드 민감, SNS 활발)",
    en: "Gen MZ (trend-sensitive, social media active)"
  },
  parents: {
    ko: "부모/가족 (육아, 가정에 관심)",
    en: "Parents/Family (parenting, family-focused)"
  },
  students: {
    ko: "대학생/취준생 (비용 민감, 성장 지향)",
    en: "Students/Job Seekers (budget-conscious, growth-oriented)"
  },
  business: {
    ko: "사업가 (효율, ROI 중시)",
    en: "Business Owners (efficiency, ROI-focused)"
  },
  senior: {
    ko: "50대 이상 (건강, 여유로운 삶 추구)",
    en: "50s+ (health, quality of life)"
  }
}

interface BrandPersona {
  id: string
  name: string
  description: string
  age_range: string
  gender: string
  job_title: string[]
  pain_points: string[]
  goals: string[]
  is_primary: boolean
}

interface TopicItem {
  keyword: string
  reason: string
  source?: string
  priority?: string
  category?: string
  type: 'ai-recommend' | 'ai-search' | 'related'
}

interface TopicDetails {
  topic: string
  titles: Array<{ title: string; angle: string }>
  hooks: string[]
  keywords: string[]
  loading: boolean
}

export default function TrendsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { selectedBrandId } = useBrand()
  const t = (key: TranslationKey) => translations[key][language]
  const supabase = createClient()

  // Step state: 'target' | 'topics'
  const [currentStep, setCurrentStep] = useState<'target' | 'topics'>('target')

  // Brand and persona state (kept for API compatibility)
  const [brandInfo, setBrandInfo] = useState<{ name: string; description: string } | null>(null)
  const [personas, setPersonas] = useState<BrandPersona[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(false)

  // Target state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [useCustomTarget, setUseCustomTarget] = useState(true)
  const [customTarget, setCustomTarget] = useState("")
  const [targetPreset, setTargetPreset] = useState<string>("office_30s")

  // Topic state
  const [suggestions, setSuggestions] = useState<any>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // AI 웹 검색 상태
  const [aiSearchQuery, setAiSearchQuery] = useState("")
  const [aiSearchLoading, setAiSearchLoading] = useState(false)
  const [aiSearchResults, setAiSearchResults] = useState<{
    searchTopic: string
    topics: Array<{ keyword: string; reason: string; source: string; priority: string }>
    relatedTopics: Array<{ keyword: string; reason: string; category: string }>
    webInsights: string
  } | null>(null)

  // 선택된 토픽 상세 정보
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null)
  const [topicDetails, setTopicDetails] = useState<TopicDetails | null>(null)

  // Load brand and personas when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      loadBrandAndPersonas()
    }
  }, [selectedBrandId])

  const loadBrandAndPersonas = async () => {
    if (!selectedBrandId) return

    setLoadingPersonas(true)
    try {
      // Load brand info
      const { data: brand } = await supabase
        .from('brands')
        .select('name, description')
        .eq('id', selectedBrandId)
        .single()

      if (brand) {
        setBrandInfo(brand)
      }

      // Load personas
      const { data: personaData } = await supabase
        .from('personas')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .order('is_primary', { ascending: false })

      if (personaData && personaData.length > 0) {
        const typedPersonas = personaData as BrandPersona[]
        setPersonas(typedPersonas)
        // 기본적으로 primary persona 또는 첫 번째 선택
        const primary = typedPersonas.find(p => p.is_primary) || typedPersonas[0]
        setSelectedPersonaId(primary.id)
        setUseCustomTarget(false)
      } else {
        setPersonas([])
        setSelectedPersonaId(null)
        setUseCustomTarget(true)
      }
    } catch (error) {
      console.error("Failed to load brand data:", error)
    } finally {
      setLoadingPersonas(false)
    }
  }

  // Get target audience description based on current selection
  const getTargetAudienceDescription = (): string => {
    if (useCustomTarget && customTarget.trim()) {
      return customTarget.trim()
    }

    if (selectedPersonaId) {
      const persona = personas.find(p => p.id === selectedPersonaId)
      if (persona) {
        const parts = []
        if (persona.name) parts.push(persona.name)
        if (persona.age_range) parts.push(`${persona.age_range}세`)
        if (persona.job_title?.length) parts.push(persona.job_title.join(', '))
        if (persona.pain_points?.length) parts.push(`고민: ${persona.pain_points.slice(0, 2).join(', ')}`)
        if (persona.goals?.length) parts.push(`목표: ${persona.goals.slice(0, 2).join(', ')}`)
        return parts.join(' | ')
      }
    }

    // Fallback to preset
    return DEFAULT_TARGET_PRESETS[targetPreset as keyof typeof DEFAULT_TARGET_PRESETS]?.[language] || ""
  }

  // Proceed to topics step
  const handleProceedToTopics = () => {
    const target = getTargetAudienceDescription()
    if (!target) {
      toast.error(language === "ko" ? "타겟을 선택하거나 직접 입력해주세요" : "Please select or enter a target audience")
      return
    }
    setCurrentStep('topics')
    loadSuggestions()
  }

  const loadSuggestions = async () => {
    if (!selectedBrandId) return

    setLoadingSuggestions(true)
    try {
      const targetAudience = getTargetAudienceDescription()
      const apiUrl = `/api/trends/suggestions?brandId=${selectedBrandId}&targetAudience=${encodeURIComponent(targetAudience)}&language=${language}`

      const res = await fetch(apiUrl)
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

  const refreshSuggestions = async () => {
    if (!selectedBrandId) return

    setLoadingSuggestions(true)
    try {
      const targetAudience = getTargetAudienceDescription()
      const apiUrl = `/api/trends/suggestions?brandId=${selectedBrandId}&targetAudience=${encodeURIComponent(targetAudience)}&language=${language}&refresh=${Date.now()}`
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

  // AI 웹 검색 실행
  const performAIWebSearch = async () => {
    if (!aiSearchQuery.trim()) {
      toast.error(language === "ko" ? "검색할 주제를 입력해주세요" : "Please enter a topic to search")
      return
    }

    setAiSearchLoading(true)
    setAiSearchResults(null)

    try {
      const targetAudience = getTargetAudienceDescription()

      const res = await fetch("/api/trends/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiSearchQuery,
          brandId: selectedBrandId,
          targetAudience,
          language
        })
      })

      const data = await res.json()

      if (data.success) {
        setAiSearchResults(data.data)
        toast.success(language === "ko" ? "AI 검색이 완료되었습니다!" : "AI search completed!")
      } else {
        toast.error(data.error || (language === "ko" ? "검색 실패" : "Search failed"))
      }
    } catch (error) {
      console.error("AI web search error:", error)
      toast.error(language === "ko" ? "AI 검색 중 오류가 발생했습니다" : "Error during AI search")
    } finally {
      setAiSearchLoading(false)
    }
  }

  // 토픽 선택 시 상세 정보 생성
  const handleTopicSelect = async (topic: TopicItem) => {
    setSelectedTopic(topic)
    setTopicDetails({
      topic: topic.keyword,
      titles: [],
      hooks: [],
      keywords: [],
      loading: true
    })

    try {
      const targetAudience = getTargetAudienceDescription()

      const res = await fetch("/api/trends/topic-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.keyword,
          reason: topic.reason,
          brandId: selectedBrandId,
          targetAudience,
          language
        })
      })

      const data = await res.json()

      if (data.success) {
        setTopicDetails({
          topic: topic.keyword,
          titles: data.data.titles || [],
          hooks: data.data.hooks || [],
          keywords: data.data.keywords || [],
          loading: false
        })
      } else {
        setTopicDetails({
          topic: topic.keyword,
          titles: [{ title: topic.keyword, angle: topic.reason }],
          hooks: [],
          keywords: [],
          loading: false
        })
      }
    } catch (error) {
      console.error("Failed to load topic details:", error)
      setTopicDetails({
        topic: topic.keyword,
        titles: [{ title: topic.keyword, angle: topic.reason }],
        hooks: [],
        keywords: [],
        loading: false
      })
    }
  }

  const handleQuickGenerate = (title?: string) => {
    const topic = title || selectedTopic?.keyword || ""
    const personaParam = selectedPersonaId ? `&personaId=${selectedPersonaId}` : ""
    router.push(`/content/create?topic=${encodeURIComponent(topic)}${personaParam}`)
  }

  const handleScenarioGenerate = (title?: string) => {
    const topic = title || selectedTopic?.keyword || ""
    const personaParam = selectedPersonaId ? `&personaId=${selectedPersonaId}` : ""
    router.push(`/content/storytelling?topic=${encodeURIComponent(topic)}${personaParam}`)
  }

  // 모든 토픽을 하나의 리스트로 통합
  const getAllTopics = (): TopicItem[] => {
    const topics: TopicItem[] = []

    // AI 추천 토픽
    if (suggestions?.suggestions) {
      suggestions.suggestions.slice(0, 6).forEach((sug: any) => {
        topics.push({
          keyword: sug.keyword,
          reason: sug.reason,
          priority: sug.priority,
          type: 'ai-recommend'
        })
      })
    }

    // AI 검색 결과
    if (aiSearchResults?.topics) {
      aiSearchResults.topics.forEach((topic) => {
        topics.push({
          keyword: topic.keyword,
          reason: topic.reason,
          source: topic.source,
          priority: topic.priority,
          type: 'ai-search'
        })
      })
    }

    // 연관 토픽
    if (aiSearchResults?.relatedTopics) {
      aiSearchResults.relatedTopics.forEach((topic) => {
        topics.push({
          keyword: topic.keyword,
          reason: topic.reason,
          category: topic.category,
          type: 'related'
        })
      })
    }

    return topics
  }

  const getTopicTypeLabel = (type: TopicItem['type']) => {
    switch (type) {
      case 'ai-recommend':
        return { label: language === "ko" ? "AI 추천" : "AI Pick", color: "amber" }
      case 'ai-search':
        return { label: language === "ko" ? "검색 결과" : "Search", color: "purple" }
      case 'related':
        return { label: language === "ko" ? "연관 토픽" : "Related", color: "blue" }
    }
  }

  // STEP 1: Target Selection View
  if (currentStep === 'target') {
    return (
      <div className="p-6 h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Header with Action Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-white">
                  {language === "ko" ? "타겟 고객 설정" : "Set Target Audience"}
                </h1>
                <p className="text-sm text-zinc-500">
                  {language === "ko" ? "토픽 제안을 받기 전에 타겟 고객을 먼저 설정하세요" : "Set your target audience before getting topic suggestions"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Step 1/2</span>
                <div className="flex gap-1">
                  <div className="w-8 h-1 bg-amber-400 rounded"></div>
                  <div className="w-8 h-1 bg-zinc-700 rounded"></div>
                </div>
              </div>
              {/* Main Action Button - Always visible */}
              <Button
                onClick={handleProceedToTopics}
                disabled={!getTargetAudienceDescription()}
                size="lg"
                className="bg-amber-400 text-black hover:bg-amber-500 font-medium"
              >
                {language === "ko" ? "토픽 추천받기" : "Get Topics"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Selected Target Info Bar */}
          {getTargetAudienceDescription() && (
            <div className="mb-6 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-zinc-300">
                  {language === "ko" ? "선택된 타겟:" : "Selected:"}
                  <span className="text-white font-medium ml-1">{getTargetAudienceDescription()}</span>
                </span>
              </div>
            </div>
          )}

          {/* Target Selection */}
          <div className="flex-1 overflow-y-auto">
            {/* Target Presets */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-medium text-white">
                  {language === "ko" ? "타겟 프리셋" : "Target Presets"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(DEFAULT_TARGET_PRESETS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTargetPreset(key)
                      setCustomTarget("")
                      setUseCustomTarget(true)
                    }}
                    className={`p-4 rounded-lg text-left transition-all ${
                      useCustomTarget && targetPreset === key && !customTarget
                        ? 'bg-amber-400/20 border-2 border-amber-400'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{value[language]}</span>
                      {useCustomTarget && targetPreset === key && !customTarget && (
                        <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-xs text-zinc-500">
                {language === "ko" ? "또는 직접 입력" : "Or enter custom"}
              </span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            {/* Custom Target Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="h-4 w-4 text-blue-400" />
                <label className="text-sm font-medium text-white">
                  {language === "ko" ? "커스텀 타겟" : "Custom Target"}
                </label>
              </div>
              <Input
                placeholder={language === "ko"
                  ? "예: 30-40대 여성, 건강에 관심 있는 직장인"
                  : "e.g., 30-40s women, health-conscious professionals"
                }
                value={customTarget}
                onChange={(e) => {
                  setCustomTarget(e.target.value)
                  setUseCustomTarget(true)
                }}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              {customTarget && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-zinc-400">
                    {language === "ko" ? "커스텀 타겟이 적용됩니다" : "Custom target will be applied"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 2: Topics View
  return (
    <div className="p-6 h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto h-full flex flex-col">

        {/* Header with Target Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentStep('target')}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              {language === "ko" ? "타겟 변경" : "Change Target"}
            </Button>
            <div className="h-4 w-px bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-zinc-300 max-w-[300px] truncate">
                {getTargetAudienceDescription()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Step 2/2</span>
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-amber-400 rounded"></div>
              <div className="w-8 h-1 bg-amber-400 rounded"></div>
            </div>
            <Link href="/settings/prompts" className="ml-4">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-amber-400">
                <Settings className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "프롬프트 설정" : "Prompt Settings"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">

          {/* Left Panel - Topic List (2/5) */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
              {/* Search Input */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    placeholder={language === "ko"
                      ? "토픽 검색 (예: AI 마케팅, 인스타 전략...)"
                      : "Search topics (e.g., AI marketing...)"
                    }
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && performAIWebSearch()}
                    className="bg-zinc-950 border-zinc-700 text-white text-sm"
                  />
                  <Button
                    onClick={performAIWebSearch}
                    disabled={aiSearchLoading}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 px-3"
                  >
                    {aiSearchLoading ? (
                      <Globe className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Topic List Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">
                    {language === "ko" ? "토픽 제안" : "Topic Suggestions"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    ({getAllTopics().length})
                  </span>
                </div>
                <Button
                  onClick={refreshSuggestions}
                  disabled={loadingSuggestions}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-zinc-400 hover:text-amber-400"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Topic List */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-3"></div>
                    <p className="text-zinc-400 text-sm">
                      {language === "ko" ? "AI가 토픽을 생성 중..." : "AI generating topics..."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {getAllTopics().map((topic, idx) => {
                      const typeInfo = getTopicTypeLabel(topic.type)
                      const isSelected = selectedTopic?.keyword === topic.keyword

                      return (
                        <button
                          key={`${topic.type}-${idx}`}
                          onClick={() => handleTopicSelect(topic)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-amber-400/20 border border-amber-400/50'
                              : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-medium text-sm line-clamp-1 ${
                              isSelected ? 'text-amber-400' : 'text-white'
                            }`}>
                              {topic.keyword}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                              typeInfo.color === 'amber' ? 'bg-amber-400/20 text-amber-400' :
                              typeInfo.color === 'purple' ? 'bg-purple-400/20 text-purple-400' :
                              'bg-blue-400/20 text-blue-400'
                            }`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-xs line-clamp-2">
                            {topic.reason}
                          </p>
                          {topic.priority === 'high' && (
                            <span className="inline-block mt-1.5 text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-medium">
                              HOT
                            </span>
                          )}
                        </button>
                      )
                    })}

                    {getAllTopics().length === 0 && !loadingSuggestions && (
                      <div className="text-center py-8">
                        <Lightbulb className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm">
                          {language === "ko"
                            ? "토픽을 검색하거나 새로고침하세요"
                            : "Search or refresh to get topics"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Search Insights (if available) */}
              {aiSearchResults?.webInsights && (
                <div className="p-3 border-t border-zinc-800 bg-purple-400/5">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {aiSearchResults.webInsights}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Topic Details (3/5) */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
              {!selectedTopic ? (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <ChevronRight className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {language === "ko" ? "토픽을 선택하세요" : "Select a Topic"}
                  </h3>
                  <p className="text-zinc-500 text-sm text-center max-w-sm">
                    {language === "ko"
                      ? "왼쪽에서 토픽을 선택하면 구체적인 콘텐츠 제목과 앵글을 제안해드립니다"
                      : "Select a topic from the left to get specific content titles and angles"
                    }
                  </p>
                </div>
              ) : (
                // Topic Details View
                <>
                  {/* Selected Topic Header */}
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-medium text-white mb-1">
                          {selectedTopic.keyword}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                          {selectedTopic.reason}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleQuickGenerate()}
                          size="sm"
                          className="bg-amber-400 text-black hover:bg-amber-500"
                        >
                          <Zap className="h-4 w-4 mr-1.5" />
                          {language === "ko" ? "빠른 생성" : "Quick"}
                        </Button>
                        <Button
                          onClick={() => handleScenarioGenerate()}
                          size="sm"
                          variant="outline"
                          className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                        >
                          <BookOpen className="h-4 w-4 mr-1.5" />
                          {language === "ko" ? "스토리" : "Story"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {topicDetails?.loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-3"></div>
                        <p className="text-zinc-400 text-sm">
                          {language === "ko" ? "제목 아이디어 생성 중..." : "Generating title ideas..."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Title Ideas */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-amber-400" />
                            <h3 className="text-sm font-medium text-white">
                              {language === "ko" ? "콘텐츠 제목 아이디어" : "Content Title Ideas"}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {topicDetails?.titles && topicDetails.titles.length > 0 ? (
                              topicDetails.titles.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-amber-400/30 transition-all group"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <h4 className="text-white font-medium text-sm mb-1">
                                        {item.title}
                                      </h4>
                                      <p className="text-zinc-500 text-xs">
                                        {item.angle}
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => handleQuickGenerate(item.title)}
                                      size="sm"
                                      variant="ghost"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                                    >
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 bg-zinc-950 rounded-lg border border-dashed border-zinc-700 text-center">
                                <p className="text-zinc-500 text-sm">
                                  {language === "ko"
                                    ? "제목 아이디어를 생성할 수 없습니다. 직접 콘텐츠를 생성해보세요."
                                    : "Unable to generate title ideas. Try creating content directly."
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hook Ideas */}
                        {topicDetails?.hooks && topicDetails.hooks.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className="h-4 w-4 text-purple-400" />
                              <h3 className="text-sm font-medium text-white">
                                {language === "ko" ? "오프닝 훅 아이디어" : "Opening Hook Ideas"}
                              </h3>
                            </div>
                            <div className="space-y-2">
                              {topicDetails.hooks.map((hook, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-purple-400/5 rounded-lg border border-purple-400/20"
                                >
                                  <p className="text-zinc-300 text-sm">"{hook}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Keywords */}
                        {topicDetails?.keywords && topicDetails.keywords.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Hash className="h-4 w-4 text-blue-400" />
                              <h3 className="text-sm font-medium text-white">
                                {language === "ko" ? "추천 키워드" : "Recommended Keywords"}
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {topicDetails.keywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-400/10 text-blue-400 text-xs rounded border border-blue-400/20"
                                >
                                  #{keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        {language === "ko"
                          ? "제목을 선택하거나 버튼을 눌러 콘텐츠를 생성하세요"
                          : "Select a title or click buttons to create content"
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleQuickGenerate()}
                          className="bg-amber-400 text-black hover:bg-amber-500"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {language === "ko" ? "콘텐츠 생성하기" : "Create Content"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
