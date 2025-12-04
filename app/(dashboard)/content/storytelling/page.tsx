"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

  useEffect(() => {
    loadBrands()
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
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          brandId: selectedBrand,
          platform,
          length,
          language: "ko",
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
