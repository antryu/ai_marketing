"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Eye, Trash2, Zap } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function ContentPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const router = useRouter()
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
      .from("contents")
      .select(`
        *,
        brand:brands(name),
        published_posts(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      toast.error(t("contentLoadFailed"))
    } else {
      setContents(data || [])
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteContentConfirm"))) return

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("contents")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error(t("deleteFailed"))
    } else {
      toast.success(t("deleteSuccess"))
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
      draft: t("statusDraft"),
      scheduled: t("statusScheduled"),
      published: t("statusPublished"),
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
          <p className="text-zinc-300 font-normal">{t("loadingText")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-12">
      <div className="max-w-7xl mx-auto">
        {/* Content List */}
        {contents.length === 0 ? (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-16 text-center">
            <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h2 className="text-2xl font-light text-white mb-4">{t("noContent")}</h2>
            <p className="text-zinc-400 font-normal mb-8">
              {t("noContentDesc")}
            </p>
            <Button onClick={() => router.push("/content/create")} className="group">
              <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              {t("createContent")}
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

                      {/* SEO Keywords */}
                      {content.seo_keywords && content.seo_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {content.seo_keywords.slice(0, 5).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {content.seo_keywords.length > 5 && (
                            <span className="text-xs text-zinc-500">
                              +{content.seo_keywords.length - 5}
                            </span>
                          )}
                        </div>
                      )}

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
                            {content.published_posts.length}{t("platformsPublished")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => router.push(`/content/${content.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 rounded"
                      title={t("viewDetails")}
                    >
                      <Eye className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
                      <span className="text-sm font-medium text-zinc-400 group-hover:text-amber-400">{language === "ko" ? "미리보기" : "Preview"}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="w-9 h-9 bg-zinc-800 hover:bg-red-900/30 border border-zinc-700 hover:border-red-700 flex items-center justify-center transition-all duration-300"
                      title={t("deleteContent")}
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
