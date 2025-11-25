"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Sparkles, Zap, Video, FileText, Tag, X } from "lucide-react"
import { VideoEditor } from "@/components/video/VideoEditor"
import ReactMarkdown from "react-markdown"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function ContentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]
  const [brands, setBrands] = useState<any[]>([])
  const [writerPersonas, setWriterPersonas] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedWriterPersona, setSelectedWriterPersona] = useState("")
  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("all")
  const [tone, setTone] = useState("professional")
  const [length, setLength] = useState("medium")
  const [contentType, setContentType] = useState<"text" | "video">("text")
  const [generatedContent, setGeneratedContent] = useState("")
  const [videoProject, setVideoProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [comparison, setComparison] = useState<any>(null)
  const [ollamaModel, setOllamaModel] = useState("claude")
  const [usedAiModel, setUsedAiModel] = useState("")
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null)
  const [loadingSeo, setLoadingSeo] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [manualKeyword, setManualKeyword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBrands()
    loadWriterPersonas()

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

  const loadWriterPersonas = async () => {
    const supabase = createClient()
    const result = await (supabase as any)
      .from("writer_personas")
      .select("*")
      .order("is_default", { ascending: false })
      .order("usage_count", { ascending: false })

    const data = result.data as any[]
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
      toast.error(t("topicRequired"))
      return
    }

    if (!selectedBrand) {
      toast.error(t("productSelectRequired"))
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
            aiModel: ollamaModel === "claude" ? null : ollamaModel, // claude 선택 시 null, 나머지는 모델명 전달
            language, // 언어 추가
            ...(compareMode && { ollamaModel: ollamaModel === "claude" ? "qwen2.5:7b" : ollamaModel })
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t("contentGenerationFailed"))
        }

        if (compareMode) {
          setComparison(data.comparison)
          toast.success(`${t("comparisonComplete")} (${(data.comparison.generationTime / 1000).toFixed(1)}초)`)
        } else {
          setGeneratedContent(data.generated)
          // 사용된 AI 모델 표시
          const modelUsed = ollamaModel === "claude" ? "Claude (Haiku)" :
                           ollamaModel === "qwen2.5:7b" ? "Qwen 2.5 7B" :
                           ollamaModel === "gemma2:2b" ? "Gemma2 2B" : ollamaModel
          setUsedAiModel(modelUsed)
          toast.success(`${t("contentGenerated")} (${language === "ko" ? "모델" : "Model"}: ${modelUsed})`)
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
          throw new Error(data.error || t("videoGenerationFailed"))
        }

        setVideoProject(data.project)
        toast.success(t("videoGenerated"))
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("errorOccurred"))
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    toast.success(t("publishSoon"))
  }

  const generateSeoSuggestions = async () => {
    if (!generatedContent) {
      toast.error(t("noSeoSuggestions"))
      return
    }

    setLoadingSeo(true)
    try {
      const response = await fetch("/api/content/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generatedContent,
          topic,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate SEO suggestions")
      }

      setSeoSuggestions(data.data)
      toast.success(language === "ko" ? "SEO 키워드 분석 완료!" : "SEO keywords analyzed!")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("errorOccurred"))
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

  const handleSaveContent = async () => {
    if (!generatedContent || !selectedBrand) {
      toast.error(language === "ko" ? "콘텐츠와 브랜드를 선택해주세요" : "Please select content and brand")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const { data, error } = await (supabase as any)
        .from("contents")
        .insert({
          brand_id: selectedBrand,
          writer_persona_id: selectedWriterPersona || null,
          topic,
          body: generatedContent,
          content_type: "text",
          ai_model: usedAiModel || "claude",
          platform: platform,
          seo_keywords: selectedKeywords,
          status: "draft"
        })
        .select()
        .single()

      if (error) throw error

      toast.success(language === "ko" ? "콘텐츠가 저장되었습니다!" : "Content saved successfully!")

      // Reset form
      setGeneratedContent("")
      setTopic("")
      setSelectedKeywords([])
      setSeoSuggestions(null)

    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || (language === "ko" ? "저장 실패" : "Failed to save"))
    } finally {
      setSaving(false)
    }
  }

  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 font-normal">{t("loadingText")}</p>
        </div>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-12">
          <Zap className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-light text-white mb-4">{t("productRequired")}</h2>
          <p className="text-zinc-300 font-normal mb-8">
            {t("productRequiredDesc")}
          </p>
          <a
            href="/onboarding"
            className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
          >
            {t("registerProduct")}
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
          toast.success(t("projectSaved"))
        }}
        onExport={(project) => {
          toast.success(t("videoExportStarted"))
        }}
      />
    )
  }

  return (
    <div className="p-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10 space-y-6">
            <div>
              <h2 className="text-xl font-light text-white mb-6 tracking-wide">{t("configuration")}</h2>
              <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>
            </div>

            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>{t("contentType")}</Label>
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
                  <span className="font-medium">{t("text")}</span>
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
                  <span className="font-medium">{t("video")}</span>
                </button>
              </div>
            </div>

            {/* Brand Selection */}
            <div className="space-y-2">
              <Label>{t("product")}</Label>
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
                  <Label>{t("writerPersona")}</Label>
                  <a
                    href="/settings/writer-persona"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {t("manage")}
                  </a>
                </div>
                <Select value={selectedWriterPersona || "default"} onValueChange={(value) => setSelectedWriterPersona(value === "default" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("writerPersonaSelect")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t("defaultStyle")}</SelectItem>
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
              <Label>{t("topic")}</Label>
              <Input
                placeholder={t("topicPlaceholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* AI Model Selection */}
            <div className="space-y-2">
              {contentType === "text" && (
                <>
                  {/* AI 모델 비교 토글 */}
                  <div className="flex items-center justify-between">
                    <Label>{t("aiModelComparison")}</Label>
                    <div className="flex gap-1 bg-zinc-900/50 border border-zinc-700 rounded p-0.5">
                      <button
                        onClick={() => setCompareMode(false)}
                        className={`
                          px-3 py-1 text-xs rounded transition-all
                          ${!compareMode
                            ? "bg-zinc-800 border border-zinc-600 text-white"
                            : "text-zinc-400 hover:text-zinc-300"
                          }
                        `}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => setCompareMode(true)}
                        className={`
                          px-3 py-1 text-xs rounded transition-all
                          ${compareMode
                            ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                            : "text-zinc-400 hover:text-zinc-300"
                          }
                        `}
                      >
                        ON
                      </button>
                    </div>
                  </div>

                  {/* 비교 모드 OFF: 모델 선택 */}
                  {!compareMode && (
                    <>
                      <Label>{t("aiModel")}</Label>
                      <Select value={ollamaModel} onValueChange={setOllamaModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude">🟣 Claude (Haiku) - {language === "ko" ? "추천" : "Recommended"}</SelectItem>
                          <SelectItem value="qwen2.5:7b">⭐ Qwen 2.5 7B (Ollama)</SelectItem>
                          <SelectItem value="gemma2:2b">💎 Gemma2 2B ({language === "ko" ? "초경량 ⚡" : "Ultra-light ⚡"})</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {/* 비교 모드 ON: Ollama 모델 선택 */}
                  {compareMode && (
                    <>
                      <Label>{t("compareOllamaModel")}</Label>
                      <Select value={ollamaModel === "claude" ? "qwen2.5:7b" : ollamaModel} onValueChange={setOllamaModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qwen2.5:7b">⭐ Qwen 2.5 7B ({language === "ko" ? "추천" : "Recommended"})</SelectItem>
                          <SelectItem value="gemma2:2b">💎 Gemma2 2B ({language === "ko" ? "초경량 ⚡" : "Ultra-light ⚡"})</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-zinc-500">
                        {t("compareDescription")}
                      </p>
                    </>
                  )}
                </>
              )}
              {contentType === "video" && (
                <>
                  <Label>{t("aiModel")}</Label>
                  <Select value={ollamaModel} onValueChange={setOllamaModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude">🟣 Claude (Anthropic)</SelectItem>
                      <SelectItem value="qwen2.5:7b">⭐ Qwen 2.5 7B</SelectItem>
                      <SelectItem value="gemma2:2b">💎 Gemma2 2B</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>{t("platform")}</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("platformAll")}</SelectItem>
                  <SelectItem value="thread">{t("platformThread")}</SelectItem>
                  <SelectItem value="linkedin">{t("platformLinkedIn")}</SelectItem>
                  <SelectItem value="instagram">{t("platformInstagram")}</SelectItem>
                  <SelectItem value="twitter">{t("platformTwitter")}</SelectItem>
                  <SelectItem value="naver">{t("platformNaver")}</SelectItem>
                  <SelectItem value="tistory">{t("platformTistory")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>{t("toneField")}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{t("toneProfessional")}</SelectItem>
                  <SelectItem value="casual">{t("toneCasual")}</SelectItem>
                  <SelectItem value="friendly">{t("toneFriendly")}</SelectItem>
                  <SelectItem value="authoritative">{t("toneAuthoritative")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Length Selection */}
            <div className="space-y-2">
              <Label>{t("length")}</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">{t("lengthShort")}</SelectItem>
                  <SelectItem value="medium">{t("lengthMedium")}</SelectItem>
                  <SelectItem value="long">{t("lengthLong")}</SelectItem>
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
                <>{t("generating")}</>
              ) : (
                <>
                  {contentType === "video" ? (
                    <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {contentType === "video" ? t("generateVideo") : t("generateContent")}
                </>
              )}
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">
                  {compareMode && comparison ? t("aiComparison") : t("preview")}
                </h2>
                <p className="text-zinc-400 text-xs font-normal tracking-wide mt-1">
                  {compareMode && comparison ? "Claude vs Ollama" : t("generatedContentPreview")}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
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
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>{t("generationTime")} {(comparison.generationTime / 1000).toFixed(2)}{language === "ko" ? "초" : "s"}</span>
                    <button
                      onClick={() => {
                        setComparison(null)
                        setCompareMode(false)
                      }}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      {t("closeComparison")}
                    </button>
                  </div>
                  <div className="pt-3 border-t border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-3">
                      {t("comparisonTip")}
                    </p>
                    <Button
                      onClick={() => router.push('/content')}
                      className="w-full bg-amber-500/20 border border-amber-500 text-amber-400 hover:bg-amber-500/30"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {t("goToContentList")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 overflow-hidden">
                  <div className="text-white prose prose-invert prose-sm max-w-none break-words overflow-wrap-anywhere">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                </div>

                {/* SEO Optimization Section */}
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-400" />
                      {t("seoOptimization")}
                    </h3>
                    <Button
                      onClick={generateSeoSuggestions}
                      disabled={loadingSeo}
                      size="sm"
                      className="bg-amber-500/20 border border-amber-500 text-amber-400 hover:bg-amber-500/30"
                    >
                      {loadingSeo ? t("loadingSeoSuggestions") : t("generateSeoSuggestions")}
                    </Button>
                  </div>

                  <p className="text-sm text-zinc-400">
                    {t("seoSuggestionsDesc")}
                  </p>

                  {seoSuggestions && (
                    <div className="space-y-4">
                      {/* Suggested Keywords */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-zinc-300">
                          {t("suggestedKeywords")} <span className="text-xs text-zinc-500">{t("clickToSelect")}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {seoSuggestions.keywords?.map((keyword: string, idx: number) => (
                            <button
                              key={`keyword-${idx}`}
                              onClick={() => toggleKeyword(keyword)}
                              className={`
                                px-3 py-1.5 rounded text-sm transition-all
                                ${selectedKeywords.includes(keyword)
                                  ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-amber-500/50"
                                }
                              `}
                            >
                              {keyword}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Hashtags */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-zinc-300">
                          {t("suggestedHashtags")} <span className="text-xs text-zinc-500">{t("clickToSelect")}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {seoSuggestions.hashtags?.map((hashtag: string, idx: number) => (
                            <button
                              key={`hashtag-${idx}`}
                              onClick={() => toggleKeyword(hashtag)}
                              className={`
                                px-3 py-1.5 rounded text-sm transition-all
                                ${selectedKeywords.includes(hashtag)
                                  ? "bg-blue-500/20 border border-blue-500 text-blue-400"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-blue-500/50"
                                }
                              `}
                            >
                              {hashtag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Related Searches */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-zinc-300">
                          {t("relatedSearches")} <span className="text-xs text-zinc-500">{t("clickToSelect")}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {seoSuggestions.relatedSearches?.map((search: string, idx: number) => (
                            <button
                              key={`search-${idx}`}
                              onClick={() => toggleKeyword(search)}
                              className={`
                                px-3 py-1.5 rounded text-sm transition-all
                                ${selectedKeywords.includes(search)
                                  ? "bg-green-500/20 border border-green-500 text-green-400"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-green-500/50"
                                }
                              `}
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Add */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300">{t("manualAdd")}</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === "ko" ? "키워드 입력..." : "Enter keyword..."}
                        value={manualKeyword}
                        onChange={(e) => setManualKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addManualKeyword()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={addManualKeyword}
                        size="sm"
                        className="bg-zinc-700 hover:bg-zinc-600"
                      >
                        {t("addKeyword")}
                      </Button>
                    </div>
                  </div>

                  {/* Selected Keywords Display */}
                  {selectedKeywords.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-zinc-700">
                      <h4 className="text-sm font-medium text-amber-400">
                        {t("selectedKeywords")} ({selectedKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedKeywords.map((keyword, idx) => (
                          <div
                            key={`selected-${idx}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-sm text-amber-300"
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

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400 font-normal">
                      {t("markdownTip")}
                    </p>
                    {usedAiModel && (
                      <p className="text-xs text-amber-400 font-medium">
                        🤖 {usedAiModel}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleSaveContent}
                      disabled={saving || !generatedContent}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {language === "ko" ? "저장 중..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          {language === "ko" ? "저장" : "Save"}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push('/content')}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {language === "ko" ? "목록" : "List"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-700">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-normal">
                    {t("enterTopicPrompt")}
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
