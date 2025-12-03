"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"

interface PlatformVariation {
  text: string
  hashtags?: string[]
  tone?: string
  length?: string
}

interface PlatformPreviewProps {
  contentId: string
  variations: Record<string, PlatformVariation>
  language?: string
  seoKeywords?: string[]
}

const PlatformIcon = ({ platformId, className = "w-6 h-6" }: { platformId: string; className?: string }) => {
  const icons: Record<string, React.ReactElement> = {
    thread: (
      <svg viewBox="0 0 192 192" className={className} fill="currentColor">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"></path>
      </svg>
    ),
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
    twitter: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    naver: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
      </svg>
    ),
    tistory: (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M0 3a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm9 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM0 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm9-9a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm9 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm0 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm0 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>
      </svg>
    ),
  }

  return icons[platformId] || null
}

const getPlatformLabel = (platformId: string): string => {
  const labels: Record<string, string> = {
    thread: "Threads",
    threads: "Threads",
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    x: "X.com",
    instagram: "Instagram",
    naver: "네이버 블로그",
    tistory: "티스토리",
  }
  return labels[platformId] || platformId
}

export function PlatformPreview({ contentId, variations, language = "ko", seoKeywords = [] }: PlatformPreviewProps) {
  // 레거시 데이터 처리: "all" 키를 "naver" 키로 변환
  const processedVariations = (() => {
    if (variations.all && !variations.naver) {
      console.log("⚠️ 레거시 'all' 키 감지 - naver로 변환합니다")
      return {
        ...variations,
        naver: variations.all
      }
    }
    return variations
  })()

  const [platformVariations, setPlatformVariations] = useState(processedVariations)
  const [loadingPlatforms, setLoadingPlatforms] = useState<Record<string, boolean>>({})

  // 디버깅: variations 데이터 확인
  console.log("🔍 PlatformPreview variations:", processedVariations)
  console.log("🔍 Variations keys:", Object.keys(processedVariations))

  // All available platforms
  const allPlatforms = ['thread', 'linkedin', 'twitter', 'instagram', 'naver', 'tistory']

  const handlePlatformClick = async (platform: string) => {
    // 이미 해당 플랫폼 콘텐츠가 있으면 스킵
    if (platformVariations[platform]) {
      return
    }

    setLoadingPlatforms(prev => ({ ...prev, [platform]: true }))

    try {
      const response = await fetch('/api/content/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          targetPlatform: platform,
          language
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '변환 실패')
      }

      // Update local state with transformed content
      setPlatformVariations(prev => ({
        ...prev,
        [platform]: {
          text: data.text,
          tone: platformVariations.naver?.tone || 'professional',
          length: platformVariations.naver?.length || 'medium'
        }
      }))

      toast.success(`${getPlatformLabel(platform)} 콘텐츠 생성 완료`)

    } catch (error: any) {
      console.error('Transform error:', error)
      toast.error(error.message || '콘텐츠 변환 실패')
    } finally {
      setLoadingPlatforms(prev => ({ ...prev, [platform]: false }))
    }
  }

  // 제일 긴 콘텐츠를 가진 플랫폼을 기본으로 선택 (네이버)
  const defaultPlatform = 'naver'

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg">플랫폼별 미리보기</CardTitle>
        <p className="text-xs text-zinc-500 mt-2">
          💡 네이버 블로그 형식으로 생성되었습니다. 다른 플랫폼 탭을 클릭하면 해당 플랫폼에 최적화된 콘텐츠가 자동 생성됩니다.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultPlatform} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-zinc-800/50 gap-2 p-2 rounded-lg h-auto border border-zinc-700">
            {allPlatforms.map((platform) => (
              <TabsTrigger
                key={platform}
                value={platform}
                onClick={() => handlePlatformClick(platform)}
                disabled={loadingPlatforms[platform]}
                className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-md bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 disabled:opacity-50 transition-all border-0 shadow-none"
              >
                {loadingPlatforms[platform] ? (
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlatformIcon platformId={platform} className="w-5 h-5" />
                )}
                <span className="text-xs font-medium whitespace-nowrap">{getPlatformLabel(platform)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {allPlatforms.map((platform) => {
            const variation = platformVariations[platform]
            const isLoading = loadingPlatforms[platform]

            return (
              <TabsContent key={platform} value={platform} className="mt-6">
                {isLoading ? (
                  <div className="bg-zinc-800 rounded-lg p-12 border border-zinc-700 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400">{getPlatformLabel(platform)} 콘텐츠 생성 중...</p>
                  </div>
                ) : !variation ? (
                  <div className="bg-zinc-800 rounded-lg p-12 border border-zinc-700 flex flex-col items-center justify-center gap-4">
                    <p className="text-zinc-400">이 탭을 클릭하면 {getPlatformLabel(platform)} 콘텐츠가 생성됩니다</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700 overflow-hidden">
                      {/* 블로그 플랫폼과 SNS 플랫폼을 다르게 렌더링 */}
                      {platform === 'naver' || platform === 'tistory' ? (
                        // 블로그 스타일 프리뷰
                        <div className="bg-white text-black p-8 rounded">
                          <div className="mb-6 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                B
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">Your Blog</div>
                                <div className="text-sm text-gray-500">
                                  {platform === 'naver' ? '네이버 블로그' : '티스토리'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="prose prose-lg max-w-none">
                            <ReactMarkdown>{variation.text}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        // SNS 스타일 프리뷰
                        <>
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`${platform === 'linkedin' ? 'w-12 h-12 rounded' : 'w-10 h-10 rounded-full'} bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold`}>
                              {platform === 'linkedin' ? 'Y' : 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white mb-1">Your Brand</div>
                              <div className="text-sm text-zinc-400">
                                {platform === 'linkedin' ? '팔로워 1,234명' : '@yourbrand'}
                              </div>
                              {platform === 'linkedin' && (
                                <div className="text-xs text-zinc-500">방금</div>
                              )}
                            </div>
                          </div>
                          <div className="text-white mb-4 prose prose-invert prose-sm max-w-none break-words overflow-wrap-anywhere">
                            <ReactMarkdown>{variation.text}</ReactMarkdown>
                          </div>
                        </>
                      )}
                      {variation.hashtags && variation.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {variation.hashtags.map((tag, i) => (
                            <span key={i} className="text-blue-400 text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* SNS 플랫폼만 인터랙션 버튼 표시 */}
                      {platform !== 'naver' && platform !== 'tistory' && (
                        <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-6 text-zinc-400 text-sm">
                          {platform === 'linkedin' ? (
                            <>
                              <span>👍 추천</span>
                              <span>💬 댓글</span>
                              <span>🔁 다시 게시</span>
                              <span>📤 보내기</span>
                            </>
                          ) : platform === 'twitter' || platform === 'x' ? (
                            <div className="flex justify-between w-full">
                              <span>💬</span>
                              <span>🔁</span>
                              <span>♥</span>
                              <span>📊</span>
                              <span>🔖</span>
                              <span>📤</span>
                            </div>
                          ) : (
                            <>
                              <span>♥ 좋아요</span>
                              <span>💬 댓글</span>
                              <span>🔁 공유</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* SEO Keywords at bottom */}
                      {seoKeywords && seoKeywords.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-zinc-400">🏷️ SEO 키워드</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {seoKeywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-xs text-zinc-500">
                      <div className="flex items-center justify-between">
                        <span>문자 수: {variation.text.length}</span>
                        <span className="text-amber-400">✓ {getPlatformLabel(platform)} 최적화 완료</span>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
