"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AdvancedVideoEditor } from "@/components/video/AdvancedVideoEditor"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

function VideoEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()

  const videoUrl = searchParams.get('videoUrl')
  const videoDuration = parseFloat(searchParams.get('duration') || '3')
  const contentId = searchParams.get('contentId')

  const handleBack = () => {
    if (contentId) {
      router.push(`/content/create?contentId=${contentId}`)
    } else {
      router.back()
    }
  }

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

  return (
    <AdvancedVideoEditor
      videoUrl={videoUrl}
      videoDuration={videoDuration}
      onBack={handleBack}
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
