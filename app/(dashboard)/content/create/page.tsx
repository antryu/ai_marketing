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
import { Sparkles, Zap, Video, FileText, Tag, X, Image as ImageIcon, Download, Wand2, Maximize2, Minimize2, MessageSquare, RefreshCw, RotateCcw, Lightbulb, ChevronDown, ChevronUp, Copy, Check, Edit3, Scissors } from "lucide-react"
import { VideoEditor } from "@/components/video/VideoEditor"
import { AIVideoEditor } from "@/components/video/AIVideoEditor"
import ReactMarkdown from "react-markdown"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBrand } from "@/contexts/BrandContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function ContentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const { selectedBrandId, brands, loading: loadingBrands } = useBrand()
  const t = (key: TranslationKey) => translations[key][language]
  const [writerPersonas, setWriterPersonas] = useState<any[]>([])
  const [selectedWriterPersona, setSelectedWriterPersona] = useState("")
  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("all")
  const [tone, setTone] = useState("professional")
  const [length, setLength] = useState("medium")
  const [contentType, setContentType] = useState<"text" | "image" | "video" | "bundle" | "full">("text")
  const [generatedContent, setGeneratedContent] = useState("")
  const [videoProject, setVideoProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
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

  // AI Video generation states
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("")
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoMotion, setVideoMotion] = useState<"low" | "medium" | "high">("medium")
  const [showVideoEditor, setShowVideoEditor] = useState(false)

  // Suggestions from trends page
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([])
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [copiedHook, setCopiedHook] = useState<number | null>(null)

  useEffect(() => {
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
    if (selectedBrandId) {
      loadWriterPersonas()
    }
  }, [selectedBrandId])

  const loadWriterPersonas = async () => {
    if (!selectedBrandId) return

    const supabase = createClient()
    const result = await (supabase as any)
      .from("writer_personas")
      .select("*")
      .eq("brand_id", selectedBrandId)
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

    if (!selectedBrandId) {
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

    if (!selectedBrandId) {
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
            brandId: selectedBrandId,
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
            brandId: selectedBrandId,
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

  // Image generation handler - now uses topic instead of imagePrompt
  const handleGenerateImage = async () => {
    if (!topic.trim()) {
      toast.error(language === "ko" ? "토픽을 입력해주세요" : "Please enter a topic")
      return
    }

    if (!selectedBrandId) {
      toast.error(t("productSelectRequired"))
      return
    }

    setGeneratingImage(true)
    setGeneratedImageUrl("")

    try {
      // Use topic as the image prompt
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: topic,
          brandId: selectedBrandId,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          language,
        })
      })

      const data = await response.json()
      console.log("=== Image API Response ===", JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(data.error || (language === "ko" ? "이미지 생성 실패" : "Image generation failed"))
      }

      console.log("Setting imageUrl:", data.imageUrl)
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl)
      } else {
        console.error("No imageUrl in response!")
        throw new Error(language === "ko" ? "이미지 URL을 받지 못했습니다" : "No image URL received")
      }

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
      a.download = `${topic.slice(0, 30) || 'image'}-${Date.now()}.webp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(language === "ko" ? "이미지 다운로드 완료" : "Image downloaded")
    } catch (error) {
      toast.error(language === "ko" ? "다운로드 실패" : "Download failed")
    }
  }

  // AI Video generation handler (Image to Video)
  const handleGenerateVideo = async () => {
    if (!generatedImageUrl) {
      toast.error(language === "ko" ? "먼저 이미지를 생성해주세요" : "Please generate an image first")
      return
    }

    if (!selectedBrandId) {
      toast.error(t("productSelectRequired"))
      return
    }

    setGeneratingVideo(true)
    setGeneratedVideoUrl("")

    try {
      const response = await fetch("/api/video/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImageUrl,
          brandId: selectedBrandId,
          motion: videoMotion,
          language,
        })
      })

      const data = await response.json()
      console.log("=== AI Video API Response ===", JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(data.error || (language === "ko" ? "비디오 생성 실패" : "Video generation failed"))
      }

      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl)
        toast.success(language === "ko" ? "AI 비디오가 생성되었습니다!" : "AI Video generated!")
      } else {
        throw new Error(language === "ko" ? "비디오 URL을 받지 못했습니다" : "No video URL received")
      }

    } catch (error: any) {
      console.error("AI Video generation error:", error)
      toast.error(error.message || (language === "ko" ? "비디오 생성 실패" : "Video generation failed"))
    } finally {
      setGeneratingVideo(false)
    }
  }

  // Download generated video
  const handleDownloadVideo = async () => {
    if (!generatedVideoUrl) return

    try {
      const response = await fetch(generatedVideoUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(language === "ko" ? "비디오 다운로드 완료" : "Video downloaded")
    } catch (error) {
      toast.error(language === "ko" ? "다운로드 실패" : "Download failed")
    }
  }

  // Bundle/Full Package generation handler - Step by step manual progression
  const [bundleStep, setBundleStep] = useState<"idle" | "text" | "image" | "video" | "done">("idle")
  // Note: generatingImage state is defined at line ~55

  // Step 1: Generate text only
  const handleGenerateBundleText = async () => {
    if (!selectedBrandId) {
      toast.error(t("productSelectRequired"))
      return
    }

    if (!topic.trim()) {
      toast.error(t("topicRequired"))
      return
    }

    // Reset states
    setGeneratedContent("")
    setGeneratedImageUrl("")
    setGeneratedVideoUrl("")
    setBundleStep("text")
    setLoading(true)

    try {
      toast.info(language === "ko" ? "텍스트 생성 중..." : "Generating text...")

      const textResponse = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrandId,
          topic,
          platform,
          tone,
          length,
          writerPersonaId: selectedWriterPersona || undefined,
          seoKeywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
          contentType: "text",
        })
      })

      const textData = await textResponse.json()
      if (!textResponse.ok) throw new Error(textData.error || "Text generation failed")

      const generatedText = textData.generated || ""
      setGeneratedContent(generatedText)
      setContentId(textData.content?.id || null)
      setUsedAiModel(textData.aiModel || "")
      setBundleStep("done") // Text done, ready for next step

      toast.success(language === "ko" ? "텍스트 생성 완료! 이미지를 생성하려면 버튼을 클릭하세요." : "Text generated! Click to generate image.")

    } catch (error: any) {
      console.error("Text generation error:", error)
      toast.error(error.message || (language === "ko" ? "텍스트 생성 실패" : "Text generation failed"))
      setBundleStep("idle")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Generate image from text (with AI-optimized prompt)
  const handleGenerateBundleImage = async () => {
    if (!generatedContent) {
      toast.error(language === "ko" ? "먼저 텍스트를 생성해주세요" : "Please generate text first")
      return
    }

    setGeneratingImage(true)

    try {
      toast.info(language === "ko" ? "AI가 최적의 이미지 프롬프트 생성 중..." : "AI creating optimal image prompt...")

      // Step 1: Use AI to generate optimal image prompt from content
      const summarizeResponse = await fetch("/api/image/summarize-for-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          content: generatedContent,
          style: imageStyle,
          language,
        })
      })

      const summarizeData = await summarizeResponse.json()
      if (!summarizeResponse.ok) {
        console.warn("AI summarization failed, falling back to topic-based prompt")
      }

      // Use AI-generated prompt or fallback to topic
      const imagePrompt = summarizeData.success
        ? summarizeData.imagePrompt
        : topic

      console.log("Using image prompt:", imagePrompt)
      toast.info(language === "ko" ? "이미지 생성 중... (10-20초)" : "Generating image... (10-20s)")

      // Step 2: Generate image with optimized prompt
      const imageResponse = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          brandId: selectedBrandId,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          language,
        })
      })

      const imageData = await imageResponse.json()
      if (!imageResponse.ok) throw new Error(imageData.error || "Image generation failed")

      setGeneratedImageUrl(imageData.imageUrl)
      toast.success(language === "ko" ? "이미지 생성 완료! 비디오를 생성하려면 버튼을 클릭하세요." : "Image generated! Click to generate video.")

    } catch (error: any) {
      console.error("Image generation error:", error)
      toast.error(error.message || (language === "ko" ? "이미지 생성 실패" : "Image generation failed"))
    } finally {
      setGeneratingImage(false)
    }
  }

  // Legacy function for backwards compatibility (now just calls text generation)
  const handleGenerateBundle = async () => {
    await handleGenerateBundleText()
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
      // Download text content as markdown for all content types that have text
      if (generatedContent) {
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
      } else {
        toast.error(language === "ko" ? "다운로드할 텍스트가 없습니다" : "No text to download")
      }
    } catch (error) {
      toast.error(language === "ko" ? "다운로드 실패" : "Download failed")
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !selectedBrandId) {
      toast.error(language === "ko" ? "콘텐츠와 브랜드를 선택해주세요" : "Please select content and brand")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // "all" 플랫폼인 경우 네이버 블로그로 저장
      const savePlatform = platform === "all" ? "naver" : platform

      // Determine content type based on what was generated
      let saveContentType = "text"
      if (contentType === "full" && generatedVideoUrl) {
        saveContentType = "full_package"
      } else if (contentType === "bundle" && generatedImageUrl) {
        saveContentType = "bundle"
      } else if (contentType === "image") {
        saveContentType = "image"
      } else if (contentType === "video") {
        saveContentType = "video"
      }

      // Build platform_variations with all generated content
      const platformVariations: Record<string, any> = {
        [savePlatform]: {
          text: generatedContent
        }
      }

      // Add image URL if available
      if (generatedImageUrl) {
        platformVariations[savePlatform].imageUrl = generatedImageUrl
      }

      // Add video URL if available
      if (generatedVideoUrl) {
        platformVariations[savePlatform].videoUrl = generatedVideoUrl
      }

      const { data, error} = await (supabase as any)
        .from("contents")
        .insert({
          brand_id: selectedBrandId,
          writer_persona_id: selectedWriterPersona || null,
          topic,
          body: generatedContent,
          content_type: saveContentType,
          ai_model: usedAiModel || "claude",
          seo_keywords: selectedKeywords,
          platform_variations: platformVariations,
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
      setGeneratedImageUrl("")
      setGeneratedVideoUrl("")
      setTopic("")
      setSelectedKeywords([])
      setSeoSuggestions(null)
      setBundleStep("idle")

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
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 space-y-5">
            {/* Section 1: 주제 입력 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
                {language === "ko" ? "주제 입력" : "Topic Input"}
              </div>

              {/* Topic Input */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t("topic")}</Label>
                <Input
                  className="h-10"
                  placeholder={contentType === "image"
                    ? (language === "ko" ? "예: 커피숍에서 일하는 직장인" : "e.g., professional working in a coffee shop")
                    : contentType === "video"
                    ? (language === "ko" ? "예: 바다 위의 석양" : "e.g., sunset over the ocean")
                    : t("topicPlaceholder")
                  }
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-zinc-700/50" />

            {/* Section 2: 콘텐츠 타입 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                {language === "ko" ? "콘텐츠 타입" : "Content Type"}
              </div>

              {/* Content Type Selection - Compact 3 Column Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* 텍스트 Only */}
                <button
                  onClick={() => setContentType("text")}
                  className={`
                    relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
                    ${contentType === "text"
                      ? "bg-amber-500/10 border-amber-500"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                    }
                  `}
                >
                  <FileText className={`w-5 h-5 ${contentType === "text" ? "text-amber-400" : "text-zinc-400"}`} />
                  <span className={`text-xs font-medium ${contentType === "text" ? "text-amber-400" : "text-zinc-300"}`}>
                    {language === "ko" ? "텍스트" : "Text"}
                  </span>
                </button>

                {/* 텍스트 + 이미지 번들 */}
                <button
                  onClick={() => setContentType("bundle")}
                  className={`
                    relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
                    ${contentType === "bundle"
                      ? "bg-amber-500/10 border-amber-500"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-center -space-x-1">
                    <FileText className={`w-4 h-4 ${contentType === "bundle" ? "text-amber-400" : "text-zinc-400"}`} />
                    <ImageIcon className={`w-4 h-4 ${contentType === "bundle" ? "text-blue-400" : "text-zinc-400"}`} />
                  </div>
                  <span className={`text-xs font-medium ${contentType === "bundle" ? "text-amber-400" : "text-zinc-300"}`}>
                    {language === "ko" ? "텍스트+이미지" : "Text+Image"}
                  </span>
                </button>

                {/* 풀 패키지 */}
                <button
                  onClick={() => setContentType("full")}
                  className={`
                    relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
                    ${contentType === "full"
                      ? "bg-purple-500/10 border-purple-500"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                    }
                  `}
                >
                  <div className="flex items-center -space-x-1">
                    <FileText className={`w-3.5 h-3.5 ${contentType === "full" ? "text-amber-400" : "text-zinc-400"}`} />
                    <ImageIcon className={`w-3.5 h-3.5 ${contentType === "full" ? "text-blue-400" : "text-zinc-400"}`} />
                    <Video className={`w-3.5 h-3.5 ${contentType === "full" ? "text-purple-400" : "text-zinc-400"}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${contentType === "full" ? "text-purple-400" : "text-zinc-300"}`}>
                      {language === "ko" ? "풀패키지" : "Full"}
                    </span>
                    <span className="px-1 py-0.5 text-[8px] font-bold bg-purple-500/20 text-purple-400 rounded">PRO</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: 세부 옵션 (Content Type에 따라 다름) */}
            {(contentType !== "text" || writerPersonas.length > 0 || suggestedHooks.length > 0) && (
              <>
                <div className="border-t border-zinc-700/50" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                    {language === "ko" ? "세부 옵션" : "Options"}
                  </div>

                  {/* Image Options */}
                  {contentType === "image" && (
                    <div className="space-y-4">
                      {/* Style + Aspect Ratio in one row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "스타일" : "Style"}</Label>
                          <Select value={imageStyle} onValueChange={(v) => setImageStyle(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realistic">📷 {language === "ko" ? "사실적" : "Realistic"}</SelectItem>
                              <SelectItem value="illustration">🎨 {language === "ko" ? "일러스트" : "Illustration"}</SelectItem>
                              <SelectItem value="minimal">⬜ {language === "ko" ? "미니멀" : "Minimal"}</SelectItem>
                              <SelectItem value="vibrant">🌈 {language === "ko" ? "생동감" : "Vibrant"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "비율" : "Ratio"}</Label>
                          <Select value={imageAspectRatio} onValueChange={(v) => setImageAspectRatio(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1:1">⬜ 1:1 {language === "ko" ? "정사각형" : "Square"}</SelectItem>
                              <SelectItem value="16:9">🖼️ 16:9 {language === "ko" ? "가로형" : "Landscape"}</SelectItem>
                              <SelectItem value="9:16">📱 9:16 {language === "ko" ? "세로형" : "Portrait"}</SelectItem>
                              <SelectItem value="4:3">🖥️ 4:3 {language === "ko" ? "표준" : "Standard"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Generate Image Button */}
                      <Button
                        onClick={handleGenerateImage}
                        disabled={generatingImage || !topic.trim() || !selectedBrandId}
                        className="w-full h-11 text-base group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                      >
                        {generatingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {language === "ko" ? "생성 중..." : "Generating..."}
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {language === "ko" ? "이미지 생성" : "Generate Image"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Video Options */}
                  {contentType === "video" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "이미지 스타일" : "Image Style"}</Label>
                          <Select value={imageStyle} onValueChange={(v) => setImageStyle(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realistic">📷 {language === "ko" ? "사실적" : "Realistic"}</SelectItem>
                              <SelectItem value="illustration">🎨 {language === "ko" ? "일러스트" : "Illustration"}</SelectItem>
                              <SelectItem value="minimal">⬜ {language === "ko" ? "미니멀" : "Minimal"}</SelectItem>
                              <SelectItem value="vibrant">🌈 {language === "ko" ? "생동감" : "Vibrant"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "모션 강도" : "Motion"}</Label>
                          <Select value={videoMotion} onValueChange={(v) => setVideoMotion(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">🌊 {language === "ko" ? "약함" : "Low"}</SelectItem>
                              <SelectItem value="medium">🌀 {language === "ko" ? "보통" : "Medium"}</SelectItem>
                              <SelectItem value="high">💫 {language === "ko" ? "강함" : "High"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <p className="text-xs text-purple-400/70 flex items-center gap-1.5">
                        <Video className="w-3 h-3" />
                        {language === "ko" ? "이미지 생성 후 비디오로 변환됩니다 (1-3분)" : "Image → Video conversion (1-3 min)"}
                      </p>
                    </div>
                  )}

                  {/* Bundle/Full Options */}
                  {(contentType === "bundle" || contentType === "full") && (
                    <div className="space-y-4">
                      {/* Info Banner - Compact */}
                      <div className={`p-3 rounded-lg ${contentType === "full" ? "bg-purple-500/10 border border-purple-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                        <p className="text-xs text-zinc-400">
                          {contentType === "full"
                            ? (language === "ko" ? "텍스트 → 이미지 → 비디오 순차 생성" : "Text → Image → Video sequential generation")
                            : (language === "ko" ? "텍스트와 이미지를 함께 생성합니다" : "Generate text and image together")
                          }
                        </p>
                      </div>

                      <div className={`grid ${contentType === "full" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "이미지 스타일" : "Style"}</Label>
                          <Select value={imageStyle} onValueChange={(v) => setImageStyle(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realistic">📷 {language === "ko" ? "사실적" : "Realistic"}</SelectItem>
                              <SelectItem value="illustration">🎨 {language === "ko" ? "일러스트" : "Illustration"}</SelectItem>
                              <SelectItem value="minimal">⬜ {language === "ko" ? "미니멀" : "Minimal"}</SelectItem>
                              <SelectItem value="vibrant">🌈 {language === "ko" ? "생동감" : "Vibrant"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-500">{language === "ko" ? "이미지 비율" : "Ratio"}</Label>
                          <Select value={imageAspectRatio} onValueChange={(v) => setImageAspectRatio(v as any)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1:1">⬜ 1:1</SelectItem>
                              <SelectItem value="16:9">🖼️ 16:9</SelectItem>
                              <SelectItem value="9:16">📱 9:16</SelectItem>
                              <SelectItem value="4:3">🖥️ 4:3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {contentType === "full" && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-500">{language === "ko" ? "비디오 모션" : "Motion"}</Label>
                            <Select value={videoMotion} onValueChange={(v) => setVideoMotion(v as any)}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🐢 {language === "ko" ? "약하게" : "Low"}</SelectItem>
                                <SelectItem value="medium">🚶 {language === "ko" ? "보통" : "Medium"}</SelectItem>
                                <SelectItem value="high">🏃 {language === "ko" ? "강하게" : "High"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Options */}
                  {contentType === "text" && (
                    <div className="space-y-4">
                      {/* Brand Voice - Compact */}
                      {writerPersonas.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-zinc-500">{language === "ko" ? "브랜드 보이스" : "Brand Voice"}</Label>
                            <a href="/writer-personas" className="text-[10px] text-amber-400 hover:text-amber-300">{t("manage")}</a>
                          </div>
                          <Select value={selectedWriterPersona || "default"} onValueChange={(value) => setSelectedWriterPersona(value === "default" ? "" : value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={language === "ko" ? "브랜드 보이스 선택" : "Select Brand Voice"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">{language === "ko" ? "기본 스타일" : "Default Style"}</SelectItem>
                              {writerPersonas.map((persona) => (
                                <SelectItem key={persona.id} value={persona.id}>
                                  {persona.name} {persona.is_default && "⭐"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Opening Hooks - Collapsible */}
                      {suggestedHooks.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="w-full flex items-center justify-between p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/15 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-purple-400" />
                              <span className="text-xs text-zinc-300">{language === "ko" ? "오프닝 훅 제안" : "Opening Hooks"} ({suggestedHooks.length})</span>
                            </div>
                            {showSuggestions ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                          </button>
                          {showSuggestions && (
                            <div className="mt-2 space-y-1.5 p-3 bg-zinc-800/30 rounded-lg">
                              {suggestedHooks.map((hook, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-zinc-900/50 rounded group hover:bg-zinc-900 transition-colors">
                                  <p className="text-zinc-400 text-xs italic flex-1">"{hook}"</p>
                                  <button onClick={() => copyHook(hook, idx)} className="p-1 text-zinc-600 hover:text-purple-400 transition-colors">
                                    {copiedHook === idx ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Section 4: 텍스트 전용 옵션 (플랫폼, 톤, 길이) */}
            {contentType === "text" && (
              <>
                <div className="border-t border-zinc-700/50" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">{writerPersonas.length > 0 || suggestedHooks.length > 0 ? "4" : "3"}</span>
                    {language === "ko" ? "글 설정" : "Writing Settings"}
                  </div>

                  {/* Platform & Length in one row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500">{t("platform")}</Label>
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger className="h-9">
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
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500">{t("length")}</Label>
                      <Select value={length} onValueChange={setLength}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">{t("lengthShort")}</SelectItem>
                          <SelectItem value="medium">{t("lengthMedium")}</SelectItem>
                          <SelectItem value="long">{t("lengthLong")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tone Selection - Compact chips */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500">{t("toneField")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "friendly", emoji: "😊", labelKo: "친근한", labelEn: "Friendly" },
                        { value: "professional", emoji: "💼", labelKo: "전문적", labelEn: "Professional" },
                        { value: "casual", emoji: "🎯", labelKo: "직설적", labelEn: "Direct" },
                        { value: "trendy", emoji: "✨", labelKo: "트렌디", labelEn: "Trendy" },
                        { value: "educational", emoji: "📚", labelKo: "교육적", labelEn: "Educational" },
                        { value: "humorous", emoji: "😄", labelKo: "유머러스", labelEn: "Humorous" },
                      ].map((toneOption) => (
                        <button
                          key={toneOption.value}
                          onClick={() => setTone(toneOption.value)}
                          className={`
                            px-3 py-1.5 rounded-full border transition-all text-xs
                            ${tone === toneOption.value
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                            }
                          `}
                        >
                          {toneOption.emoji} {language === "ko" ? toneOption.labelKo : toneOption.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

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
            ) : contentType === "video" ? (
              <div className="space-y-3">
                {/* Step 1: Generate Image */}
                <Button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !topic.trim() || !selectedBrandId}
                  className="w-full h-12 text-base group bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                >
                  {generatingImage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {language === "ko" ? "이미지 생성 중..." : "Generating image..."}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      {language === "ko" ? "1단계: 이미지 생성" : "Step 1: Generate Image"}
                    </>
                  )}
                </Button>

                {/* Step 2: Convert to Video (only show after image is generated) */}
                {generatedImageUrl && (
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo}
                    className="w-full h-12 text-base group bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
                  >
                    {generatingVideo ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {language === "ko" ? "비디오 변환 중... (1-3분)" : "Converting to video... (1-3 min)"}
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        {language === "ko" ? "2단계: 비디오로 변환" : "Step 2: Convert to Video"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (contentType === "bundle" || contentType === "full") ? (
              /* Bundle/Full Package Step-by-Step Generation Buttons */
              <div className="space-y-3">
                {/* Step 1: SEO Keywords Analysis Button (before text generation) */}
                {!seoStep && !generatedContent && (
                  <Button
                    onClick={handleSeoSuggestion}
                    disabled={loadingSeo || !topic.trim() || !selectedBrandId}
                    className="w-full h-12 text-base group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                  >
                    {loadingSeo ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {language === "ko" ? "SEO 키워드 분석 중..." : "Analyzing SEO keywords..."}
                      </>
                    ) : (
                      <>
                        <Tag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        {language === "ko" ? "1단계: SEO 키워드 분석" : "Step 1: SEO Keyword Analysis"}
                      </>
                    )}
                  </Button>
                )}

                {/* Step 2: Generate Text Button - moved to right panel (preview area) */}

                {/* Step 3: Generate Image Button - moved to right panel (preview area) */}

                {/* Step 4: Generate Video Button (only for full package, after image is generated) */}
                {contentType === "full" && generatedImageUrl && !generatedVideoUrl && (
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo}
                    className="w-full h-12 text-base group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {generatingVideo ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {language === "ko" ? "비디오 생성 중... (1-3분)" : "Generating video... (1-3 min)"}
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        {language === "ko" ? "4단계: 비디오 생성" : "Step 4: Generate Video"}
                      </>
                    )}
                  </Button>
                )}

                {/* Start Over Button (show when any content is generated) */}
                {generatedContent && (
                  <Button
                    onClick={() => {
                      setGeneratedContent("")
                      setGeneratedImageUrl("")
                      setGeneratedVideoUrl("")
                      setBundleStep("idle")
                      setContentId(null)
                      setSeoStep(false)
                      setSeoSuggestions(null)
                      setSelectedKeywords([])
                    }}
                    variant="outline"
                    className="w-full h-12 text-base group border-zinc-600 hover:border-zinc-500"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {language === "ko" ? "새로 시작하기" : "Start Over"}
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Preview */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-white tracking-wide">
                  {seoStep && !generatedContent ? (language === "ko" ? "콘텐츠 생성" : "Generate Content") : t("preview")}
                </h2>
                <p className="text-zinc-400 text-xs font-normal tracking-wide mt-1">
                  {seoStep && !generatedContent ? (language === "ko" ? "키워드 기반으로 텍스트, 이미지, 비디오를 생성합니다" : "Generate text, image, and video based on keywords") : t("generatedContentPreview")}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            {(contentType === "bundle" || contentType === "full") && bundleStep !== "idle" && bundleStep !== "done" ? (
              /* Bundle/Full Package Loading States */
              <div className="space-y-6">
                {/* Step 1: Text Generation */}
                <div className={`p-4 rounded-lg border ${
                  bundleStep === "text"
                    ? "border-amber-500/50 bg-amber-500/10"
                    : generatedContent
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-zinc-700 bg-zinc-800/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {bundleStep === "text" ? (
                      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : generatedContent ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-sm">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-sm">2</span>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${bundleStep === "text" ? "text-amber-400" : generatedContent ? "text-green-400" : "text-zinc-400"}`}>
                        {language === "ko" ? "텍스트 생성 (2단계)" : "Text Generation (Step 2)"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {bundleStep === "text"
                          ? (language === "ko" ? "생성 중..." : "Generating...")
                          : generatedContent
                          ? (language === "ko" ? "완료" : "Complete")
                          : (language === "ko" ? "대기 중" : "Waiting")
                        }
                      </p>
                    </div>
                  </div>
                  {generatedContent && (
                    <div className="mt-3 p-3 bg-zinc-900/50 rounded text-sm text-zinc-300 max-h-32 overflow-hidden">
                      {generatedContent.slice(0, 200)}...
                    </div>
                  )}
                </div>

                {/* Step 2: Image Generation */}
                <div className={`p-4 rounded-lg border ${
                  bundleStep === "image"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : generatedImageUrl
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-zinc-700 bg-zinc-800/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {bundleStep === "image" ? (
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : generatedImageUrl ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-sm">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-sm">3</span>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${bundleStep === "image" ? "text-blue-400" : generatedImageUrl ? "text-green-400" : "text-zinc-400"}`}>
                        {language === "ko" ? "이미지 생성 (3단계)" : "Image Generation (Step 3)"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {bundleStep === "image"
                          ? (language === "ko" ? "생성 중 (10-20초)..." : "Generating (10-20s)...")
                          : generatedImageUrl
                          ? (language === "ko" ? "완료" : "Complete")
                          : (language === "ko" ? "대기 중" : "Waiting")
                        }
                      </p>
                    </div>
                  </div>
                  {generatedImageUrl && (
                    <div className="mt-3">
                      <img src={generatedImageUrl} alt="Generated" className="w-24 h-24 object-cover rounded" />
                    </div>
                  )}
                </div>

                {/* Step 3: Video Generation (only for full package) */}
                {contentType === "full" && (
                  <div className={`p-4 rounded-lg border ${
                    bundleStep === "video"
                      ? "border-purple-500/50 bg-purple-500/10"
                      : generatedVideoUrl
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}>
                    <div className="flex items-center gap-3">
                      {bundleStep === "video" ? (
                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : generatedVideoUrl ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-sm">✓</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-zinc-500 text-sm">4</span>
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${bundleStep === "video" ? "text-purple-400" : generatedVideoUrl ? "text-green-400" : "text-zinc-400"}`}>
                          {language === "ko" ? "비디오 생성 (4단계)" : "Video Generation (Step 4)"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {bundleStep === "video"
                            ? (language === "ko" ? "생성 중 (1-3분)..." : "Generating (1-3 min)...")
                            : generatedVideoUrl
                            ? (language === "ko" ? "완료" : "Complete")
                            : (language === "ko" ? "대기 중" : "Waiting")
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Summary */}
                <div className="p-4 bg-gradient-to-r from-amber-900/10 via-blue-900/10 to-purple-900/10 border border-zinc-700 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      {contentType === "full"
                        ? (language === "ko" ? "풀 패키지 생성 중..." : "Generating full package...")
                        : (language === "ko" ? "텍스트 + 이미지 생성 중..." : "Generating text + image...")
                      }
                    </span>
                  </div>
                </div>
              </div>
            ) : contentType === "video" ? (
              /* Video Preview Section */
              generatedVideoUrl ? (
                <div className="space-y-6">
                  {/* Generated Video Display */}
                  <div className="bg-zinc-800 border border-purple-500/30 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-purple-900/20">
                      <span className="text-xs text-purple-300 flex items-center gap-2">
                        <Video className="w-3 h-3" />
                        {language === "ko" ? "생성된 AI 비디오" : "Generated AI Video"}
                      </span>
                      <span className="text-xs text-zinc-500">~2s</span>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-zinc-900/30">
                      <video
                        src={generatedVideoUrl}
                        controls
                        autoPlay
                        loop
                        muted
                        className="max-w-full max-h-[400px] rounded"
                      />
                    </div>
                  </div>

                  {/* Video Actions */}
                  <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>{topic.length > 50 ? topic.slice(0, 50) + "..." : topic}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Button
                        onClick={() => setShowVideoEditor(true)}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        {language === "ko" ? "편집하기" : "Edit Video"}
                      </Button>
                      <Button
                        onClick={handleDownloadVideo}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {language === "ko" ? "다운로드" : "Download"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => {
                          setGeneratedVideoUrl("")
                          handleGenerateVideo()
                        }}
                        variant="outline"
                        className="w-full border-purple-600 hover:border-purple-500 text-purple-400 hover:text-purple-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {language === "ko" ? "다시 생성" : "Regenerate"}
                      </Button>
                      <Button
                        onClick={() => {
                          setGeneratedImageUrl("")
                          setGeneratedVideoUrl("")
                          setImagePrompt("")
                        }}
                        variant="outline"
                        className="w-full border-zinc-600 hover:border-zinc-500"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {language === "ko" ? "초기화" : "Reset"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : generatedImageUrl ? (
                <div className="space-y-6">
                  {/* Generated Image for Video */}
                  <div className="bg-zinc-800 border border-purple-500/30 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-purple-900/20">
                      <span className="text-xs text-purple-300 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" />
                        {language === "ko" ? "소스 이미지 (1단계 완료)" : "Source Image (Step 1 Complete)"}
                      </span>
                      <span className="text-xs text-green-400">✓</span>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-zinc-900/30">
                      <img
                        src={generatedImageUrl}
                        alt="Source image for video"
                        className="max-w-full max-h-[300px] object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Prompt to generate video */}
                  <div className="p-4 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-purple-500/30 rounded text-center">
                    <Video className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-300 font-medium mb-1">
                      {language === "ko" ? "이미지가 준비되었습니다!" : "Image is ready!"}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {language === "ko"
                        ? "왼쪽의 '2단계: 비디오로 변환' 버튼을 클릭하세요"
                        : "Click 'Step 2: Convert to Video' button on the left"
                      }
                    </p>
                  </div>
                </div>
              ) : generatingImage ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-purple-500/30 rounded-lg bg-purple-500/5">
                  <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-400 font-medium">
                    {language === "ko" ? "이미지 생성 중..." : "Generating image..."}
                  </p>
                  <p className="text-zinc-500 text-sm mt-2">
                    {language === "ko" ? "약 10-20초 정도 소요됩니다" : "This takes about 10-20 seconds"}
                  </p>
                </div>
              ) : generatingVideo ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-pink-500/30 rounded-lg bg-pink-500/5">
                  <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-pink-400 font-medium">
                    {language === "ko" ? "비디오 변환 중..." : "Converting to video..."}
                  </p>
                  <p className="text-zinc-500 text-sm mt-2">
                    {language === "ko" ? "약 1-3분 정도 소요됩니다" : "This takes about 1-3 minutes"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-purple-700/50 rounded-lg">
                  <div className="text-center">
                    <Video className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <p className="text-zinc-400 font-normal whitespace-pre-line">
                      {language === "ko" ? "이미지 설명을 입력하고\n1단계 버튼을 클릭하세요" : "Enter image description\nand click Step 1 button"}
                    </p>
                  </div>
                </div>
              )
            ) : contentType === "image" ? (
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
                      <span>{topic.length > 50 ? topic.slice(0, 50) + "..." : topic}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
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
                          setGeneratedVideoUrl("")
                          handleGenerateImage()
                        }}
                        variant="outline"
                        className="w-full border-amber-600 hover:border-amber-500 text-amber-400 hover:text-amber-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {language === "ko" ? "다시 생성" : "Regenerate"}
                      </Button>
                      <Button
                        onClick={() => {
                          setGeneratedImageUrl("")
                          setGeneratedVideoUrl("")
                          setImagePrompt("")
                        }}
                        variant="outline"
                        className="w-full border-zinc-600 hover:border-zinc-500"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {language === "ko" ? "초기화" : "Reset"}
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
                      onClick={(contentType === "bundle" || contentType === "full") ? handleGenerateBundleText : handleGenerate}
                      disabled={loading}
                      className="w-full h-12 text-base group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {language === "ko" ? "텍스트 생성 중..." : "Generating text..."}
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          {(contentType === "bundle" || contentType === "full")
                            ? (language === "ko" ? "2단계: 텍스트 생성" : "Step 2: Generate Text")
                            : (language === "ko" ? "2단계: 콘텐츠 생성" : "Step 2: Generate Content")
                          }
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

                {/* 콘텐츠 개선하기 섹션 - moved above image generation */}
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

                {/* Step-by-Step: Next Step Button in Preview Area */}
                {(contentType === "bundle" || contentType === "full") && generatedContent && !generatedImageUrl && (
                  <div className="p-4 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-amber-400 font-medium">3</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-300">
                          {language === "ko" ? "다음 단계: 이미지 생성" : "Next Step: Generate Image"}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {language === "ko" ? "텍스트 기반으로 AI 이미지를 생성합니다 (10-20초)" : "Generate AI image based on your text (10-20s)"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleGenerateBundleImage}
                      disabled={generatingImage}
                      className="w-full h-10 text-sm group bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    >
                      {generatingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {language === "ko" ? "이미지 생성 중..." : "Generating image..."}
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          {language === "ko" ? "3단계: 이미지 생성" : "Step 3: Generate Image"}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Bundle: Generated Image Section */}
                {(contentType === "bundle" || contentType === "full") && generatedImageUrl && (
                  <div className="bg-zinc-800 border border-amber-500/30 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-300">
                          {language === "ko" ? "생성된 이미지" : "Generated Image"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-zinc-900">
                        <img
                          src={generatedImageUrl}
                          alt="Generated"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="mt-4 flex justify-center gap-3">
                        <Button
                          onClick={async () => {
                            try {
                              const response = await fetch(generatedImageUrl)
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const link = document.createElement("a")
                              link.href = url
                              link.download = `${topic.replace(/\s+/g, "_")}_image.webp`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              window.URL.revokeObjectURL(url)
                              toast.success(language === "ko" ? "이미지 다운로드 완료" : "Image downloaded")
                            } catch (error) {
                              console.error("Download error:", error)
                              // Fallback: open in new tab
                              window.open(generatedImageUrl, "_blank")
                              toast.info(language === "ko" ? "새 탭에서 이미지를 열었습니다. 우클릭하여 저장하세요." : "Image opened in new tab. Right-click to save.")
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {language === "ko" ? "이미지 다운로드" : "Download Image"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step-by-Step: Next Step Button for Video in Preview Area (only for full package) */}
                {contentType === "full" && generatedImageUrl && !generatedVideoUrl && (
                  <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-medium">4</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-purple-300">
                          {language === "ko" ? "다음 단계: 비디오 생성" : "Next Step: Generate Video"}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {language === "ko" ? "이미지를 AI 비디오로 변환합니다 (1-3분)" : "Convert image to AI video (1-3 min)"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleGenerateVideo}
                      disabled={generatingVideo}
                      className="w-full h-10 text-sm group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    >
                      {generatingVideo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {language === "ko" ? "비디오 생성 중..." : "Generating video..."}
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          {language === "ko" ? "비디오 생성하기" : "Generate Video"}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Bundle/Full: Generated Video Section */}
                {(contentType === "bundle" || contentType === "full") && generatedVideoUrl && (
                  <div className="bg-zinc-800 border border-purple-500/30 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-purple-900/20">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">
                          {language === "ko" ? "생성된 비디오" : "Generated Video"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="relative max-w-md mx-auto rounded-lg overflow-hidden bg-zinc-900">
                        <video
                          src={generatedVideoUrl}
                          controls
                          autoPlay
                          loop
                          muted
                          className="w-full h-auto"
                        />
                      </div>
                      <div className="mt-4 flex justify-center gap-3">
                        <Button
                          onClick={() => setShowVideoEditor(true)}
                          size="sm"
                          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black"
                        >
                          <Scissors className="w-4 h-4 mr-2" />
                          {language === "ko" ? "편집하기" : "Edit Video"}
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = generatedVideoUrl
                            link.download = `${topic.replace(/\s+/g, "_")}_video.mp4`
                            link.click()
                          }}
                          variant="outline"
                          size="sm"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {language === "ko" ? "비디오 다운로드" : "Download Video"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bundle Results Summary - only show when BOTH text AND image are generated */}
                {(contentType === "bundle" || contentType === "full") && generatedContent && generatedImageUrl && (
                  <div className="p-4 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-medium text-amber-300">
                        {contentType === "full" && generatedVideoUrl
                          ? (language === "ko" ? "풀 패키지 생성 완료!" : "Full Package Complete!")
                          : (language === "ko" ? "텍스트 + 이미지 생성 완료!" : "Text + Image Complete!")
                        }
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {language === "ko" ? "텍스트" : "Text"} ✓
                      </span>
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {language === "ko" ? "이미지" : "Image"} ✓
                      </span>
                      {contentType === "full" && generatedVideoUrl && (
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1">
                          <Video className="w-3 h-3" /> {language === "ko" ? "비디오" : "Video"} ✓
                        </span>
                      )}
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

      {/* AI Video Editor Modal */}
      {showVideoEditor && generatedVideoUrl && (
        <AIVideoEditor
          videoUrl={generatedVideoUrl}
          language={language}
          onClose={() => setShowVideoEditor(false)}
          onSave={(editedUrl) => {
            setGeneratedVideoUrl(editedUrl)
            setShowVideoEditor(false)
            toast.success(language === "ko" ? "비디오 편집 완료!" : "Video editing complete!")
          }}
          onOpenAdvanced={() => {
            setShowVideoEditor(false)
            // Navigate to advanced editor page with video URL
            router.push(`/video-editor?videoUrl=${encodeURIComponent(generatedVideoUrl)}`)
          }}
        />
      )}
    </div>
  )
}
