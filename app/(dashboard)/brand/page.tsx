"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, Plus, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useBrand } from "@/contexts/BrandContext"

interface Brand {
  id: string
  name: string
  description: string
  product_type: string
  target_market: string[]
  brand_voice: {
    tone: string
    style: string
    values: string[]
  }
  created_at: string
}

export default function BrandPage() {
  const { selectedBrandId, refreshBrands, setSelectedBrandId } = useBrand()
  const [loading, setLoading] = useState(true)
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    product_type: "",
    target_market: [] as string[],
    brand_voice: {
      tone: "",
      style: "",
      values: [] as string[],
    },
  })

  useEffect(() => {
    loadCurrentBrand()
  }, [selectedBrandId])

  const loadCurrentBrand = async () => {
    if (!selectedBrandId) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("id", selectedBrandId)
        .single()

      if (data) {
        const brand = data as Brand
        setCurrentBrand(brand)
        setFormData({
          name: brand.name,
          description: brand.description || "",
          product_type: brand.product_type || "",
          target_market: brand.target_market || [],
          brand_voice: brand.brand_voice || { tone: "", style: "", values: [] },
        })
      }
    } catch (error) {
      console.error("Error loading brand:", error)
      toast.error("데이터 로딩 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("브랜드/제품명을 입력해주세요")
      return
    }

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error("로그인이 필요합니다")
        return
      }

      if (isCreatingNew) {
        // Create new brand
        const { error } = await (supabase as any)
          .from("brands")
          .insert([{
            ...formData,
            user_id: session.user.id
          }])

        if (error) throw error

        // Get the newly created brand
        const { data: newBrands } = await (supabase as any)
          .from("brands")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        toast.success("브랜드가 생성되었습니다")

        // Set as selected brand and exit create mode
        if (newBrands && newBrands.length > 0) {
          setSelectedBrandId(newBrands[0].id)
          setIsCreatingNew(false)
        }
      } else if (selectedBrandId) {
        // Update existing brand
        const { error } = await (supabase as any)
          .from("brands")
          .update(formData)
          .eq("id", selectedBrandId)

        if (error) throw error
        toast.success("브랜드 정보가 업데이트되었습니다")
      }

      await refreshBrands()
      loadCurrentBrand()
    } catch (error: any) {
      console.error("Error saving brand:", error)
      toast.error(error.message || "저장 실패")
    }
  }

  const handleDelete = async () => {
    if (!currentBrand) return
    if (!confirm("정말 삭제하시겠습니까? 연결된 모든 데이터가 삭제될 수 있습니다.")) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from("brands")
        .delete()
        .eq("id", currentBrand.id)

      if (error) throw error
      toast.success("브랜드가 삭제되었습니다")

      await refreshBrands()
      // After deletion, the BrandContext will auto-select the first available brand
    } catch (error: any) {
      console.error("Error deleting brand:", error)
      toast.error(error.message || "삭제 실패")
    }
  }

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setFormData({
      name: "",
      description: "",
      product_type: "",
      target_market: [],
      brand_voice: {
        tone: "",
        style: "",
        values: [],
      },
    })
  }

  const handleCancelCreate = () => {
    setIsCreatingNew(false)
    if (currentBrand) {
      setFormData({
        name: currentBrand.name,
        description: currentBrand.description || "",
        product_type: currentBrand.product_type || "",
        target_market: currentBrand.target_market || [],
        brand_voice: currentBrand.brand_voice || { tone: "", style: "", values: [] },
      })
    }
  }

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      product: "제품",
      service: "서비스",
      b2b_saas: "B2B SaaS",
      b2c_saas: "B2C SaaS",
      ecommerce: "이커머스",
      education: "교육",
      consulting: "컨설팅",
      personal_brand: "개인 브랜드",
      company: "회사/기업",
      other: "기타",
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400">로딩 중...</div>
      </div>
    )
  }

  // Show empty state if no brand exists and not creating new
  if (!currentBrand && !isCreatingNew) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 border border-dashed border-zinc-700">
            <Building2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-light text-white mb-2">브랜드가 없습니다</h2>
            <p className="text-zinc-400 mb-6">첫 브랜드를 만들어 시작하세요</p>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              첫 브랜드 만들기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-light text-white tracking-wide">
                  {isCreatingNew ? "새 브랜드" : "브랜드 설정"}
                </h1>
                <p className="text-zinc-400 mt-2">
                  {isCreatingNew
                    ? "새 브랜드 정보를 입력하세요"
                    : "현재 선택된 브랜드 정보를 관리하세요"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {!isCreatingNew && (
                <>
                  <button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-6 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    새 브랜드
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 font-medium py-3 px-6 transition-all duration-300 border border-zinc-700 hover:border-red-500/50 tracking-wide flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="w-24 h-px bg-gradient-to-r from-amber-400 to-transparent"></div>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 space-y-6">

            {/* Brand Name */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                브랜드/제품명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 테크스타트업"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                제품/서비스 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="제품이나 서비스에 대해 자세히 설명해주세요"
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Product Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                유형
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              >
                <option value="">선택하세요</option>
                <option value="product">제품 (Physical Product)</option>
                <option value="service">서비스 (Service)</option>
                <option value="b2b_saas">B2B SaaS</option>
                <option value="b2c_saas">B2C SaaS</option>
                <option value="ecommerce">이커머스</option>
                <option value="education">교육</option>
                <option value="consulting">컨설팅</option>
                <option value="personal_brand">개인 브랜드</option>
                <option value="company">회사/기업</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* Brand Voice - Tone */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                브랜드 톤
              </label>
              <input
                type="text"
                value={formData.brand_voice.tone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brand_voice: { ...formData.brand_voice, tone: e.target.value },
                  })
                }
                placeholder="예: 전문적이면서도 친근한"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Brand Voice - Style */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                브랜드 스타일
              </label>
              <input
                type="text"
                value={formData.brand_voice.style}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brand_voice: { ...formData.brand_voice, style: e.target.value },
                  })
                }
                placeholder="예: 간결하고 명확한"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

          {/* Save Button */}
          <div className="pt-6 flex gap-4">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isCreatingNew ? "브랜드 생성" : "저장"}
            </button>
            {isCreatingNew && (
              <button
                onClick={handleCancelCreate}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-8 transition-all duration-300 border border-zinc-700 hover:border-zinc-600 tracking-wide"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
