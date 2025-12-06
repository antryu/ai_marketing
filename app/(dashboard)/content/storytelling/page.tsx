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
import { Sparkles } from "lucide-react"
import { MirraStyleSelector } from "@/components/content/MirraStyleSelector"
import { ContentPreviewCard } from "@/components/content/ContentPreviewCard"
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
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState("")
  const [topic, setTopic] = useState("")
  const [loadingBrands, setLoadingBrands] = useState(true)

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

  // 빠른 생성 모드 필드
  const [platform, setPlatform] = useState("naver")
  const [length, setLength] = useState("medium")
  const [tone, setTone] = useState("friendly")
  const [targetPreset, setTargetPreset] = useState("") // 타겟 프리셋
  const [customTarget, setCustomTarget] = useState("") // 직접 입력 타겟

  useEffect(() => {
    loadBrands()

    // Load topic from URL parameter
    const topicParam = searchParams.get('topic')
    if (topicParam) {
      setTopic(topicParam)
    }
  }, [])

  const loadBrands = async () => {
    const supabase = createClient()
    const result = await (supabase as any)
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false })

    const data = result.data as any[]
    if (data) {
      setBrands(data)
      if (data.length > 0) {
        setSelectedBrand(data[0].id)
      }
    }
    setLoadingBrands(false)
  }

  const handleMirraGenerate = async () => {
    if (!topic.trim()) {
      toast.error("토픽을 입력하세요")
      return
    }

    if (!selectedBrand) {
      toast.error("브랜드를 선택하세요")
      return
    }

    if (!mirraConfig) {
      toast.error("스토리텔링 설정을 완료하세요")
      return
    }

    setLoading(true)
    try {
      // 타겟 정보 구성
      const targetAudience = customTarget || (targetPreset ? {
        office_30s: "30대 직장인 (커리어 성장, 워라밸 중시)",
        gen_mz: "MZ세대 (트렌드 민감, SNS 활발)",
        parents: "부모/가족 (육아, 가정에 관심)",
        students: "대학생/취준생 (비용 민감, 성장 지향)",
        business: "사업가 (효율, ROI 중시)",
        senior: "50대 이상 (건강, 여유로운 삶 추구)",
      }[targetPreset] : null)

      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          brandId: selectedBrand,
          platform,
          length,
          tone,
          language: "ko",
          targetAudience,
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 왼쪽: 설정 */}
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10 space-y-6">
                  <div>
                    <h2 className="text-xl font-light text-white mb-6 tracking-wide">스토리텔링 생성</h2>
                    <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brand-mirra">브랜드</Label>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger id="brand-mirra">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>

                    <div>
                      <Label htmlFor="topic-mirra">토픽</Label>
                      <Input
                        id="topic-mirra"
                        placeholder="예: 실패했던 첫 마케팅 캠페인 이야기"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
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

                    <div>
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

                    {/* 타겟 고객 선택 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>타겟 고객</Label>
                        <span className="text-xs text-zinc-500">선택 사항</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "office_30s", emoji: "👩‍💼", labelKo: "30대 직장인", descKo: "커리어 성장, 워라밸" },
                          { value: "gen_mz", emoji: "✨", labelKo: "MZ세대", descKo: "트렌드 민감, SNS 활발" },
                          { value: "parents", emoji: "👨‍👩‍👧", labelKo: "부모/가족", descKo: "육아, 가정 관심" },
                          { value: "students", emoji: "🎓", labelKo: "대학생/취준생", descKo: "비용 민감, 성장 지향" },
                          { value: "business", emoji: "💼", labelKo: "사업가", descKo: "효율, ROI 중시" },
                          { value: "senior", emoji: "👴", labelKo: "50대+", descKo: "건강, 여유로운 삶" },
                        ].map((targetOption) => (
                          <button
                            key={targetOption.value}
                            type="button"
                            onClick={() => {
                              setTargetPreset(targetPreset === targetOption.value ? "" : targetOption.value)
                              if (targetPreset !== targetOption.value) setCustomTarget("")
                            }}
                            className={`p-3 rounded border text-left transition-all ${
                              targetPreset === targetOption.value
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{targetOption.emoji}</span>
                              <span className="font-medium text-sm text-white">{targetOption.labelKo}</span>
                            </div>
                            <p className="text-xs text-zinc-400">{targetOption.descKo}</p>
                          </button>
                        ))}
                      </div>

                      {/* 직접 입력 */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-zinc-700"></div>
                          <span className="text-xs text-zinc-500">또는 직접 입력</span>
                          <div className="flex-1 h-px bg-zinc-700"></div>
                        </div>
                        <Input
                          placeholder="예: 첫 창업을 준비하는 20대 후반 직장인"
                          value={customTarget}
                          onChange={(e) => {
                            setCustomTarget(e.target.value)
                            if (e.target.value) setTargetPreset("")
                          }}
                          className="text-sm"
                        />
                      </div>

                      {/* 빈 상태 힌트 */}
                      {!targetPreset && !customTarget && (
                        <p className="text-xs text-zinc-500 bg-zinc-800/30 p-2 rounded border border-zinc-700/50 mt-3">
                          💡 비워두면 브랜드 설명에서 AI가 자동으로 타겟을 추론합니다
                        </p>
                      )}
                    </div>

                    {/* 톤 선택 */}
                    <div>
                      <Label className="mb-3 block">톤 선택</Label>
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

                {mirraConfig && (
                  <Button
                    onClick={handleMirraGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium transition-all duration-300 border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50"
                    size="lg"
                  >
                    {loading ? "생성 중..." : "✨ 스토리텔링으로 생성"}
                  </Button>
                )}
              </div>

              {/* 오른쪽: 미리보기 */}
              <div>
                {generatedContent ? (
                  <ContentPreviewCard
                    content={generatedContent}
                    brandName={brands.find(b => b.id === selectedBrand)?.name}
                    brandLogo={brands.find(b => b.id === selectedBrand)?.logo_url}
                    status={contentStatus}
                    onRefine={handleRefine}
                    onSave={handleSaveAndGoToList}
                    onContentChange={handleContentChange}
                    loading={loading}
                  />
                ) : (
                  <div className="border rounded-lg p-12 text-center text-gray-500">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">스토리텔링 콘텐츠</p>
                    <p className="text-sm">
                      스토리 프레임을 선택하고 생성하면<br />
                      구조화된 콘텐츠가 여기에 표시됩니다
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
