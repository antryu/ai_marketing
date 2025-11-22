"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Link as LinkIcon, Users, Building2, Zap, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

const platforms = [
  {
    id: "thread",
    name: "Thread",
    description: "Meta의 텍스트 기반 소셜 플랫폼",
    icon: "🧵",
    color: "purple",
    features: ["한국 시장 1순위", "짧은 form 콘텐츠", "Instagram 연동"]
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "전문가 네트워킹 플랫폼",
    icon: "💼",
    color: "blue",
    features: ["미국 시장 1순위", "B2B 마케팅", "긴 form 콘텐츠"]
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "비주얼 중심 소셜 미디어",
    icon: "📷",
    color: "pink",
    features: ["이미지/영상 콘텐츠", "Reels", "Stories"]
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "실시간 대화 플랫폼",
    icon: "🐦",
    color: "sky",
    features: ["실시간 트렌드", "짧은 메시지", "스레드"]
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "영상 공유 플랫폼",
    icon: "📺",
    color: "red",
    features: ["Shorts", "긴 영상", "커뮤니티"]
  }
]

export default function SettingsPage() {
  const [connections, setConnections] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load first brand
    const { data: brands } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    if (brands && brands.length > 0) {
      setSelectedBrand(brands[0])

      // Load platform connections
      const { data: conns } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("brand_id", brands[0].id)

      setConnections(conns || [])
    }

    setLoading(false)
  }

  const isConnected = (platformId: string) => {
    return connections.some(c => c.platform === platformId && c.is_active)
  }

  const handleConnect = async (platformId: string) => {
    toast.info("OAuth 연동은 곧 추가됩니다!")
    // TODO: Implement OAuth flow
  }

  const handleDisconnect = async (platformId: string) => {
    if (!confirm("정말 연결을 해제하시겠습니까?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("platform_connections")
      .update({ is_active: false })
      .eq("brand_id", selectedBrand.id)
      .eq("platform", platformId)

    if (error) {
      toast.error("연결 해제 실패")
    } else {
      toast.success("연결이 해제되었습니다")
      loadData()
    }
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
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-wide text-white">설정</h1>
            <p className="text-zinc-300 font-normal text-base tracking-wide">
              제품 및 플랫폼 연결 관리
            </p>
          </div>
        </div>

        {/* Brand Info Section */}
        {selectedBrand && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-light text-white tracking-wide">제품 정보</h2>
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">제품명</p>
                <p className="text-white font-normal text-lg">{selectedBrand.name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">제품 유형</p>
                <p className="text-white font-normal text-lg">{selectedBrand.product_type || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-zinc-400 font-medium mb-2 tracking-wide uppercase">설명</p>
                <p className="text-zinc-300 font-normal">{selectedBrand.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Platform Connections Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-light text-white tracking-wide">플랫폼 연결</h2>
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
                    <div className="text-4xl">{platform.icon}</div>

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
                          연결 해제
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          size="sm"
                          className="w-full group/btn"
                        >
                          <Zap className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                          연결하기
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
              💡 <strong className="text-zinc-300">Tip:</strong> 플랫폼을 연결하면 콘텐츠를 자동으로 발행할 수 있습니다.
              각 플랫폼의 OAuth 인증이 필요합니다.
            </p>
          </div>
        </div>

        {/* Team Section (Placeholder) */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-light text-white tracking-wide">팀 관리</h2>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-8"></div>

          <div className="text-center py-12 border border-dashed border-zinc-700">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 font-normal mb-4">팀 협업 기능은 곧 추가됩니다</p>
            <p className="text-sm text-zinc-500 font-normal">
              팀원을 초대하고 역할을 관리할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
