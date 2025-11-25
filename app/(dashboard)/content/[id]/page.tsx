"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformPreview } from "@/components/content/PlatformPreview"
import { ArrowLeft, Edit, Trash2, Send, Calendar } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = Array.isArray(params.id) ? params.id[0] : params.id as string
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (contentId) {
      loadContent(contentId)
    }
  }, [contentId])

  const loadContent = async (id: string) => {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
      .from("contents")
      .select(`
        *,
        brand:brands(name),
        published_posts(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(error)
      toast.error("콘텐츠를 불러오는데 실패했습니다")
      router.push("/content")
    } else {
      console.log("=== 콘텐츠 데이터 ===")
      console.log("Platform variations:", data.platform_variations)
      if (data.platform_variations) {
        Object.keys(data.platform_variations).forEach(platform => {
          console.log(`\n${platform.toUpperCase()}:`)
          console.log(`길이: ${data.platform_variations[platform].text?.length || 0}자`)
          console.log(`내용 미리보기: ${data.platform_variations[platform].text?.substring(0, 100)}...`)
        })
      }
      setContent(data)
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("contents")
      .delete()
      .eq("id", contentId)

    if (error) {
      toast.error("삭제 실패")
    } else {
      toast.success("삭제되었습니다")
      router.push("/content")
    }
  }

  const handlePublish = async () => {
    toast.info("발행 기능은 소셜 미디어 API 연동 후 사용 가능합니다")
    // TODO: Implement publishing logic
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 font-normal">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!content) return null

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-zinc-700 text-zinc-300",
      scheduled: "bg-amber-900/30 text-amber-400",
      published: "bg-emerald-900/30 text-emerald-400",
    }

    const labels = {
      draft: "초안",
      scheduled: "예약됨",
      published: "발행됨",
    }

    return (
      <span className={`px-3 py-1.5 text-sm font-medium rounded ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="p-12 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/content")}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로
            </Button>
            <div>
              <h1 className="text-3xl font-light tracking-wide mb-2">{content.title || "콘텐츠 상세"}</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(content.created_at).toLocaleDateString("ko-KR")}
                </span>
                {getStatusBadge(content.status)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePublish}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-none text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              발행하기
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="bg-red-900/20 border-red-800 hover:bg-red-900/30 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 원본 콘텐츠 */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>원본 콘텐츠</CardTitle>
              <CardDescription>AI가 생성한 기본 콘텐츠</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 overflow-hidden">
                <div className="text-white prose prose-invert prose-sm max-w-none break-words overflow-wrap-anywhere">
                  <ReactMarkdown>{content.body}</ReactMarkdown>
                </div>
              </div>

              {/* SEO Keywords */}
              {content.seo_keywords && content.seo_keywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">🏷️ SEO 키워드</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.seo_keywords.map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {content.ai_model && (
                <div className="mt-4 text-xs text-zinc-500 flex items-center justify-between">
                  <span>AI 모델: {content.ai_model}</span>
                  {content.generation_time_ms && (
                    <span>생성 시간: {(content.generation_time_ms / 1000).toFixed(2)}초</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 플랫폼별 프리뷰 */}
          {content.platform_variations && (
            <PlatformPreview variations={content.platform_variations} />
          )}
        </div>

        {/* 발행 내역 */}
        {content.published_posts && content.published_posts.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>발행 내역</CardTitle>
              <CardDescription>{content.published_posts.length}개 플랫폼에 발행됨</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {content.published_posts.map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-white mb-1">{post.platform}</div>
                      <div className="text-xs text-zinc-400">
                        {new Date(post.published_at || post.created_at).toLocaleString("ko-KR")}
                      </div>
                    </div>
                    {post.platform_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(post.platform_url, "_blank")}
                        className="bg-zinc-900 border-zinc-800 hover:bg-zinc-700"
                      >
                        보기
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
