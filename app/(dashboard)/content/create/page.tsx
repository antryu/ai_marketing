"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Sparkles, Send, Eye, Zap, Video, FileText } from "lucide-react"
import { VideoEditor } from "@/components/video/VideoEditor"

export default function ContentCreatePage() {
  const [brands, setBrands] = useState<any[]>([])
  const [writerPersonas, setWriterPersonas] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedWriterPersona, setSelectedWriterPersona] = useState("")
  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("thread")
  const [tone, setTone] = useState("professional")
  const [length, setLength] = useState("medium")
  const [contentType, setContentType] = useState<"text" | "video">("text")
  const [generatedContent, setGeneratedContent] = useState("")
  const [videoProject, setVideoProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [comparison, setComparison] = useState<any>(null)
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b")

  useEffect(() => {
    loadBrands()
    loadWriterPersonas()
  }, [])

  const loadBrands = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setBrands(data)
      if (data.length > 0) {
        setSelectedBrand(data[0].id)
      }
    }
    setLoadingBrands(false)
  }

  const loadWriterPersonas = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("writer_personas")
      .select("*")
      .order("is_default", { ascending: false })
      .order("usage_count", { ascending: false })

    if (data) {
      setWriterPersonas(data)
      // Auto-select default persona if exists
      const defaultPersona = data.find((p: any) => p.is_default)
      if (defaultPersona) {
        setSelectedWriterPersona(defaultPersona.id)
      }
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("토픽을 입력해주세요")
      return
    }

    if (!selectedBrand) {
      toast.error("제품을 선택해주세요")
      return
    }

    setLoading(true)
    setComparison(null)

    try {
      if (contentType === "text") {
        const endpoint = compareMode ? "/api/content/compare" : "/api/content/generate"

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            brandId: selectedBrand,
            platform,
            tone,
            length,
            writerPersonaId: selectedWriterPersona || null,
            aiModel: compareMode ? ollamaModel : (ollamaModel === "claude" ? null : ollamaModel),
            ...(compareMode && { ollamaModel })
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "콘텐츠 생성 실패")
        }

        if (compareMode) {
          setComparison(data.comparison)
          toast.success(`AI 비교 완료! (${(data.comparison.generationTime / 1000).toFixed(1)}초)`)
        } else {
          setGeneratedContent(data.generated)
          toast.success("AI 콘텐츠가 생성되었습니다!")
        }
      } else {
        // Video generation
        const response = await fetch("/api/video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            brandId: selectedBrand,
            platform,
            duration: 15,
            style: tone,
            aiModel: ollamaModel
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "비디오 생성 실패")
        }

        setVideoProject(data.project)
        toast.success("AI 비디오가 생성되었습니다!")
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    toast.success("발행 기능은 곧 추가됩니다!")
  }

  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 font-normal">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-12">
          <Zap className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-light text-white mb-4">제품이 필요합니다</h2>
          <p className="text-zinc-300 font-normal mb-8">
            콘텐츠를 생성하려면 먼저 제품을 등록해주세요
          </p>
          <a
            href="/onboarding"
            className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
          >
            제품 등록하기 →
          </a>
        </div>
      </div>
    )
  }

  // If video project exists, show video editor
  if (videoProject) {
    return (
      <VideoEditor
        project={videoProject}
        onSave={(project) => {
          setVideoProject(project)
          toast.success("프로젝트가 저장되었습니다")
        }}
        onExport={(project) => {
          toast.success("비디오 내보내기를 시작합니다")
        }}
      />
    )
  }

  return (
    <div className="p-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-light tracking-wide text-white">콘텐츠 생성</h1>
              <p className="text-zinc-300 font-normal text-base tracking-wide">AI로 최적화된 콘텐츠를 만드세요</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10 space-y-6">
            <div>
              <h2 className="text-xl font-light text-white mb-6 tracking-wide">설정</h2>
              <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>
            </div>

            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>콘텐츠 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setContentType("text")}
                  className={`
                    flex items-center justify-center gap-2 p-4 rounded border transition-all
                    ${contentType === "text"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }
                  `}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">텍스트</span>
                </button>
                <button
                  onClick={() => setContentType("video")}
                  className={`
                    flex items-center justify-center gap-2 p-4 rounded border transition-all
                    ${contentType === "video"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }
                  `}
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">비디오</span>
                </button>
              </div>
            </div>

            {/* Brand Selection */}
            <div className="space-y-2">
              <Label>제품</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
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

            {/* Writer Persona Selection */}
            {contentType === "text" && writerPersonas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>작성자 페르소나</Label>
                  <a
                    href="/settings/writer-persona"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    관리
                  </a>
                </div>
                <Select value={selectedWriterPersona} onValueChange={setSelectedWriterPersona}>
                  <SelectTrigger>
                    <SelectValue placeholder="작성자 스타일 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">기본 스타일</SelectItem>
                    {writerPersonas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.name} {persona.is_default && "⭐"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWriterPersona && writerPersonas.find(p => p.id === selectedWriterPersona) && (
                  <p className="text-xs text-zinc-500">
                    {writerPersonas.find(p => p.id === selectedWriterPersona)?.description}
                  </p>
                )}
              </div>
            )}

            {/* Topic Input */}
            <div className="space-y-2">
              <Label>토픽</Label>
              <Input
                placeholder="예: AI 마케팅 자동화의 장점"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* AI Model Selection */}
            <div className="space-y-2">
              {contentType === "text" && (
                <div className="flex items-center justify-between">
                  <Label>AI 모델 비교</Label>
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`
                      px-3 py-1 text-xs rounded border transition-all
                      ${compareMode
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }
                    `}
                  >
                    {compareMode ? "ON" : "OFF"}
                  </button>
                </div>
              )}
              {(compareMode || contentType === "video") && (
                <>
                  <Label>{contentType === "video" ? "AI 모델" : "Ollama 모델"}</Label>
                  <Select value={ollamaModel} onValueChange={setOllamaModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude">🟣 Claude (Anthropic)</SelectItem>
                      <SelectItem value="qwen2.5:7b">⭐ Qwen 2.5 7B (추천)</SelectItem>
                      <SelectItem value="phi3:3.8b">⚡ Phi3 3.8B (빠름)</SelectItem>
                      <SelectItem value="llama3.2:3b">🦙 Llama 3.2 3B (최신)</SelectItem>
                      <SelectItem value="gemma2:2b">💎 Gemma2 2B (초경량)</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thread">Thread (150-500자)</SelectItem>
                  <SelectItem value="linkedin">LinkedIn (1200-1500자)</SelectItem>
                  <SelectItem value="instagram">Instagram (캡션)</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>톤</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">전문적인</SelectItem>
                  <SelectItem value="casual">캐주얼한</SelectItem>
                  <SelectItem value="friendly">친근한</SelectItem>
                  <SelectItem value="authoritative">권위있는</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Length Selection */}
            <div className="space-y-2">
              <Label>길이</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">짧게</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="long">길게</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 text-base group"
            >
              {loading ? (
                <>생성 중...</>
              ) : (
                <>
                  {contentType === "video" ? (
                    <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  AI {contentType === "video" ? "비디오" : "콘텐츠"} 생성
                </>
              )}
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">
                  {compareMode && comparison ? "AI 비교" : "미리보기"}
                </h2>
                <p className="text-zinc-400 text-xs font-normal tracking-wide mt-1">
                  {compareMode && comparison ? "Claude vs Ollama" : "생성된 콘텐츠"}
                </p>
              </div>
              <Eye className="w-5 h-5 text-amber-400" />
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            {comparison ? (
              <div className="space-y-4">
                {/* Claude Result */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-amber-400">Claude (Haiku)</h3>
                    {comparison.claude.error && (
                      <span className="text-xs text-red-400">❌ {comparison.claude.error}</span>
                    )}
                  </div>
                  {comparison.claude.content && (
                    <Textarea
                      value={comparison.claude.content}
                      readOnly
                      rows={8}
                      className="resize-none text-sm"
                    />
                  )}
                </div>

                {/* Ollama Result */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-blue-400">Ollama ({comparison.ollama.model})</h3>
                    {comparison.ollama.error && (
                      <span className="text-xs text-red-400">❌ {comparison.ollama.error}</span>
                    )}
                  </div>
                  {comparison.ollama.content && (
                    <Textarea
                      value={comparison.ollama.content}
                      readOnly
                      rows={8}
                      className="resize-none text-sm"
                    />
                  )}
                </div>

                {/* Stats */}
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400">
                  <div className="flex justify-between items-center">
                    <span>생성 시간: {(comparison.generationTime / 1000).toFixed(2)}초</span>
                    <button
                      onClick={() => {
                        setComparison(null)
                        setCompareMode(false)
                      }}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6">
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={12}
                  className="resize-none"
                />

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    수정하기
                  </Button>
                  <Button onClick={handlePublish} className="flex-1 group">
                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                    발행하기
                  </Button>
                </div>

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded">
                  <p className="text-xs text-zinc-400 font-normal">
                    💡 Tip: 생성된 콘텐츠를 수정한 후 발행할 수 있습니다
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-700">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-normal">
                    토픽을 입력하고 AI 콘텐츠를 생성하세요
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
