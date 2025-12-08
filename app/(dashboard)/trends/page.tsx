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
import { TrendingUp, Sparkles, Target, RefreshCw, Globe, Lightbulb, Settings, ChevronRight, FileText, Hash, ArrowRight, Users, Edit3, CheckCircle2, BookOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

// 브랜드 타입별 추천 타겟 매핑
const BRAND_TYPE_TARGET_MAP: Record<string, { ko: string; en: string }[]> = {
  // 정부/공공 서비스
  government: [
    { ko: "스타트업 대표/창업자 (투자, 자금조달 관심)", en: "Startup Founders (funding, investment)" },
    { ko: "중소기업 대표 (R&D, 사업확장 목표)", en: "SMB CEOs (R&D, business expansion)" },
    { ko: "예비 창업자 (사업 아이디어, 초기 자금)", en: "Pre-entrepreneurs (business ideas, initial funding)" },
    { ko: "기업 연구소장/CTO (기술개발, 정부지원)", en: "R&D Directors/CTOs (tech development, gov support)" },
  ],
  // 건강/웰니스
  health: [
    { ko: "30-50대 건강 관심층 (자세교정, 통증관리)", en: "30-50s Health-conscious (posture, pain management)" },
    { ko: "직장인 (사무직 피로, 스트레스 관리)", en: "Office workers (fatigue, stress management)" },
    { ko: "운동 입문자 (체형관리, 건강습관)", en: "Exercise beginners (body management, healthy habits)" },
    { ko: "시니어 (건강유지, 활력 회복)", en: "Seniors (health maintenance, vitality)" },
  ],
  // 교육/코칭
  education: [
    { ko: "학부모 (자녀 교육, 성장 지원)", en: "Parents (child education, growth support)" },
    { ko: "직장인 (자기계발, 커리어 전환)", en: "Professionals (self-improvement, career change)" },
    { ko: "대학생/취준생 (취업준비, 스킬업)", en: "Students (job preparation, skill building)" },
    { ko: "창업 준비자 (비즈니스 스킬, 멘토링)", en: "Aspiring entrepreneurs (business skills, mentoring)" },
  ],
  // 뷰티/패션
  beauty: [
    { ko: "20-30대 여성 (트렌드, 셀프케어)", en: "20-30s Women (trends, self-care)" },
    { ko: "피부 고민층 (트러블, 안티에이징)", en: "Skin-conscious (acne, anti-aging)" },
    { ko: "직장인 (데일리 메이크업, 시간절약)", en: "Professionals (daily makeup, time-saving)" },
    { ko: "뷰티 입문자 (기초, 추천 제품)", en: "Beauty beginners (basics, product recommendations)" },
  ],
  // 음식/외식
  food: [
    { ko: "맛집 탐방족 (신상 맛집, 데이트)", en: "Foodies (new restaurants, dating spots)" },
    { ko: "혼밥족 (1인 식사, 가성비)", en: "Solo diners (single meals, value)" },
    { ko: "건강식 관심층 (다이어트, 클린푸드)", en: "Health-conscious eaters (diet, clean food)" },
    { ko: "요리 입문자 (홈쿡, 간단 레시피)", en: "Cooking beginners (home cooking, simple recipes)" },
  ],
  // IT/테크
  tech: [
    { ko: "개발자/엔지니어 (기술 트렌드, 툴)", en: "Developers/Engineers (tech trends, tools)" },
    { ko: "IT 기업 의사결정자 (솔루션, ROI)", en: "IT Decision makers (solutions, ROI)" },
    { ko: "디지털 전환 담당자 (DX, 자동화)", en: "Digital transformation leads (DX, automation)" },
    { ko: "테크 얼리어답터 (신기술, 리뷰)", en: "Tech early adopters (new tech, reviews)" },
  ],
  // 기본값
  default: [
    { ko: "타겟 고객층 A (주요 니즈 중심)", en: "Target Audience A (main needs)" },
    { ko: "타겟 고객층 B (보조 니즈 중심)", en: "Target Audience B (secondary needs)" },
    { ko: "잠재 고객층 (인지도 확산)", en: "Potential customers (awareness)" },
    { ko: "직접 입력으로 세부 타겟 설정", en: "Enter custom target details" },
  ]
}

// 브랜드 정보로부터 타입 추론
const inferBrandType = (brand: { name: string; description?: string; product_type?: string; target_market?: string[] } | null): string => {
  if (!brand) return 'default'

  const text = `${brand.name} ${brand.description || ''} ${brand.product_type || ''} ${(brand.target_market || []).join(' ')}`.toLowerCase()

  if (text.includes('정부') || text.includes('과제') || text.includes('지원사업') || text.includes('r&d') || text.includes('창업지원') || text.includes('government')) {
    return 'government'
  }
  if (text.includes('필라테스') || text.includes('헬스') || text.includes('건강') || text.includes('피트니스') || text.includes('요가') || text.includes('health') || text.includes('fitness')) {
    return 'health'
  }
  if (text.includes('교육') || text.includes('코칭') || text.includes('강의') || text.includes('academy') || text.includes('education') || text.includes('학원')) {
    return 'education'
  }
  if (text.includes('뷰티') || text.includes('화장품') || text.includes('스킨케어') || text.includes('패션') || text.includes('beauty') || text.includes('cosmetic')) {
    return 'beauty'
  }
  if (text.includes('음식') || text.includes('레스토랑') || text.includes('카페') || text.includes('맛집') || text.includes('food') || text.includes('restaurant')) {
    return 'food'
  }
  if (text.includes('it') || text.includes('테크') || text.includes('소프트웨어') || text.includes('앱') || text.includes('tech') || text.includes('software') || text.includes('saas')) {
    return 'tech'
  }

  return 'default'
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

// 세션 스토리지 키
const TRENDS_STATE_KEY = 'trends_page_state'

// 저장할 상태 인터페이스
interface SavedTrendsState {
  brandId: string
  currentStep: 'target' | 'topics'
  selectedTargetIndex: number
  customTarget: string
  suggestions: any
  aiSearchQuery: string
  aiSearchResults: any
  selectedTopic: TopicItem | null
  topicDetails: TopicDetails | null
  selectedTitleIndex: number | null
  timestamp: number
}

export default function TrendsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { selectedBrandId } = useBrand()
  const t = (key: TranslationKey) => translations[key][language]
  const supabase = createClient()

  // Step state: 'target' | 'topics'
  const [currentStep, setCurrentStep] = useState<'target' | 'topics'>('target')

  // Brand and persona state
  const [brandInfo, setBrandInfo] = useState<{ name: string; description: string; product_type?: string; target_market?: string[] } | null>(null)
  const [personas, setPersonas] = useState<BrandPersona[]>([])
  const [loadingBrand, setLoadingBrand] = useState(true)
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0)

  // Target state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [customTarget, setCustomTarget] = useState("")

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
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null)
  const [stateRestored, setStateRestored] = useState(false)
  const [showContentTypeMenu, setShowContentTypeMenu] = useState(false)

  // 세션 스토리지에서 상태 복원 (페이지 로드 시 한 번만)
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedBrandId || stateRestored) return

    try {
      const savedStateJson = sessionStorage.getItem(TRENDS_STATE_KEY)
      if (savedStateJson) {
        const savedState: SavedTrendsState = JSON.parse(savedStateJson)

        // 같은 브랜드이고 1시간 이내의 데이터인 경우에만 복원
        const oneHour = 60 * 60 * 1000
        const isValid = savedState.brandId === selectedBrandId &&
                       (Date.now() - savedState.timestamp) < oneHour

        if (isValid) {
          // 상태 복원
          setCurrentStep(savedState.currentStep)
          setSelectedTargetIndex(savedState.selectedTargetIndex)
          setCustomTarget(savedState.customTarget)
          setSuggestions(savedState.suggestions)
          setAiSearchQuery(savedState.aiSearchQuery)
          setAiSearchResults(savedState.aiSearchResults)
          setSelectedTopic(savedState.selectedTopic)
          setSelectedTitleIndex(savedState.selectedTitleIndex)

          // topicDetails는 loading 상태 제외하고 복원
          if (savedState.topicDetails) {
            setTopicDetails({
              ...savedState.topicDetails,
              loading: false
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore trends state:', error)
    }

    setStateRestored(true)
  }, [selectedBrandId, stateRestored])

  // 상태 변경 시 세션 스토리지에 저장
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedBrandId || !stateRestored) return

    // loading 상태일 때는 저장하지 않음
    if (topicDetails?.loading) return

    const stateToSave: SavedTrendsState = {
      brandId: selectedBrandId,
      currentStep,
      selectedTargetIndex,
      customTarget,
      suggestions,
      aiSearchQuery,
      aiSearchResults,
      selectedTopic,
      topicDetails,
      selectedTitleIndex,
      timestamp: Date.now()
    }

    try {
      sessionStorage.setItem(TRENDS_STATE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save trends state:', error)
    }
  }, [
    selectedBrandId,
    currentStep,
    selectedTargetIndex,
    customTarget,
    suggestions,
    aiSearchQuery,
    aiSearchResults,
    selectedTopic,
    topicDetails,
    selectedTitleIndex,
    stateRestored
  ])

  // Load brand and personas when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      loadBrandAndPersonas()
    }
  }, [selectedBrandId])

  const loadBrandAndPersonas = async () => {
    if (!selectedBrandId) return

    setLoadingBrand(true)
    try {
      // Load brand info with more fields
      const { data: brand } = await supabase
        .from('brands')
        .select('name, description, product_type, target_market')
        .eq('id', selectedBrandId)
        .single()

      if (brand) {
        setBrandInfo(brand)
        setSelectedTargetIndex(0) // Reset target selection when brand changes
      }

      // Load personas (kept for API compatibility)
      const { data: personaData } = await supabase
        .from('personas')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .order('is_primary', { ascending: false })

      if (personaData && personaData.length > 0) {
        const typedPersonas = personaData as BrandPersona[]
        setPersonas(typedPersonas)
        const primary = typedPersonas.find(p => p.is_primary) || typedPersonas[0]
        setSelectedPersonaId(primary.id)
      } else {
        setPersonas([])
        setSelectedPersonaId(null)
      }
    } catch (error) {
      console.error("Failed to load brand data:", error)
    } finally {
      setLoadingBrand(false)
    }
  }

  // Get recommended targets based on brand type
  const getRecommendedTargets = () => {
    const brandType = inferBrandType(brandInfo)
    return BRAND_TYPE_TARGET_MAP[brandType] || BRAND_TYPE_TARGET_MAP.default
  }

  // Get target audience description based on current selection
  const getTargetAudienceDescription = (): string => {
    // Custom input takes priority
    if (customTarget.trim()) {
      return customTarget.trim()
    }

    // Use brand-specific recommended target
    const targets = getRecommendedTargets()
    if (targets[selectedTargetIndex]) {
      return targets[selectedTargetIndex][language]
    }

    return ""
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
    setSelectedTitleIndex(null) // 토픽 변경 시 제목 선택 초기화
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

    // Pass hooks and keywords from topic details
    const hooksParam = topicDetails?.hooks && topicDetails.hooks.length > 0
      ? `&hooks=${encodeURIComponent(JSON.stringify(topicDetails.hooks))}`
      : ""
    const keywordsParam = topicDetails?.keywords && topicDetails.keywords.length > 0
      ? `&keywords=${encodeURIComponent(JSON.stringify(topicDetails.keywords))}`
      : ""

    router.push(`/content/create?topic=${encodeURIComponent(topic)}${personaParam}${hooksParam}${keywordsParam}`)
  }

  const handleScenarioGenerate = (title?: string) => {
    const topic = title || selectedTopic?.keyword || ""
    const personaParam = selectedPersonaId ? `&personaId=${selectedPersonaId}` : ""

    // Pass hooks and keywords from topic details
    const hooksParam = topicDetails?.hooks && topicDetails.hooks.length > 0
      ? `&hooks=${encodeURIComponent(JSON.stringify(topicDetails.hooks))}`
      : ""
    const keywordsParam = topicDetails?.keywords && topicDetails.keywords.length > 0
      ? `&keywords=${encodeURIComponent(JSON.stringify(topicDetails.keywords))}`
      : ""

    router.push(`/content/storytelling?topic=${encodeURIComponent(topic)}${personaParam}${hooksParam}${keywordsParam}`)
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
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-400/20 flex items-center justify-center">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-medium text-white">
                  {language === "ko" ? "타겟 고객 설정" : "Set Target Audience"}
                </h1>
                <p className="text-sm md:text-base text-zinc-500">
                  {language === "ko" ? "토픽 제안을 받기 전에 타겟 고객을 먼저 설정하세요" : "Set your target audience before getting topic suggestions"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-zinc-500">Step 1/2</span>
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
                className="bg-amber-400 text-black hover:bg-amber-500 font-medium text-sm md:text-base"
              >
                {language === "ko" ? "토픽 추천받기" : "Get Topics"}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loadingBrand ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-3 mx-auto"></div>
                <p className="text-zinc-400 text-sm">
                  {language === "ko" ? "브랜드 정보 로딩 중..." : "Loading brand info..."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Brand Info Banner */}
              {brandInfo && (
                <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-amber-400/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-base md:text-lg">{brandInfo.name}</h3>
                      <p className="text-sm md:text-base text-zinc-500">
                        {brandInfo.description || (language === "ko" ? "브랜드 설명 없음" : "No description")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Target Info Bar */}
              {getTargetAudienceDescription() && (
                <div className="mb-6 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                    <span className="text-sm md:text-base text-zinc-300">
                      {language === "ko" ? "선택된 타겟:" : "Selected:"}
                      <span className="text-white font-medium ml-1">{getTargetAudienceDescription()}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Target Selection */}
              <div className="flex-1 overflow-y-auto">
                {/* Brand-specific Recommended Targets */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                    <h2 className="text-sm md:text-base font-medium text-white">
                      {language === "ko" ? "추천 타겟 고객" : "Recommended Targets"}
                    </h2>
                    <span className="text-xs md:text-sm text-zinc-500">
                      ({language === "ko" ? `${brandInfo?.name || '브랜드'} 맞춤` : `for ${brandInfo?.name || 'brand'}`})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getRecommendedTargets().map((target, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedTargetIndex(idx)
                          setCustomTarget("") // Clear custom input when selecting preset
                        }}
                        className={`p-4 rounded-lg text-left transition-all ${
                          selectedTargetIndex === idx && !customTarget
                            ? 'bg-amber-400/20 border-2 border-amber-400'
                            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm md:text-base text-white">{target[language]}</span>
                          {selectedTargetIndex === idx && !customTarget && (
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
                  <span className="text-xs md:text-sm text-zinc-500">
                    {language === "ko" ? "또는 직접 입력" : "Or enter custom"}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800"></div>
                </div>

                {/* Custom Target Input */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Edit3 className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                    <label className="text-sm md:text-base font-medium text-white">
                      {language === "ko" ? "직접 입력" : "Custom Target"}
                    </label>
                  </div>
                  <Input
                    placeholder={language === "ko"
                      ? "예: 30-40대 여성, 건강에 관심 있는 직장인"
                      : "e.g., 30-40s women, health-conscious professionals"
                    }
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white text-sm md:text-base"
                  />
                  {customTarget && (
                    <div className="mt-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                      <span className="text-xs md:text-sm text-zinc-400">
                        {language === "ko" ? "직접 입력한 타겟이 적용됩니다" : "Custom target will be applied"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // STEP 2: Topics View
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header with Target Info */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentStep('target')}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white text-xs md:text-sm"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              {language === "ko" ? "타겟 변경" : "Change Target"}
            </Button>
            <div className="h-4 w-px bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
              <span className="text-sm md:text-base text-zinc-300 max-w-[300px] truncate">
                {getTargetAudienceDescription()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-zinc-500">Step 2/2</span>
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-amber-400 rounded"></div>
              <div className="w-8 h-1 bg-amber-400 rounded"></div>
            </div>
            <Link href="/settings/prompts" className="ml-4">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-amber-400 text-xs md:text-sm">
                <Settings className="h-4 w-4 mr-1.5" />
                {language === "ko" ? "프롬프트 설정" : "Prompt Settings"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* Left Panel - Topic List */}
          <div>
            <Card className="bg-zinc-900 border-zinc-800">
              {/* Topic List Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                  <span className="text-sm md:text-base font-medium text-white">
                    {language === "ko" ? "토픽 제안" : "Topic Suggestions"}
                  </span>
                  <span className="text-xs md:text-sm text-zinc-500">
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
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {loadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-3"></div>
                    <p className="text-zinc-400 text-sm">
                      {language === "ko" ? "AI가 토픽을 생성 중..." : "AI generating topics..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getAllTopics().map((topic, idx) => {
                      const typeInfo = getTopicTypeLabel(topic.type)
                      const isSelected = selectedTopic?.keyword === topic.keyword

                      return (
                        <button
                          key={`${topic.type}-${idx}`}
                          onClick={() => handleTopicSelect(topic)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-amber-400/20 border-2 border-amber-400'
                              : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Header: Title + Badge */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className={`font-medium text-sm md:text-base leading-snug ${
                              isSelected ? 'text-amber-400' : 'text-white'
                            }`}>
                              {topic.keyword}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {topic.priority === 'high' && (
                                <span className="text-[10px] md:text-xs bg-amber-400 text-black px-1.5 py-0.5 rounded font-medium">
                                  HOT
                                </span>
                              )}
                              <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded ${
                                typeInfo.color === 'amber' ? 'bg-amber-400/20 text-amber-400' :
                                typeInfo.color === 'purple' ? 'bg-purple-400/20 text-purple-400' :
                                'bg-blue-400/20 text-blue-400'
                              }`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          <p className="text-zinc-400 text-xs md:text-sm mb-1.5 line-clamp-2">
                            {topic.reason}
                          </p>

                          {/* Source/Category */}
                          {(topic.source || topic.category) && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3 md:h-4 md:w-4 text-zinc-500" />
                              <span className="text-[11px] md:text-xs text-zinc-500">
                                {topic.source || topic.category}
                              </span>
                            </div>
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

          {/* Right Panel - Topic Details */}
          <div>
            <Card className="bg-zinc-900 border-zinc-800">
              {!selectedTopic ? (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <ChevronRight className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-medium text-white mb-2">
                    {language === "ko" ? "토픽을 선택하세요" : "Select a Topic"}
                  </h3>
                  <p className="text-zinc-500 text-sm md:text-base text-center max-w-sm">
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
                        <h2 className="text-lg md:text-xl font-medium text-white mb-1">
                          {selectedTopic.keyword}
                        </h2>
                        <p className="text-zinc-400 text-sm md:text-base line-clamp-2">
                          {selectedTopic.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4">
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
                            <FileText className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                            <h3 className="text-sm md:text-base font-medium text-white">
                              {language === "ko" ? "콘텐츠 제목 아이디어" : "Content Title Ideas"}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {topicDetails?.titles && topicDetails.titles.length > 0 ? (
                              topicDetails.titles.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTitleIndex(idx)}
                                  className={`w-full p-3 rounded-lg text-left transition-all ${
                                    selectedTitleIndex === idx
                                      ? 'bg-amber-400/20 border-2 border-amber-400'
                                      : 'bg-zinc-950 border border-zinc-800 hover:border-amber-400/30'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm md:text-base mb-1 ${
                                        selectedTitleIndex === idx ? 'text-amber-400' : 'text-white'
                                      }`}>
                                        {item.title}
                                      </h4>
                                      <p className="text-zinc-500 text-xs md:text-sm">
                                        {item.angle}
                                      </p>
                                    </div>
                                    {selectedTitleIndex === idx && (
                                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-amber-400 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
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

                        {/* Hook Ideas & Keywords - Compact */}
                        {((topicDetails?.hooks && topicDetails.hooks.length > 0) ||
                          (topicDetails?.keywords && topicDetails.keywords.length > 0)) && (
                          <div className="pt-3 border-t border-zinc-800">
                            {/* Hooks - Show only first one */}
                            {topicDetails?.hooks && topicDetails.hooks.length > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-400" />
                                  <h3 className="text-xs md:text-sm font-medium text-zinc-400">
                                    {language === "ko" ? "오프닝 훅" : "Opening Hook"}
                                  </h3>
                                </div>
                                <p className="text-zinc-400 text-xs md:text-sm italic line-clamp-2">
                                  "{topicDetails.hooks[0]}"
                                </p>
                              </div>
                            )}

                            {/* Keywords */}
                            {topicDetails?.keywords && topicDetails.keywords.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Hash className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
                                  <h3 className="text-xs md:text-sm font-medium text-zinc-400">
                                    {language === "ko" ? "키워드" : "Keywords"}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {topicDetails.keywords.slice(0, 5).map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] md:text-xs rounded"
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
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        {selectedTitleIndex !== null && topicDetails?.titles?.[selectedTitleIndex] ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                            <p className="text-xs md:text-sm text-zinc-300">
                              {language === "ko" ? "선택됨:" : "Selected:"}
                              <span className="text-white font-medium ml-1 line-clamp-1 max-w-[200px] md:max-w-[300px]">
                                {topicDetails.titles[selectedTitleIndex].title}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs md:text-sm text-zinc-500">
                            {language === "ko"
                              ? "위에서 제목을 선택해주세요"
                              : "Please select a title above"
                            }
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <Button
                          onClick={() => setShowContentTypeMenu(!showContentTypeMenu)}
                          disabled={selectedTitleIndex === null}
                          className={`${
                            selectedTitleIndex !== null
                              ? 'bg-amber-400 text-black hover:bg-amber-500'
                              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {language === "ko" ? "콘텐츠 생성하기" : "Create Content"}
                          <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${showContentTypeMenu ? 'rotate-90' : ''}`} />
                        </Button>

                        {/* Content Type Selection Popup */}
                        {showContentTypeMenu && selectedTitleIndex !== null && (
                          <>
                            {/* Backdrop */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowContentTypeMenu(false)}
                            />
                            {/* Menu */}
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                              <div className="p-2">
                                <p className="text-xs text-zinc-500 px-2 py-1 mb-1">
                                  {language === "ko" ? "콘텐츠 유형 선택" : "Select Content Type"}
                                </p>
                                <button
                                  onClick={() => {
                                    const selectedTitle = topicDetails?.titles?.[selectedTitleIndex]?.title
                                    handleQuickGenerate(selectedTitle)
                                    setShowContentTypeMenu(false)
                                  }}
                                  className="w-full p-3 rounded-lg text-left hover:bg-zinc-800 transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg">
                                      <FileText className="h-4 w-4 text-zinc-300" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white">
                                        {language === "ko" ? "일반 콘텐츠" : "Standard Content"}
                                      </p>
                                      <p className="text-xs text-zinc-500">
                                        {language === "ko" ? "SNS 포스트, 블로그 글" : "SNS posts, blog articles"}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    const selectedTitle = topicDetails?.titles?.[selectedTitleIndex]?.title
                                    handleScenarioGenerate(selectedTitle)
                                    setShowContentTypeMenu(false)
                                  }}
                                  className="w-full p-3 rounded-lg text-left hover:bg-zinc-800 transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-400/20 group-hover:bg-amber-400/30 rounded-lg">
                                      <BookOpen className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white">
                                        {language === "ko" ? "스토리텔링" : "Storytelling"}
                                      </p>
                                      <p className="text-xs text-zinc-500">
                                        {language === "ko" ? "브랜드 스토리, 시나리오" : "Brand stories, scenarios"}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
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
