"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Sparkles, Tag, X } from "lucide-react"
import { MirraStyleSelector } from "@/components/content/MirraStyleSelector"
import { ContentPreviewCard } from "@/components/content/ContentPreviewCard"
import { useBrand } from "@/contexts/BrandContext"
import {
  StoryFrame,
  GenerationMode,
  EmotionalTone,
  EngagementGoal,
  RefineAction,
  ContentStatus
} from "@/types/mirra-content.types"

export default function CreateMirraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedBrandId, brands, loading: loadingBrands } = useBrand()
  const [topic, setTopic] = useState("")

  // Mirra 스타일 설정
  const [mirraConfig, setMirraConfig] = useState<{
    storyFrame: StoryFrame
    generationMode: GenerationMode
    emotionalTone: EmotionalTone
    engagementGoal: EngagementGoal
    customHook?: string
  } | null>(null)

  // 생성된 콘텐츠
  const [generatedContent, setGeneratedContent] = useState("")
  const [contentId, setContentId] = useState("")
  const [contentStatus, setContentStatus] = useState<ContentStatus>("idea")
  const [loading, setLoading] = useState(false)

  // SEO 키워드 관련
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null)
  const [loadingSeo, setLoadingSeo] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [manualKeyword, setManualKeyword] = useState("")
  const [seoStep, setSeoStep] = useState(false)

  // 빠른 생성 모드 필드
  const [platform, setPlatform] = useState("naver")
  const [length, setLength] = useState("medium")
  const [tone, setTone] = useState("friendly")

  useEffect(() => {
    // Load topic from URL parameter
    const topicParam = searchParams.get('topic')
    if (topicParam) {
      setTopic(topicParam)
    }
  }, [])

  // SEO 키워드 제안 함수
  const handleSeoSuggestion = async () => {
    if (!topic.trim()) {
      toast.error("토픽을 입력하세요")
      return
    }

    if (!selectedBrandId) {
      toast.error("브랜드를 선택하세요")
      return
    }

    setLoadingSeo(true)
    try {
      const response = await fetch("/api/content/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: topic,
          topic,
          language: "ko",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "SEO 제안 실패")
      }

      setSeoSuggestions(data.data)
      setSeoStep(true)
      toast.success("SEO 키워드 분석 완료! 원하는 키워드를 선택하세요.")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "SEO 분석 실패")
    } finally {
      setLoadingSeo(false)
    }
  }

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const addManualKeyword = () => {
    const trimmed = manualKeyword.trim()
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      setSelectedKeywords(prev => [...prev, trimmed])
      setManualKeyword("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setSelectedKeywords(prev => prev.filter(k => k !== keyword))
  }

  const handleMirraGenerate = async () => {
    if (!topic.trim()) {
      toast.error("토픽을 입력하세요")
      return
    }

    if (!selectedBrandId) {
      toast.error("브랜드를 선택하세요")
      return
    }

    if (!mirraConfig) {
      toast.error("스토리텔링 설정을 완료하세요")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          brandId: selectedBrandId,
          platform,
          length,
          tone,
          language: "ko",
          seoKeywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
          ...mirraConfig
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "콘텐츠 생성 실패")
      }

      setGeneratedContent(data.generated)
      setContentId(data.content.id)
      setContentStatus("draft")
      toast.success("✨ 스토리텔링 콘텐츠 생성 완료!")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "생성 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async (action: RefineAction) => {
    if (!contentId) {
      toast.error("콘텐츠 ID가 없습니다")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/content/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          action
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "정제 실패")
      }

      setGeneratedContent(data.refined)
      setContentStatus("refined")

      const actionLabels: Record<RefineAction, string> = {
        refine: "AI 정제",
        add_hook: "훅 강화",
        shorten: "줄이기",
        expand: "늘리기",
        adjust_tone: "톤 조정"
      }

      toast.success(`✨ ${actionLabels[action]} 완료!`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "정제 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = async (newContent: string) => {
    if (!contentId) {
      toast.error("콘텐츠 ID가 없습니다")
      return
    }

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from("contents")
        .update({
          body: newContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", contentId)

      if (error) throw error

      setGeneratedContent(newContent)
      toast.success("콘텐츠가 수정되었습니다")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "수정 실패")
    }
  }

  const handleSaveAndGoToList = async () => {
    if (!contentId) {
      toast.error("저장할 콘텐츠가 없습니다")
      return
    }

    toast.success("콘텐츠가 저장되었습니다")
    router.push("/content")
  }

  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center p-12 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">브랜드가 필요합니다</h2>
          <p className="mb-8">먼저 브랜드를 등록해주세요</p>
          <Button onClick={() => router.push("/onboarding")}>
            브랜드 등록하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 설정 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10 space-y-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">스토리텔링 생성</h2>
                <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mt-6"></div>
              </div>

              {/* 토픽 입력 */}
              <div className="space-y-2">
                <Label htmlFor="topic-mirra">토픽</Label>
                <Input
                  id="topic-mirra"
                  placeholder="예: 실패했던 첫 마케팅 캠페인 이야기"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* SEO 키워드 분석 버튼 */}
              {!seoStep && !generatedContent && (
                <button
                  onClick={handleSeoSuggestion}
                  disabled={loadingSeo || !topic.trim()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSeo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      SEO 분석 중...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4" />
                      SEO 키워드 분석하기
                    </>
                  )}
                </button>
              )}

              {/* SEO 키워드 선택 UI */}
              {seoStep && !generatedContent && seoSuggestions && (
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      SEO 키워드 제안
                    </h3>
                    <button
                      onClick={() => {
                        setSeoStep(false)
                        setSeoSuggestions(null)
                        setSelectedKeywords([])
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-300"
                    >
                      다시 분석
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400">
                    원하는 키워드를 클릭하여 선택하세요. 선택한 키워드가 콘텐츠에 반영됩니다.
                  </p>

                  {/* 추천 키워드 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-zinc-300">추천 키워드</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {seoSuggestions.keywords?.map((keyword: string, idx: number) => (
                        <button
                          key={`keyword-${idx}`}
                          onClick={() => toggleKeyword(keyword)}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            selectedKeywords.includes(keyword)
                              ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-amber-500/50"
                          }`}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 해시태그 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-zinc-300">추천 해시태그</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {seoSuggestions.hashtags?.map((hashtag: string, idx: number) => (
                        <button
                          key={`hashtag-${idx}`}
                          onClick={() => toggleKeyword(hashtag)}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            selectedKeywords.includes(hashtag)
                              ? "bg-blue-500/20 border border-blue-500 text-blue-400"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-blue-500/50"
                          }`}
                        >
                          {hashtag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 연관 검색어 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-zinc-300">연관 검색어</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {seoSuggestions.relatedSearches?.map((search: string, idx: number) => (
                        <button
                          key={`search-${idx}`}
                          onClick={() => toggleKeyword(search)}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            selectedKeywords.includes(search)
                              ? "bg-green-500/20 border border-green-500 text-green-400"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-green-500/50"
                          }`}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 직접 입력 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-zinc-300">직접 입력</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="키워드 입력..."
                        value={manualKeyword}
                        onChange={(e) => setManualKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addManualKeyword()
                          }
                        }}
                        className="flex-1 text-sm h-8"
                      />
                      <Button
                        onClick={addManualKeyword}
                        size="sm"
                        className="bg-zinc-700 hover:bg-zinc-600 h-8 text-xs"
                      >
                        추가
                      </Button>
                    </div>
                  </div>

                  {/* 선택된 키워드 */}
                  {selectedKeywords.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-zinc-700">
                      <h4 className="text-xs font-medium text-amber-400">
                        선택된 키워드 ({selectedKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedKeywords.map((keyword, idx) => (
                          <div
                            key={`selected-${idx}`}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300"
                          >
                            <span>{keyword}</span>
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="hover:text-amber-100 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 플랫폼 & 길이 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-mirra">플랫폼</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform-mirra">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="naver">네이버</SelectItem>
                      <SelectItem value="tistory">티스토리</SelectItem>
                      <SelectItem value="thread">스레드</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length-mirra">길이</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger id="length-mirra">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">짧게</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="long">길게</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 톤 선택 */}
              <div className="space-y-3">
                <Label>톤 선택</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "friendly", emoji: "😊", labelKo: "친근하고 따뜻한", descKo: "편안한 대화체" },
                    { value: "professional", emoji: "💼", labelKo: "전문적이고 신뢰감", descKo: "객관적 정보" },
                    { value: "casual", emoji: "🎯", labelKo: "직설적이고 명확한", descKo: "핵심만 간결하게" },
                    { value: "trendy", emoji: "✨", labelKo: "트렌디하고 감각적", descKo: "MZ세대 어투" },
                    { value: "educational", emoji: "📚", labelKo: "교육적이고 정보중심", descKo: "단계별 설명" },
                    { value: "humorous", emoji: "😄", labelKo: "유머러스하고 재치", descKo: "가벼운 톤" },
                  ].map((toneOption) => (
                    <button
                      key={toneOption.value}
                      type="button"
                      onClick={() => setTone(toneOption.value)}
                      className={`p-3 rounded border text-left transition-all ${
                        tone === toneOption.value
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{toneOption.emoji}</span>
                        <span className="font-medium text-sm text-white">{toneOption.labelKo}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{toneOption.descKo}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mirra 스타일 선택기 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
              <MirraStyleSelector
                onSelect={(config) => {
                  setMirraConfig(config)
                  toast.success("설정 완료! 이제 생성 버튼을 눌러주세요")
                }}
                disabled={loading}
              />
            </div>

            {/* 생성 버튼 */}
            {mirraConfig && (
              <Button
                onClick={handleMirraGenerate}
                disabled={loading}
                className="w-full h-12 text-base bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium transition-all duration-300 border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    생성 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    스토리텔링으로 생성
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">미리보기</h2>
                <p className="text-zinc-400 text-xs font-normal tracking-wide mt-1">생성된 콘텐츠가 표시됩니다</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            {generatedContent ? (
              <ContentPreviewCard
                content={generatedContent}
                brandName={brands.find(b => b.id === selectedBrandId)?.name}
                brandLogo={(brands.find(b => b.id === selectedBrandId) as any)?.logo_url}
                status={contentStatus}
                onRefine={handleRefine}
                onSave={handleSaveAndGoToList}
                onContentChange={handleContentChange}
                loading={loading}
              />
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-normal">
                    스토리 프레임을 선택하고 생성하면<br />
                    구조화된 콘텐츠가 여기에 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
