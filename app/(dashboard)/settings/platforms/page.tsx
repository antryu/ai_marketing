"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Link2, Unlink } from "lucide-react"
import { toast } from "sonner"

interface PlatformConnection {
  id: string
  platform: string
  platform_username: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

const PlatformIcon = ({ platformId, className = "w-8 h-8" }: { platformId: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    threads: (
      <svg viewBox="0 0 192 192" className={className} fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"></path>
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  }

  return icons[platformId] || null
}

export default function PlatformsSettingsPage() {
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)

  const platforms = [
    {
      id: "threads",
      name: "Threads",
      description: "Meta의 텍스트 기반 소셜 미디어",
      color: "purple",
      available: false, // OAuth 구현 후 true
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "비즈니스 전문 소셜 네트워크",
      color: "blue",
      available: false,
    },
    {
      id: "x",
      name: "X (Twitter)",
      description: "실시간 소셜 미디어 플랫폼",
      color: "gray",
      available: false,
    },
  ]

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      toast.error("연결 정보를 불러오는데 실패했습니다")
    } else {
      setConnections(data || [])
    }

    setLoading(false)
  }

  const handleConnect = async (platformId: string) => {
    if (!platforms.find((p) => p.id === platformId)?.available) {
      toast.info("곧 지원 예정입니다. OAuth 연동 개발 중입니다.")
      return
    }

    // TODO: OAuth 플로우 시작
    const redirectUrl = `${window.location.origin}/api/auth/${platformId}/callback`

    // 플랫폼별 OAuth URL
    const oauthUrls: Record<string, string> = {
      threads: `https://threads.net/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_THREADS_CLIENT_ID}&redirect_uri=${redirectUrl}&scope=threads_basic,threads_content_publish`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUrl}&scope=w_member_social`,
      x: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_X_CLIENT_ID}&redirect_uri=${redirectUrl}&scope=tweet.read tweet.write`,
    }

    const url = oauthUrls[platformId]
    if (url) {
      window.location.href = url
    }
  }

  const handleDisconnect = async (connectionId: string, platformName: string) => {
    if (!confirm(`${platformName} 연결을 해제하시겠습니까?`)) return

    const supabase = createClient()
    const { error } = await supabase
      .from("platform_connections")
      .delete()
      .eq("id", connectionId)

    if (error) {
      toast.error("연결 해제 실패")
    } else {
      toast.success("연결이 해제되었습니다")
      loadConnections()
    }
  }

  const isConnected = (platformId: string) => {
    return connections.find((c) => c.platform === platformId && c.is_active)
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
    <div className="p-12 text-white">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent"></div>
          <h1 className="text-4xl font-light tracking-wide mb-3">플랫폼 연동</h1>
          <p className="text-zinc-300 font-normal text-base tracking-wide">
            소셜 미디어 계정을 연결하여 자동으로 콘텐츠를 발행하세요
          </p>
        </div>

        {/* Platform Cards */}
        <div className="space-y-4">
          {platforms.map((platform) => {
            const connection = isConnected(platform.id)

            return (
              <Card key={platform.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${platform.color}-500/10 flex items-center justify-center`}>
                        <PlatformIcon platformId={platform.id} className="w-6 h-6 text-white" />
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-medium text-white">{platform.name}</h3>
                          {connection ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              연결됨
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              미연결
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{platform.description}</p>
                        {connection && connection.platform_username && (
                          <p className="text-xs text-zinc-500 mt-1">
                            계정: @{connection.platform_username}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {connection ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(connection.id, platform.name)}
                          className="bg-red-900/20 border-red-800 hover:bg-red-900/30 text-red-400"
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          연결 해제
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          disabled={!platform.available}
                          className={`${
                            platform.available
                              ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                              : "bg-zinc-800 hover:bg-zinc-700"
                          } text-white`}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          {platform.available ? "연결하기" : "곧 지원"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">연동 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-400">
            <div>
              <h4 className="font-medium text-white mb-2">플랫폼 연결이 필요한 이유</h4>
              <p>
                소셜 미디어 계정을 연결하면 AI Marketing에서 생성한 콘텐츠를 자동으로 각 플랫폼에
                발행할 수 있습니다. 수동으로 복사-붙여넣기 할 필요가 없어집니다.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">보안 및 권한</h4>
              <p>
                각 플랫폼의 공식 OAuth 인증을 사용하므로 안전합니다. AI Marketing은 콘텐츠 발행 권한만
                요청하며, 비밀번호는 절대 저장하지 않습니다. 언제든지 연결을 해제할 수 있습니다.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">개발 진행 상황</h4>
              <p>
                현재 OAuth 연동 기능을 개발 중입니다. 완료되면 각 플랫폼의 "연결하기" 버튼이 활성화됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
