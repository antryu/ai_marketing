"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AdvancedVideoEditor } from "@/components/video/AdvancedVideoEditor"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { toast } from "sonner"

function VideoEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()

  const videoUrl = searchParams.get('videoUrl')
  const videoDuration = parseFloat(searchParams.get('duration') || '3')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            {language === "ko" ? "비디오를 찾을 수 없습니다" : "Video not found"}
          </h2>
          <p className="text-zinc-400 mb-6">
            {language === "ko"
              ? "편집할 비디오 URL이 제공되지 않았습니다."
              : "No video URL was provided for editing."}
          </p>
          <Button onClick={() => router.push('/content/create')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === "ko" ? "콘텐츠 생성으로 돌아가기" : "Back to Content Creation"}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">
            {language === "ko" ? "편집기 로딩 중..." : "Loading editor..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <AdvancedVideoEditor
      videoUrl={videoUrl}
      videoDuration={videoDuration}
      onBack={() => router.back()}
      onSave={(projectData) => {
        toast.success(language === "ko" ? "프로젝트 저장됨" : "Project saved")
        console.log('Saved project:', projectData)
      }}
      onExport={() => {
        toast.success(language === "ko" ? "비디오 내보내기 시작..." : "Starting video export...")
      }}
      language={language}
    />
  )
}

export default function VideoEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    }>
      <VideoEditorContent />
    </Suspense>
  )
}
