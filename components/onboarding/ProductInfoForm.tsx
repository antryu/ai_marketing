"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductInfoFormProps {
  onSubmit: (data: any) => Promise<void>
  loading: boolean
}

export function ProductInfoForm({ onSubmit, loading }: ProductInfoFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    product_type: "",
    target_market: [] as string[],
    brand_voice_tone: "professional",
    brand_voice_style: "friendly",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await onSubmit({
      name: formData.name,
      description: formData.description,
      product_type: formData.product_type,
      target_market: formData.target_market,
      brand_voice: {
        tone: formData.brand_voice_tone,
        style: formData.brand_voice_style,
      },
    })
  }

  const toggleMarket = (market: string) => {
    setFormData(prev => ({
      ...prev,
      target_market: prev.target_market.includes(market)
        ? prev.target_market.filter(m => m !== market)
        : [...prev.target_market, market]
    }))
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-white mb-3">제품 정보 입력</h2>
        <div className="w-12 h-px bg-gradient-to-r from-amber-400 to-transparent mb-4"></div>
        <p className="text-zinc-300 font-normal tracking-wide">
          제품에 대해 알려주시면 AI가 최적의 마케팅 전략을 찾아드립니다.
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">제품 이름 *</Label>
            <Input
              id="name"
              placeholder="예: MarketingAI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">제품 설명 *</Label>
            <Textarea
              id="description"
              placeholder="제품이 무엇을 하는지, 어떤 문제를 해결하는지 설명해주세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_type">제품 유형 *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value) => setFormData({ ...formData, product_type: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="제품 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b2b_saas">B2B SaaS</SelectItem>
                <SelectItem value="b2c_saas">B2C SaaS</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="education">교육</SelectItem>
                <SelectItem value="consulting">컨설팅</SelectItem>
                <SelectItem value="agency">에이전시</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>타겟 시장 *</Label>
            <div className="flex flex-wrap gap-2">
              {["korea", "usa", "japan", "global"].map((market) => (
                <Button
                  key={market}
                  type="button"
                  variant={formData.target_market.includes(market) ? "default" : "outline"}
                  onClick={() => toggleMarket(market)}
                  disabled={loading}
                >
                  {market === "korea" && "🇰🇷 한국"}
                  {market === "usa" && "🇺🇸 미국"}
                  {market === "japan" && "🇯🇵 일본"}
                  {market === "global" && "🌍 글로벌"}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_voice_tone">브랜드 톤</Label>
              <Select
                value={formData.brand_voice_tone}
                onValueChange={(value) => setFormData({ ...formData, brand_voice_tone: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">전문적인</SelectItem>
                  <SelectItem value="casual">캐주얼한</SelectItem>
                  <SelectItem value="friendly">친근한</SelectItem>
                  <SelectItem value="authoritative">권위있는</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_voice_style">브랜드 스타일</Label>
              <Select
                value={formData.brand_voice_style}
                onValueChange={(value) => setFormData({ ...formData, brand_voice_style: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">친절한</SelectItem>
                  <SelectItem value="data_driven">데이터 기반</SelectItem>
                  <SelectItem value="creative">창의적인</SelectItem>
                  <SelectItem value="minimalist">미니멀한</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "분석 중..." : "AI 분석 시작 🚀"}
          </Button>
        </form>
      </div>
    </div>
  )
}
