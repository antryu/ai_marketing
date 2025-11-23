"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlatformVariation {
  text: string
  hashtags: string[]
}

interface PlatformPreviewProps {
  variations: {
    threads?: PlatformVariation
    linkedin?: PlatformVariation
    x?: PlatformVariation
  }
}

const PlatformIcon = ({ platformId, className = "w-6 h-6" }: { platformId: string; className?: string }) => {
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

export function PlatformPreview({ variations }: PlatformPreviewProps) {
  const platforms = Object.keys(variations).filter((key) => variations[key as keyof typeof variations])

  if (platforms.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-8 text-center text-zinc-400">
          플랫폼별 콘텐츠가 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg">플랫폼별 미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={platforms[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            {platforms.includes("threads") && (
              <TabsTrigger value="threads" className="flex items-center gap-2">
                <PlatformIcon platformId="threads" className="w-4 h-4" />
                Threads
              </TabsTrigger>
            )}
            {platforms.includes("linkedin") && (
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <PlatformIcon platformId="linkedin" className="w-4 h-4" />
                LinkedIn
              </TabsTrigger>
            )}
            {platforms.includes("x") && (
              <TabsTrigger value="x" className="flex items-center gap-2">
                <PlatformIcon platformId="x" className="w-4 h-4" />
                X.com
              </TabsTrigger>
            )}
          </TabsList>

          {platforms.includes("threads") && variations.threads && (
            <TabsContent value="threads" className="mt-4">
              <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">Your Brand</div>
                    <div className="text-sm text-zinc-400">@yourbrand</div>
                  </div>
                </div>
                <div className="text-white mb-4 whitespace-pre-wrap">{variations.threads.text}</div>
                <div className="flex flex-wrap gap-2">
                  {variations.threads.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-400 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-6 text-zinc-400 text-sm">
                  <span>♥ 좋아요</span>
                  <span>💬 댓글</span>
                  <span>🔁 공유</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                <div className="flex items-center justify-between">
                  <span>문자 수: {variations.threads.text.length}/500</span>
                  <span className="text-amber-400">✓ Threads 최적화 완료</span>
                </div>
              </div>
            </TabsContent>
          )}

          {platforms.includes("linkedin") && variations.linkedin && (
            <TabsContent value="linkedin" className="mt-4">
              <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg">
                    Y
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">Your Company</div>
                    <div className="text-xs text-zinc-400">팔로워 1,234명</div>
                    <div className="text-xs text-zinc-500">방금</div>
                  </div>
                </div>
                <div className="text-white mb-4 whitespace-pre-wrap leading-relaxed">{variations.linkedin.text}</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {variations.linkedin.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-500 text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-6 text-zinc-400 text-sm">
                  <span>👍 추천</span>
                  <span>💬 댓글</span>
                  <span>🔁 다시 게시</span>
                  <span>📤 보내기</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                <div className="flex items-center justify-between">
                  <span>문자 수: {variations.linkedin.text.length}/3000</span>
                  <span className="text-amber-400">✓ LinkedIn 최적화 완료</span>
                </div>
              </div>
            </TabsContent>
          )}

          {platforms.includes("x") && variations.x && (
            <TabsContent value="x" className="mt-4">
              <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                    X
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Your Brand</span>
                      <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-sm text-zinc-400">@yourbrand · 방금</div>
                  </div>
                </div>
                <div className="text-white mb-4 whitespace-pre-wrap">{variations.x.text}</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {variations.x.hashtags.map((tag, i) => (
                    <span key={i} className="text-blue-400 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between text-zinc-400">
                  <span>💬</span>
                  <span>🔁</span>
                  <span>♥</span>
                  <span>📊</span>
                  <span>🔖</span>
                  <span>📤</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                <div className="flex items-center justify-between">
                  <span>문자 수: {variations.x.text.length}/280</span>
                  <span className="text-amber-400">✓ X.com 최적화 완료</span>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
