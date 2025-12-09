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
import { Sparkles, Zap, Video, FileText, Tag, X, Image as ImageIcon, Download, Wand2, Maximize2, Minimize2, MessageSquare, RefreshCw, Lightbulb, ChevronDown, ChevronUp, Copy, Check, Edit3 } from "lucide-react"
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
  const [contentType, setContentType] = useState<"text" | "image" | "video">("text")
  const [generatedContent, setGeneratedContent] = useState("")
  const [videoProject, setVideoProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [usedAiModel, setUsedAiModel] = useState("")
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null)
  const [loadingSeo, setLoadingSeo] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [manualKeyword, setManualKeyword] = useState("")
  const [saving, setSaving] = useState(false)
  const [seoStep, setSeoStep] = useState(false) // SEO 단계 활성화 여부
  const [contentId, setContentId] = useState<string | null>(null) // 생성된 콘텐츠 ID (수정용)
  const [refining, setRefining] = useState(false) // 콘텐츠 수정 중
  const [isEditing, setIsEditing] = useState(false) // 직접 수정 모드
  const [editedContent, setEditedContent] = useState("") // 수정 중인 콘텐츠

  // Image generation states
  const [imagePrompt, setImagePrompt] = useState("")
  const [imageStyle, setImageStyle] = useState<"realistic" | "illustration" | "minimal" | "vibrant">("realistic")
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [generatingImage, setGeneratingImage] = useState(false)

  // Suggestions from trends page
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([])
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [copiedHook, setCopiedHook] = useState<number | null>(null)

  useEffect(() => {
    loadBrands()

    // Load topic from URL parameter
    const topicParam = searchParams.get('topic')
    if (topicParam) {
      setTopic(topicParam)
    }

    // Load hooks from URL parameter (passed from trends page)
    const hooksParam = searchParams.get('hooks')
    if (hooksParam) {
      try {
        const parsedHooks = JSON.parse(hooksParam)
        if (Array.isArray(parsedHooks)) {
          setSuggestedHooks(parsedHooks)
        }
      } catch (e) {
        console.error('Failed to parse hooks:', e)
      }
    }

    // Load keywords from URL parameter (passed from trends page)
    // Keywords will be shown as suggestions in SEO step, not auto-selected
    const keywordsParam = searchParams.get('keywords')
    if (keywordsParam) {
      try {
        const parsedKeywords = JSON.parse(keywordsParam)
        if (Array.isArray(parsedKeywords)) {
          setSuggestedKeywords(parsedKeywords)
        }
      } catch (e) {
        console.error('Failed to parse keywords:', e)
      }
    }
  }, [])

  // Load writer personas when selected brand changes
  useEffect(() => {
    if (selectedBrand) {
      loadWriterPersonas()
    }
  }, [selectedBrand])

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
    if (!selectedBrand) return

    const supabase = createClient()
    const result = await (supabase as any)
      .from("writer_personas")
      .select("*")
      .eq("brand_id", selectedBrand)
      .order("is_default", { ascending: false })
      .order("usage_count", { ascending: false })

    const data = result.data as any[]
    if (data) {
      setWriterPersonas(data)
      // Auto-select default persona if exists
      const defaultPersona = data.find((p: any) => p.is_default)
      if (defaultPersona) {
        setSelectedWriterPersona(defaultPersona.id)
      } else {
        // Reset selection if no default
        setSelectedWriterPersona("")
      }
    } else {
      setWriterPersonas([])
      setSelectedWriterPersona("")
    }
  }

  // SEO 키워드 제안 먼저 실행
  const handleSeoSuggestion = async () => {
    if (!topic.trim()) {
      toast.error(t("topicRequired"))
      return
    }

    if (!selectedBrand) {
      toast.error(t("productSelectRequired"))
      return
    }

    setLoadingSeo(true)
    try {
      const response = await fetch("/api/content/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: topic, // 토픽 기반으로 SEO 제안
          topic,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate SEO suggestions")
      }

      setSeoSuggestions(data.data)
      setSeoStep(true) // SEO 선택 단계로 이동
      toast.success(language === "ko" ? "SEO 키워드 분석 완료! 원하는 키워드를 선택하세요." : "SEO keywords analyzed! Select keywords you want.")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("errorOccurred"))
    } finally {
      setLoadingSeo(false)
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

    try {
      if (contentType === "text") {
        // "all" 플랫폼인 경우 네이버 블로그 기준으로 생성
        const targetPlatform = platform === "all" ? "naver" : platform

        const response = await fetch("/api/content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            brandId: selectedBrand,
            platform: targetPlatform,
            tone,
            length,
            writerPersonaId: selectedWriterPersona || null,
            language,
            seoKeywords: selectedKeywords.length > 0 ? selectedKeywords : null,
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t("contentGenerationFailed"))
        }

        setGeneratedContent(data.generated)
        // 생성된 콘텐츠 ID 저장 (수정 기능용)
        if (data.content?.id) {
          setContentId(data.content.id)
        }
        setUsedAiModel("Claude")
        toast.success(t("contentGenerated"))
      } else {
        // Video generation
        // "all" 플랫폼인 경우 네이버 블로그 기준으로 생성
        const targetPlatform = platform === "all" ? "naver" : platform

        const response = await fetch("/api/video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            brandId: selectedBrand,
            platform: targetPlatform,
            duration: 15,
            style: tone,
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

  // Image generation handler
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error(language === "ko" ? "이미지 설명을 입력해주세요" : "Please enter image description")
      return
    }

    if (!selectedBrand) {
      toast.error(t("productSelectRequired"))
      return
    }

    setGeneratingImage(true)
    setGeneratedImageUrl("")

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          brandId: selectedBrand,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          language,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (language === "ko" ? "이미지 생성 실패" : "Image generation failed"))
      }

      setGeneratedImageUrl(data.imageUrl)
      if (data.content?.id) {
        setContentId(data.content.id)
      }
      toast.success(language === "ko" ? "이미지가 생성되었습니다!" : "Image generated!")

    } catch (error: any) {
      console.error("Image generation error:", error)
      toast.error(error.message || (language === "ko" ? "이미지 생성 실패" : "Image generation failed"))
    } finally {
      setGeneratingImage(false)
    }
  }

  // Download generated image
  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return

    try {
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${imagePrompt.slice(0, 30) || 'image'}-${Date.now()}.webp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(language === "ko" ? "이미지 다운로드 완료" : "Image downloaded")
    } catch (error) {
      toast.error(language === "ko" ? "다운로드 실패" : "Download failed")
    }
  }

  // 콘텐츠 수정 함수
  const handleRefineContent = async (action: string, customInstruction?: string) => {
    if (!contentId) {
      toast.error(language === "ko" ? "수정할 콘텐츠가 없습니다" : "No content to refine")
      return
    }

    setRefining(true)
    try {
      const response = await fetch("/api/content/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          action,
          customInstruction
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (language === "ko" ? "수정 실패" : "Refinement failed"))
      }

      setGeneratedContent(data.refined)

      const actionLabels: Record<string, { ko: string; en: string }> = {
        refine: { ko: "다듬기", en: "Refine" },
        add_hook: { ko: "훅 강화", en: "Add Hook" },
        shorten: { ko: "짧게", en: "Shorten" },
        expand: { ko: "늘리기", en: "Expand" },
        adjust_tone: { ko: "톤 조정", en: "Adjust Tone" }
      }

      toast.success(language === "ko"
        ? `${actionLabels[action]?.ko || action} 완료!`
        : `${actionLabels[action]?.en || action} complete!`
      )
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setRefining(false)
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

  // Copy hook to clipboard
  const copyHook = async (hook: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hook)
      setCopiedHook(index)
      toast.success(language === "ko" ? "훅이 복사되었습니다" : "Hook copied")
      setTimeout(() => setCopiedHook(null), 2000)
    } catch (e) {
      toast.error(language === "ko" ? "복사 실패" : "Copy failed")
    }
  }

  const handleDownloadContent = () => {
    if (!generatedContent && !videoProject) {
      toast.error(language === "ko" ? "다운로드할 콘텐츠가 없습니다" : "No content to download")
      return
    }

    try {
      if (contentType === "text") {
        // Download as markdown file
        const blob = new Blob([generatedContent], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${topic || 'content'}-${Date.now()}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(language === "ko" ? "텍스트 파일 다운로드 완료" : "Text file downloaded")
      } else if (contentType === "image") {
        // Future: Download generated image
        toast.info(language === "ko" ? "이미지 다운로드 기능 준비중" : "Image download coming soon")
      } else if (contentType === "video") {
        // Future: Download generated video
        toast.info(language === "ko" ? "비디오 다운로드 기능 준비중" : "Video download coming soon")
      }
    } catch (error) {
      toast.error(language === "ko" ? "다운로드 실패" : "Download failed")
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !selectedBrand) {
      toast.error(language === "ko" ? "콘텐츠와 브랜드를 선택해주세요" : "Please select content and brand")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // "all" 플랫폼인 경우 네이버 블로그로 저장
      const savePlatform = platform === "all" ? "naver" : platform

      const { data, error} = await (supabase as any)
        .from("contents")
        .insert({
          brand_id: selectedBrand,
          writer_persona_id: selectedWriterPersona || null,
          topic,
          body: generatedContent,
          content_type: "text",
          ai_model: usedAiModel || "claude",
          seo_keywords: selectedKeywords,
          platform_variations: {
            [savePlatform]: {
              text: generatedContent
            }
          },
          status: "draft"
        })
        .select()
        .single()

      if (error) throw error

      // Show success message with action button
      toast.success(
        language === "ko" ? "콘텐츠가 저장되었습니다!" : "Content saved successfully!",
        {
          description: language === "ko" ? "콘텐츠 목록에서 확인하세요" : "Check it in your content list",
          action: {
            label: language === "ko" ? "목록 보기" : "View List",
            onClick: () => router.push("/content")
          },
          duration: 5000
        }
      )

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
    <div className="min-h-screen">
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setContentType("text")}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded border transition-all
                    ${contentType === "text"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }
                  `}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium text-sm">{t("text")}</span>
                </button>
                <button
                  onClick={() => setContentType("image")}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded border transition-all
                    ${contentType === "image"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }
                  `}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium text-sm">{language === "ko" ? "이미지" : "Image"}</span>
                </button>
                <button
                  onClick={() => setContentType("video")}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded border transition-all
                    ${contentType === "video"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }
                  `}
                  disabled
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium text-sm">{t("video")}</span>
                  <span className="absolute top-1 right-1 text-[10px] bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
                    {language === "ko" ? "준비중" : "Soon"}
                  </span>
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

            {/* Image Generation Options - Only show when image type is selected */}
            {contentType === "image" && (
              <>
                {/* Image Prompt */}
                <div className="space-y-2">
                  <Label>{language === "ko" ? "이미지 설명" : "Image Description"}</Label>
                  <Textarea
                    placeholder={language === "ko" ? "생성하고 싶은 이미지를 자세히 설명해주세요...\n예: 커피숍에서 노트북으로 일하는 젊은 직장인의 모습" : "Describe the image you want to create...\nExample: A young professional working on a laptop in a coffee shop"}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Image Style Selection */}
                <div className="space-y-2">
                  <Label>{language === "ko" ? "이미지 스타일" : "Image Style"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "realistic", emoji: "📷", labelKo: "사실적", labelEn: "Realistic", descKo: "실제 사진같은 스타일", descEn: "Photo-realistic style" },
                      { value: "illustration", emoji: "🎨", labelKo: "일러스트", labelEn: "Illustration", descKo: "디지털 아트 스타일", descEn: "Digital art style" },
                      { value: "minimal", emoji: "⬜", labelKo: "미니멀", labelEn: "Minimal", descKo: "깔끔하고 심플한", descEn: "Clean and simple" },
                      { value: "vibrant", emoji: "🌈", labelKo: "생동감", labelEn: "Vibrant", descKo: "선명한 색상과 다이나믹", descEn: "Bold colors and dynamic" },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setImageStyle(style.value as any)}
                        className={`
                          p-3 rounded border transition-all text-left
                          ${imageStyle === style.value
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{style.emoji}</span>
                          <span className={`text-sm font-medium ${imageStyle === style.value ? "text-amber-400" : "text-zinc-300"}`}>
                            {language === "ko" ? style.labelKo : style.labelEn}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 ml-7">
                          {language === "ko" ? style.descKo : style.descEn}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selection */}
                <div className="space-y-2">
                  <Label>{language === "ko" ? "이미지 비율" : "Aspect Ratio"}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "1:1", labelKo: "정사각형", labelEn: "Square", icon: "⬜" },
                      { value: "16:9", labelKo: "가로형", labelEn: "Landscape", icon: "🖼️" },
                      { value: "9:16", labelKo: "세로형", labelEn: "Portrait", icon: "📱" },
                      { value: "4:3", labelKo: "표준", labelEn: "Standard", icon: "🖥️" },
                    ].map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setImageAspectRatio(ratio.value as any)}
                        className={`
                          p-3 rounded border transition-all text-center
                          ${imageAspectRatio === ratio.value
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }
                        `}
                      >
                        <span className="text-lg block mb-1">{ratio.icon}</span>
                        <span className="text-xs font-medium">
                          {language === "ko" ? ratio.labelKo : ratio.labelEn}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">{ratio.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Image Button */}
                <Button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !imagePrompt.trim()}
                  className="w-full h-12 text-base group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                >
                  {generatingImage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {language === "ko" ? "이미지 생성 중..." : "Generating image..."}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      {language === "ko" ? "이미지 생성" : "Generate Image"}
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400">
                  <p className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {language === "ko"
                      ? "FLUX.1 schnell 모델을 사용하여 고품질 이미지를 빠르게 생성합니다."
                      : "Uses FLUX.1 schnell model for fast, high-quality image generation."
                    }
                  </p>
                </div>
              </>
            )}

            {/* Brand Voice Selection */}
            {contentType === "text" && writerPersonas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{language === "ko" ? "브랜드 보이스" : "Brand Voice"}</Label>
                  <a
                    href="/writer-personas"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {t("manage")}
                  </a>
                </div>
                <Select value={selectedWriterPersona || "default"} onValueChange={(value) => setSelectedWriterPersona(value === "default" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ko" ? "브랜드 보이스 선택" : "Select Brand Voice"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      {language === "ko" ? "기본 스타일 (브랜드 보이스 미적용)" : "Default Style (No Brand Voice)"}
                    </SelectItem>
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

            {/* Opening Hooks from Trends Page */}
            {suggestedHooks.length > 0 && (
              <div className="space-y-3">
                {/* Collapsible Header */}
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/30 rounded-lg hover:from-purple-500/15 hover:to-amber-500/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">
                      {language === "ko" ? "오프닝 훅 제안" : "Suggested Opening Hooks"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ({suggestedHooks.length})
                    </span>
                  </div>
                  {showSuggestions ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </button>

                {/* Collapsible Content */}
                {showSuggestions && (
                  <div className="space-y-2 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    {suggestedHooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2.5 bg-zinc-900/50 rounded-lg group hover:bg-zinc-900 transition-colors"
                      >
                        <p className="text-zinc-300 text-sm italic flex-1">
                          "{hook}"
                        </p>
                        <button
                          onClick={() => copyHook(hook, idx)}
                          className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded transition-colors flex-shrink-0"
                          title={language === "ko" ? "복사" : "Copy"}
                        >
                          {copiedHook === idx ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                    <p className="text-[11px] text-zinc-500 mt-2">
                      {language === "ko"
                        ? "💡 콘텐츠 시작 부분에 사용하면 독자의 관심을 끌 수 있어요"
                        : "💡 Use these at the beginning to grab reader attention"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

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

            {/* Tone Selection - Visual Preset Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("toneField")}</Label>
                <span className="text-xs text-zinc-500">
                  {language === "ko" ? "콘텐츠 분위기를 결정합니다" : "Sets the content mood"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "friendly", emoji: "😊", labelKo: "친근하고 따뜻한", labelEn: "Friendly & Warm", descKo: "편안한 대화체, 이모티콘 활용", descEn: "Conversational, uses emojis" },
                  { value: "professional", emoji: "💼", labelKo: "전문적이고 신뢰감", labelEn: "Professional", descKo: "객관적 정보, 전문 용어 사용", descEn: "Objective, uses industry terms" },
                  { value: "casual", emoji: "🎯", labelKo: "직설적이고 명확한", labelEn: "Direct & Clear", descKo: "핵심만 간결하게, 실용적", descEn: "Concise, practical" },
                  { value: "trendy", emoji: "✨", labelKo: "트렌디하고 감각적", labelEn: "Trendy & Stylish", descKo: "최신 트렌드, MZ세대 어투", descEn: "Modern trends, Gen-Z style" },
                  { value: "educational", emoji: "📚", labelKo: "교육적이고 정보중심", labelEn: "Educational", descKo: "단계별 설명, 쉬운 이해", descEn: "Step-by-step, easy to understand" },
                  { value: "humorous", emoji: "😄", labelKo: "유머러스하고 재치", labelEn: "Humorous", descKo: "재치있는 표현, 가벼운 톤", descEn: "Witty expressions, light tone" },
                ].map((toneOption) => (
                  <button
                    key={toneOption.value}
                    onClick={() => setTone(toneOption.value)}
                    className={`
                      p-3 rounded border transition-all text-left
                      ${tone === toneOption.value
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{toneOption.emoji}</span>
                      <span className={`text-sm font-medium ${tone === toneOption.value ? "text-amber-400" : "text-zinc-300"}`}>
                        {language === "ko" ? toneOption.labelKo : toneOption.labelEn}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 ml-7">
                      {language === "ko" ? toneOption.descKo : toneOption.descEn}
                    </p>
                  </button>
                ))}
              </div>
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

            {/* Generate Buttons */}
            {contentType === "text" && !seoStep ? (
              <Button
                onClick={handleSeoSuggestion}
                disabled={loadingSeo}
                className="w-full h-12 text-base group bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 border border-zinc-600"
              >
                {loadingSeo ? (
                  <>{language === "ko" ? "SEO 분석 중..." : "Analyzing SEO..."}</>
                ) : (
                  <>
                    <Tag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    {language === "ko" ? "1단계: SEO 키워드 제안" : "Step 1: SEO Keywords"}
                  </>
                )}
              </Button>
            ) : contentType === "text" && seoStep && !generatedContent ? (
              // SEO 단계에서는 왼쪽에 "1단계로 돌아가기" 버튼만 표시 (2단계 버튼은 오른쪽 패널에)
              <Button
                onClick={() => {
                  setSeoStep(false)
                  setSeoSuggestions(null)
                  setSelectedKeywords([])
                }}
                variant="outline"
                className="w-full h-12 text-base group border-zinc-600 hover:border-zinc-500"
              >
                <Tag className="w-5 h-5 mr-2" />
                {language === "ko" ? "← 1단계로 돌아가기" : "← Back to Step 1"}
              </Button>
            ) : contentType === "text" && generatedContent ? (
              // 콘텐츠 생성 후에는 "새로 시작" 버튼
              <Button
                onClick={() => {
                  setSeoStep(false)
                  setSeoSuggestions(null)
                  setSelectedKeywords([])
                  setGeneratedContent("")
                  setContentId(null)
                }}
                variant="outline"
                className="w-full h-12 text-base group border-zinc-600 hover:border-zinc-500"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                {language === "ko" ? "새로 시작하기" : "Start Over"}
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-12 text-base group"
              >
                {loading ? (
                  <>{t("generating")}</>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    {t("generateVideo")}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right: Preview */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">
                  {seoStep && !generatedContent ? (language === "ko" ? "SEO 키워드 선택" : "Select SEO Keywords") : t("preview")}
                </h2>
                <p className="text-zinc-400 text-xs font-normal tracking-wide mt-1">
                  {seoStep && !generatedContent ? (language === "ko" ? "원하는 키워드를 선택하고 콘텐츠를 생성하세요" : "Select keywords and generate content") : t("generatedContentPreview")}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            {contentType === "image" ? (
              /* Image Preview Section */
              generatedImageUrl ? (
                <div className="space-y-6">
                  {/* Generated Image Display */}
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-900/50">
                      <span className="text-xs text-zinc-400">
                        {language === "ko" ? "생성된 이미지" : "Generated Image"}
                      </span>
                      <span className="text-xs text-amber-400">
                        {imageAspectRatio}
                      </span>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-zinc-900/30">
                      <img
                        src={generatedImageUrl}
                        alt="Generated marketing image"
                        className="max-w-full max-h-[400px] object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Image Actions */}
                  <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>{imagePrompt.length > 50 ? imagePrompt.slice(0, 50) + "..." : imagePrompt}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleDownloadImage}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {language === "ko" ? "다운로드" : "Download"}
                      </Button>
                      <Button
                        onClick={() => {
                          setGeneratedImageUrl("")
                          setImagePrompt("")
                        }}
                        variant="outline"
                        className="w-full border-zinc-600 hover:border-zinc-500"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {language === "ko" ? "새로 생성" : "Generate New"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : generatingImage ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-amber-500/30 rounded-lg bg-amber-500/5">
                  <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-amber-400 font-medium">
                    {language === "ko" ? "이미지 생성 중..." : "Generating image..."}
                  </p>
                  <p className="text-zinc-500 text-sm mt-2">
                    {language === "ko" ? "약 10-20초 정도 소요됩니다" : "This takes about 10-20 seconds"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 font-normal whitespace-pre-line">
                      {language === "ko" ? "이미지 설명을 입력하고\n생성 버튼을 클릭하세요" : "Enter image description\nand click generate"}
                    </p>
                  </div>
                </div>
              )
            ) : seoStep && !generatedContent && seoSuggestions ? (
              <div className="space-y-6">
                {/* SEO Selection UI */}
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-400" />
                      {language === "ko" ? "SEO 키워드 제안" : "SEO Keywords Suggestions"}
                    </h3>
                  </div>

                  <p className="text-sm text-zinc-400">
                    {language === "ko" ? "토픽에 맞는 SEO 키워드를 선택하세요. 선택한 키워드가 콘텐츠에 자동으로 반영됩니다." : "Select SEO keywords for your topic. Selected keywords will be automatically reflected in the content."}
                  </p>

                  {/* Keywords from Trends (if available) */}
                  {suggestedKeywords.length > 0 && (
                    <div className="space-y-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        {language === "ko" ? "트렌드에서 추천된 키워드" : "Keywords from Trends"}
                        <span className="text-xs text-zinc-500">{language === "ko" ? "클릭하여 선택" : "Click to select"}</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedKeywords.map((keyword: string, idx: number) => (
                          <button
                            key={`trend-keyword-${idx}`}
                            onClick={() => toggleKeyword(keyword)}
                            className={`
                              px-3 py-1.5 rounded text-sm transition-all
                              ${selectedKeywords.includes(keyword)
                                ? "bg-purple-500/20 border border-purple-500 text-purple-400"
                                : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-purple-500/50"
                              }
                            `}
                          >
                            #{keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {/* Continue Button */}
                  <div className="pt-4 border-t border-zinc-700 space-y-3">
                    <p className="text-xs text-zinc-400">
                      {language === "ko" ? "키워드를 선택하지 않고 진행하면 SEO 최적화 없이 콘텐츠가 생성됩니다." : "If you proceed without selecting keywords, content will be generated without SEO optimization."}
                    </p>
                    <Button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full h-12 text-base group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    >
                      {loading ? (
                        <>{t("generating")}</>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          {language === "ko" ? "2단계: 콘텐츠 생성" : "Step 2: Generate Content"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-6">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                  {/* Content Header with Edit Toggle */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-900/50">
                    <span className="text-xs text-zinc-400">
                      {isEditing
                        ? (language === "ko" ? "직접 수정 모드" : "Edit Mode")
                        : (language === "ko" ? "미리보기" : "Preview")
                      }
                    </span>
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          setEditedContent(generatedContent)
                        }
                        setIsEditing(!isEditing)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                        isEditing
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditing
                        ? (language === "ko" ? "미리보기" : "Preview")
                        : (language === "ko" ? "직접 수정" : "Edit")
                      }
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[500px] overflow-y-auto">
                    {isEditing ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[400px] bg-zinc-900 border-zinc-700 text-white resize-none font-mono text-sm"
                        placeholder={language === "ko" ? "콘텐츠를 수정하세요..." : "Edit your content..."}
                      />
                    ) : (
                      <div className="text-white prose prose-invert prose-sm max-w-none break-words [overflow-wrap:anywhere] [word-break:break-word]">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Save Edit Button */}
                  {isEditing && editedContent !== generatedContent && (
                    <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-900/50 flex items-center justify-between">
                      <span className="text-xs text-amber-400">
                        {language === "ko" ? "변경사항이 있습니다" : "You have unsaved changes"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditedContent(generatedContent)
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs border-zinc-600"
                        >
                          {language === "ko" ? "취소" : "Cancel"}
                        </Button>
                        <Button
                          onClick={() => {
                            setGeneratedContent(editedContent)
                            setIsEditing(false)
                            toast.success(language === "ko" ? "수정 내용이 적용되었습니다" : "Changes applied")
                          }}
                          size="sm"
                          className="text-xs bg-amber-500 hover:bg-amber-600"
                        >
                          {language === "ko" ? "적용" : "Apply"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* SEO Keywords at bottom of content box */}
                  {selectedKeywords.length > 0 && (
                    <div className="border-t border-zinc-700 bg-zinc-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-medium text-zinc-300">
                          {language === "ko" ? "적용된 SEO 키워드" : "Applied SEO Keywords"}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedKeywords.map((keyword, idx) => (
                          <div
                            key={`applied-${idx}`}
                            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 콘텐츠 개선하기 섹션 */}
                {contentId && (
                  <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-medium text-zinc-300">
                          {language === "ko" ? "콘텐츠 개선하기" : "Improve Content"}
                        </h4>
                      </div>
                      {refining && (
                        <div className="flex items-center gap-2 text-xs text-amber-400">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {language === "ko" ? "개선 중..." : "Improving..."}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleRefineContent("refine")}
                        disabled={refining}
                        className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-sm text-zinc-300 font-medium">
                            {language === "ko" ? "AI 정제" : "AI Refine"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {language === "ko" ? "문장을 더 매끄럽게" : "Smoother sentences"}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRefineContent("add_hook")}
                        disabled={refining}
                        className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-sm text-zinc-300 font-medium">
                            {language === "ko" ? "훅 강화" : "Add Hook"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {language === "ko" ? "시작을 더 강렬하게" : "Stronger opening"}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRefineContent("shorten")}
                        disabled={refining}
                        className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minimize2 className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm text-zinc-300 font-medium">
                            {language === "ko" ? "줄이기" : "Shorten"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {language === "ko" ? "30% 더 짧게" : "30% shorter"}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRefineContent("expand")}
                        disabled={refining}
                        className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Maximize2 className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-sm text-zinc-300 font-medium">
                            {language === "ko" ? "늘리기" : "Expand"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {language === "ko" ? "30% 더 길게" : "30% longer"}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRefineContent("adjust_tone")}
                        disabled={refining}
                        className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-sm text-zinc-300 font-medium">
                            {language === "ko" ? "톤 조정" : "Adjust Tone"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {language === "ko" ? "더 진솔하고 공감 가는 톤으로" : "More authentic and empathetic tone"}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                  <p className="text-xs text-zinc-400 font-normal">
                    {t("markdownTip")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleDownloadContent}
                      disabled={!generatedContent && !videoProject}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {language === "ko" ? "다운로드" : "Download"}
                    </Button>
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
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg">
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
