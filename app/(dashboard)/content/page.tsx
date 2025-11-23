"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Calendar, Eye, Trash2, Edit, Zap } from "lucide-react"
import { toast } from "sonner"

export default function ContentPage() {
  const router = useRouter()
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        brand:brands(name),
        published_posts(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      toast.error("콘텐츠를 불러오는데 실패했습니다")
    } else {
      setContents(data || [])
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("contents")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("삭제 실패")
    } else {
      toast.success("삭제되었습니다")
      loadContents()
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-zinc-700 text-zinc-300 border-zinc-600",
      scheduled: "bg-amber-900/30 text-amber-400 border-amber-700",
      published: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
    }

    const labels = {
      draft: "초안",
      scheduled: "예약됨",
      published: "발행됨",
    }

    return (
      <span className={`px-3 py-1 text-xs font-medium tracking-wide border ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getPlatformIcon = (platform: string | undefined) => {
    if (!platform) return null

    const colors = {
      thread: "text-purple-400",
      linkedin: "text-blue-400",
      instagram: "text-pink-400",
      twitter: "text-sky-400",
    }

    return (
      <div className={`w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center ${colors[platform as keyof typeof colors] || "text-zinc-400"}`}>
        <span className="text-xs font-medium uppercase">{platform.slice(0, 2)}</span>
      </div>
    )
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

  return (
    <div className="p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-light tracking-wide text-white mb-3">콘텐츠</h1>
            <p className="text-zinc-300 font-normal text-base tracking-wide">
              생성된 콘텐츠를 관리하세요
            </p>
          </div>
          <Button
            onClick={() => router.push("/content/create")}
            className="group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            새 콘텐츠 생성
          </Button>
        </div>

        {/* Content List */}
        {contents.length === 0 ? (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-16 text-center">
            <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h2 className="text-2xl font-light text-white mb-4">콘텐츠가 없습니다</h2>
            <p className="text-zinc-400 font-normal mb-8">
              첫 번째 콘텐츠를 생성해보세요
            </p>
            <Button onClick={() => router.push("/content/create")} className="group">
              <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              콘텐츠 생성하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div
                key={content.id}
                className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-6 hover:shadow-lg hover:shadow-amber-400/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Platform Icon */}
                    <div className="flex-shrink-0">
                      {getPlatformIcon(content.platform_variations ? Object.keys(content.platform_variations)[0] : undefined)}
                    </div>

                    {/* Content Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-normal text-white group-hover:text-amber-400 transition-colors duration-300">
                          {content.topic || content.title}
                        </h3>
                        {getStatusBadge(content.status)}
                        {content.ai_model && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                            {content.ai_model}
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-400 text-sm font-normal mb-3 line-clamp-2">
                        {content.body}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-zinc-500 font-normal">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(content.created_at).toLocaleDateString("ko-KR")}
                        </span>
                        {content.brand && (
                          <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400">
                            {content.brand.name}
                          </span>
                        )}
                        {content.published_posts && content.published_posts.length > 0 && (
                          <span className="text-emerald-400">
                            {content.published_posts.length}개 플랫폼 발행됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => router.push(`/content/${content.id}`)}
                      className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 flex items-center justify-center transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 text-zinc-400 hover:text-amber-400" />
                    </button>
                    <button
                      onClick={() => router.push(`/content/${content.id}/edit`)}
                      className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 flex items-center justify-center transition-all duration-300"
                    >
                      <Edit className="w-4 h-4 text-zinc-400 hover:text-amber-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="w-9 h-9 bg-zinc-800 hover:bg-red-900/30 border border-zinc-700 hover:border-red-700 flex items-center justify-center transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
