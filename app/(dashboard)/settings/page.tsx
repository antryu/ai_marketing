"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Link as LinkIcon, Users, Building2, Zap, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

const getPlatforms = (language: string) => [
  {
    id: "thread",
    name: "Threads",
    description: language === "ko" ? "Meta의 텍스트 기반 소셜 플랫폼" : "Meta's text-based social platform",
    iconType: "svg",
    color: "purple",
    features: language === "ko"
      ? ["한국 시장 1순위", "짧은 form 콘텐츠", "Instagram 연동"]
      : ["Korea Market #1", "Short-form Content", "Instagram Integration"]
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: language === "ko" ? "전문가 네트워킹 플랫폼" : "Professional networking platform",
    iconType: "svg",
    color: "blue",
    features: language === "ko"
      ? ["미국 시장 1순위", "B2B 마케팅", "긴 form 콘텐츠"]
      : ["US Market #1", "B2B Marketing", "Long-form Content"]
  },
  {
    id: "instagram",
    name: "Instagram",
    description: language === "ko" ? "비주얼 중심 소셜 미디어" : "Visual-focused social media",
    iconType: "svg",
    color: "pink",
    features: language === "ko"
      ? ["이미지/영상 콘텐츠", "Reels", "Stories"]
      : ["Image/Video Content", "Reels", "Stories"]
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: language === "ko" ? "실시간 대화 플랫폼" : "Real-time conversation platform",
    iconType: "svg",
    color: "sky",
    features: language === "ko"
      ? ["실시간 트렌드", "짧은 메시지", "스레드"]
      : ["Real-time Trends", "Short Messages", "Threads"]
  },
  {
    id: "youtube",
    name: "YouTube",
    description: language === "ko" ? "영상 공유 플랫폼" : "Video sharing platform",
    iconType: "svg",
    color: "red",
    features: language === "ko"
      ? ["Shorts", "긴 영상", "커뮤니티"]
      : ["Shorts", "Long Videos", "Community"]
  }
]

// Platform icons as SVG components
const PlatformIcon = ({ platformId, className = "w-10 h-10" }: { platformId: string, className?: string }) => {
  const icons: Record<string, React.ReactElement> = {
    thread: (
      <svg viewBox="0 0 192 192" className={className} fill="currentColor">
        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.144-10.41 21.339-10.41h.227c10.227.086 16.755 5.204 19.37 15.19-4.128-.926-8.505-1.468-13.123-1.6-21.054-.61-34.913 10.51-34.913 28.04 0 8.36 3.061 15.403 8.856 20.353 5.452 4.676 12.96 7.046 21.736 6.858 10.966-.233 19.15-4.278 24.303-12.039 2.99 6.76 8.816 11.24 17.194 13.295l4.474-14.715c-5.87-1.475-8.386-4.03-8.873-9.03Zm-29.53 11.233c-3.678 5.889-9.297 8.698-17.151 8.698-6.818 0-12.012-4.316-12.012-9.944 0-5.83 5.194-10.146 13.062-10.146 2.445 0 4.79.22 7.005.65 0 .084 0 .167.008.25.027 5.387.945 9.214 9.088 10.492Z"/>
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    twitter: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  }

  return icons[platformId] || null
}

export default function SettingsPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const [connections, setConnections] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load first brand
    const brandsResult = await (supabase as any)
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    const brands = brandsResult.data as any[]

    if (brands && brands.length > 0) {
      setSelectedBrand(brands[0])

      // Load platform connections
      const connsResult = await (supabase as any)
        .from("platform_connections")
        .select("*")
        .eq("brand_id", brands[0].id)

      const conns = connsResult.data as any[]
      setConnections(conns || [])
    }

    setLoading(false)
  }

  const isConnected = (platformId: string) => {
    return connections.some(c => c.platform === platformId && c.is_active)
  }

  const handleConnect = async (platformId: string) => {
    toast.info(language === "ko" ? "OAuth 연동은 곧 추가됩니다!" : "OAuth integration coming soon!")
    // TODO: Implement OAuth flow
  }

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(language === "ko" ? "정말 연결을 해제하시겠습니까?" : "Are you sure you want to disconnect?")) return

    const supabase = createClient()
    const result = await (supabase as any)
      .from("platform_connections")
      .update({ is_active: false })
      .eq("brand_id", selectedBrand.id)
      .eq("platform", platformId)

    const { error } = result

    if (error) {
      toast.error(language === "ko" ? "연결 해제 실패" : "Failed to disconnect")
    } else {
      toast.success(language === "ko" ? "연결이 해제되었습니다" : "Disconnected successfully")
      loadData()
    }
  }

  const platforms = getPlatforms(language)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 font-normal">{language === "ko" ? "로딩 중..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Brand Info Section */}
        {selectedBrand && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-light text-white tracking-wide">{language === "ko" ? "제품 정보" : "Brand Information"}</h2>
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">{language === "ko" ? "제품명" : "Brand Name"}</p>
                <p className="text-white font-normal text-lg">{selectedBrand.name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">{language === "ko" ? "제품 유형" : "Product Type"}</p>
                <p className="text-white font-normal text-lg">{selectedBrand.product_type || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">{language === "ko" ? "설명" : "Description"}</p>
                <p className="text-zinc-300 font-normal">{selectedBrand.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Platform Connections Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-light text-white tracking-wide">{language === "ko" ? "플랫폼 연결" : "Platform Connections"}</h2>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((platform) => {
              const connected = isConnected(platform.id)

              return (
                <div
                  key={platform.id}
                  className={`group relative border transition-all duration-300 p-6 ${
                    connected
                      ? "border-amber-400/50 bg-amber-900/10"
                      : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {/* Connected Badge */}
                  {connected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      p-3 rounded-lg transition-all duration-300
                      ${connected
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                      }
                    `}>
                      <PlatformIcon platformId={platform.id} className="w-8 h-8" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-normal text-white mb-1">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-zinc-400 font-normal mb-4">
                        {platform.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {platform.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 font-normal"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      {connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform.id)}
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {language === "ko" ? "연결 해제" : "Disconnect"}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          size="sm"
                          className="w-full group/btn"
                        >
                          <Zap className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                          {language === "ko" ? "연결하기" : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Info Banner */}
          <div className="mt-8 p-4 bg-zinc-800/50 border border-zinc-700">
            <p className="text-sm text-zinc-400 font-normal">
              💡 <strong className="text-zinc-300">Tip:</strong>{" "}
              {language === "ko"
                ? "플랫폼을 연결하면 콘텐츠를 자동으로 발행할 수 있습니다. 각 플랫폼의 OAuth 인증이 필요합니다."
                : "Connect platforms to automatically publish content. OAuth authentication is required for each platform."
              }
            </p>
          </div>
        </div>

        {/* Team Section (Placeholder) */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-light text-white tracking-wide">
              {language === "ko" ? "팀 관리" : "Team Management"}
            </h2>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="text-center py-12 border border-dashed border-zinc-700">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 font-normal mb-4">
              {language === "ko" ? "팀 협업 기능은 곧 추가됩니다" : "Team collaboration features coming soon"}
            </p>
            <p className="text-sm text-zinc-500 font-normal">
              {language === "ko"
                ? "팀원을 초대하고 역할을 관리할 수 있습니다"
                : "Invite team members and manage roles"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
