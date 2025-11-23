"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Sparkles, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function BulkGeneratePage() {
  const [productInfo, setProductInfo] = useState("")
  const [count, setCount] = useState(10)
  const [platforms, setPlatforms] = useState<string[]>(["threads", "linkedin", "x"])
  const [aiModel, setAiModel] = useState("qwen2.5:7b")
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const aiModels = [
    { id: "qwen2.5:7b", name: "⭐ Qwen 2.5 7B", description: "빠르고 정확한 범용 모델" },
    { id: "llama3.2:3b", name: "🦙 Llama 3.2 3B", description: "경량 고속 모델" },
    { id: "phi3:3.8b", name: "🔷 Phi-3 3.8B", description: "Microsoft의 소형 모델" },
    { id: "gemma2:2b", name: "💎 Gemma 2 2B", description: "Google의 초경량 모델" },
    { id: "deepseek-r1:7b", name: "🧠 DeepSeek R1 7B", description: "추론 특화 모델" },
  ]

  const handleBulkGenerate = async () => {
    if (!productInfo.trim()) {
      toast.error("제품 정보를 입력해주세요")
      return
    }

    if (count < 1 || count > 50) {
      toast.error("생성 개수는 1-50개 사이여야 합니다")
      return
    }

    setGenerating(true)
    setResults([])

    try {
      const response = await fetch("/api/content/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productInfo,
          count,
          platforms,
          aiModel,
        }),
      })

      if (!response.ok) throw new Error("생성 실패")

      const data = await response.json()
      setResults(data.contents || [])
      toast.success(`${data.contents.length}개의 콘텐츠가 생성되었습니다!`)
    } catch (error) {
      toast.error("콘텐츠 생성 중 오류가 발생했습니다")
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-12 text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent"></div>
          <div className="flex items-center gap-4 mb-6">
            <Zap className="w-10 h-10 text-amber-400" />
            <div>
              <h1 className="text-4xl font-light tracking-wide mb-2">일괄 콘텐츠 생성</h1>
              <p className="text-zinc-300 font-normal text-base tracking-wide">
                한 번에 여러 플랫폼용 콘텐츠를 자동으로 생성합니다
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 설정 카드 */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                생성 설정
              </CardTitle>
              <CardDescription>제품 정보와 생성 옵션을 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 제품 정보 */}
              <div className="space-y-2">
                <Label htmlFor="productInfo">제품/서비스 정보</Label>
                <Textarea
                  id="productInfo"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  placeholder="예: 마케팅 자동화 SaaS 플랫폼. Threads, LinkedIn, X에 동시 발행 가능. AI 기반 콘텐츠 최적화 기능 제공."
                  rows={6}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* 생성 개수 */}
              <div className="space-y-2">
                <Label htmlFor="count">생성 개수</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-400">최대 50개까지 생성 가능</p>
              </div>

              {/* AI 모델 선택 */}
              <div className="space-y-2">
                <Label htmlFor="aiModel">AI 모델 선택</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {aiModels.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-white">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-zinc-400">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-400">
                  선택한 모델로 모든 콘텐츠가 생성됩니다
                </p>
              </div>

              {/* 플랫폼 선택 */}
              <div className="space-y-2">
                <Label>타겟 플랫폼</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    {
                      id: "threads",
                      name: "Threads",
                      icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.815-3.21 1.815-4.065 0-1.138-.243-2.08-.722-2.804-.448-.677-1.089-1.204-1.905-1.568.654-.282 1.204-.7 1.633-1.244.512-.65.77-1.41.77-2.262 0-1.743-1.301-3.127-3.14-3.127-1.839 0-3.14 1.384-3.14 3.127 0 .396.069.772.203 1.118.134.346.33.659.582.932.252.273.555.5.901.676.346.176.73.282 1.143.315.587.047 1.143-.02 1.65-.198.506-.178.944-.459 1.302-.836.358-.377.626-.84.8-1.379.174-.54.243-1.138.243-1.785 0-1.138-.243-2.08-.722-2.804-.448-.677-1.089-1.204-1.905-1.568.654-.282 1.204-.7 1.633-1.244.512-.65.77-1.41.77-2.262 0-1.743-1.301-3.127-3.14-3.127-1.839 0-3.14 1.384-3.14 3.127 0 .396.069.772.203 1.118z"/>
                        </svg>
                      )
                    },
                    {
                      id: "linkedin",
                      name: "LinkedIn",
                      icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )
                    },
                    {
                      id: "x",
                      name: "X",
                      icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )
                    },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => {
                        setPlatforms((prev) =>
                          prev.includes(platform.id)
                            ? prev.filter((p) => p !== platform.id)
                            : [...prev, platform.id]
                        )
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded border transition-all ${
                        platforms.includes(platform.id)
                          ? "bg-amber-500 border-amber-400 text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {platform.icon} {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 생성 버튼 */}
              <Button
                onClick={handleBulkGenerate}
                disabled={generating}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    생성 중... {results.length}/{count}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    콘텐츠 생성 시작
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-400 text-center">
                예상 소요 시간: 약 {Math.ceil(count * 2)}초
              </p>
            </CardContent>
          </Card>

          {/* 결과 카드 */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                생성 결과
              </CardTitle>
              <CardDescription>생성된 콘텐츠 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-700 rounded">
                  <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">아직 생성된 콘텐츠가 없습니다</p>
                  <p className="text-xs text-zinc-500 mt-2">위에서 설정 후 생성 버튼을 눌러주세요</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {results.map((content, index) => (
                    <div
                      key={index}
                      className="bg-zinc-800 border border-zinc-700 p-4 rounded hover:border-amber-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          {content.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          {content.aiModel && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {content.aiModel}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {content.platforms?.map((platform: string) => (
                            <span
                              key={platform}
                              className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-3">{content.body || content.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
