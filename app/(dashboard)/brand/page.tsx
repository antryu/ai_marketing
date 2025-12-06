"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, Plus, Trash2, Sparkles, Globe, Loader2, Briefcase, Coffee, ShoppingBag, Laptop, Stethoscope, GraduationCap, Home, Scissors } from "lucide-react"
import { toast } from "sonner"
import { useBrand } from "@/contexts/BrandContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

interface Brand {
  id: string
  name: string
  description: string
  product_type: string
  target_market: string[]
  created_at: string
}

// Industry templates
const industryTemplates = [
  {
    id: "fitness",
    icon: "🏋️",
    labelKo: "피트니스/필라테스",
    labelEn: "Fitness/Pilates",
    product_type: "service",
    descriptionKo: "건강한 라이프스타일을 추구하는 고객을 위한 전문 피트니스 센터입니다. 1:1 맞춤 트레이닝과 그룹 수업을 제공하며, 체형 교정과 다이어트 프로그램을 운영합니다.",
    descriptionEn: "A professional fitness center for customers pursuing a healthy lifestyle. We offer personalized 1:1 training and group classes, with body correction and diet programs."
  },
  {
    id: "cafe",
    icon: "☕",
    labelKo: "카페/음식점",
    labelEn: "Cafe/Restaurant",
    product_type: "service",
    descriptionKo: "정성스럽게 준비한 음식과 음료로 고객에게 특별한 경험을 제공합니다. 프리미엄 원두와 신선한 재료만을 사용하며, 편안한 분위기에서 휴식을 취할 수 있습니다.",
    descriptionEn: "We provide special experiences with carefully prepared food and beverages. Using only premium beans and fresh ingredients, customers can relax in a comfortable atmosphere."
  },
  {
    id: "ecommerce",
    icon: "🛒",
    labelKo: "온라인 쇼핑몰",
    labelEn: "E-commerce",
    product_type: "ecommerce",
    descriptionKo: "엄선된 제품만을 판매하는 온라인 쇼핑몰입니다. 빠른 배송과 친절한 고객 서비스로 만족스러운 쇼핑 경험을 제공합니다. 품질 보증과 쉬운 반품 정책을 운영합니다.",
    descriptionEn: "An online shopping mall selling only carefully selected products. We provide satisfying shopping experiences with fast delivery and friendly customer service."
  },
  {
    id: "it",
    icon: "💻",
    labelKo: "IT/소프트웨어",
    labelEn: "IT/Software",
    product_type: "b2b_saas",
    descriptionKo: "기업의 디지털 전환을 돕는 IT 솔루션을 제공합니다. 클라우드 기반 서비스와 맞춤형 소프트웨어 개발로 업무 효율성을 높이고 비용을 절감합니다.",
    descriptionEn: "We provide IT solutions to help businesses with digital transformation. Cloud-based services and custom software development improve work efficiency and reduce costs."
  },
  {
    id: "medical",
    icon: "🏥",
    labelKo: "병원/의원",
    labelEn: "Medical/Clinic",
    product_type: "service",
    descriptionKo: "환자 중심의 의료 서비스를 제공하는 전문 의료기관입니다. 최신 의료 장비와 전문 의료진이 정확한 진단과 치료를 제공합니다. 예약제로 대기 시간을 최소화합니다.",
    descriptionEn: "A professional medical institution providing patient-centered healthcare. Latest medical equipment and expert medical staff provide accurate diagnosis and treatment."
  },
  {
    id: "education",
    icon: "📚",
    labelKo: "교육/학원",
    labelEn: "Education/Academy",
    product_type: "education",
    descriptionKo: "학생 개개인의 잠재력을 이끌어내는 맞춤형 교육을 제공합니다. 전문 강사진과 체계적인 커리큘럼으로 목표 달성을 지원합니다. 1:1 상담과 학습 관리를 제공합니다.",
    descriptionEn: "We provide customized education that brings out each student's potential. Expert instructors and systematic curriculum support goal achievement."
  },
  {
    id: "realestate",
    icon: "🏠",
    labelKo: "부동산",
    labelEn: "Real Estate",
    product_type: "service",
    descriptionKo: "고객의 부동산 니즈에 맞는 최적의 솔루션을 제공합니다. 매매, 임대, 투자 상담까지 전문적인 서비스로 성공적인 부동산 거래를 지원합니다.",
    descriptionEn: "We provide optimal solutions for customers' real estate needs. From buying, renting, to investment consulting, we support successful real estate transactions."
  },
  {
    id: "beauty",
    icon: "✨",
    labelKo: "뷰티/미용",
    labelEn: "Beauty/Salon",
    product_type: "service",
    descriptionKo: "고객의 아름다움을 완성하는 프리미엄 뷰티 서비스를 제공합니다. 트렌드를 반영한 스타일링과 전문적인 케어로 자신감을 높여드립니다.",
    descriptionEn: "We provide premium beauty services to complete your beauty. Trendy styling and professional care boost your confidence."
  }
]

export default function BrandPage() {
  const { selectedBrandId, refreshBrands, setSelectedBrandId } = useBrand()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const [loading, setLoading] = useState(true)
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [showInputHelper, setShowInputHelper] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [analyzingUrl, setAnalyzingUrl] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    product_type: "",
    target_market: [] as string[],
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
      const { data } = await (supabase as any)
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
        })
      }
    } catch (error) {
      console.error("Error loading brand:", error)
      toast.error(t("dataLoadError"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error(t("brandNameRequired"))
      return
    }

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error(t("loginRequired"))
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

        toast.success(t("brandCreated"))

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
        toast.success(t("brandUpdated"))
      }

      await refreshBrands()
      loadCurrentBrand()
    } catch (error: any) {
      console.error("Error saving brand:", error)
      toast.error(error.message || t("saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!currentBrand) return
    if (!confirm(t("deleteConfirm"))) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from("brands")
        .delete()
        .eq("id", currentBrand.id)

      if (error) throw error
      toast.success(t("brandDeleted"))

      await refreshBrands()
      // After deletion, the BrandContext will auto-select the first available brand
    } catch (error: any) {
      console.error("Error deleting brand:", error)
      toast.error(error.message || t("deleteFailed"))
    }
  }

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setShowInputHelper(true)
    setFormData({
      name: "",
      description: "",
      product_type: "",
      target_market: [],
    })
  }

  const handleCancelCreate = () => {
    setIsCreatingNew(false)
    setShowInputHelper(false)
    if (currentBrand) {
      setFormData({
        name: currentBrand.name,
        description: currentBrand.description || "",
        product_type: currentBrand.product_type || "",
        target_market: currentBrand.target_market || [],
      })
    }
  }

  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) {
      toast.error(language === "ko" ? "URL을 입력해주세요" : "Please enter a URL")
      return
    }

    setAnalyzingUrl(true)
    try {
      const res = await fetch("/api/brands/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      })

      const data = await res.json()

      if (data.success) {
        setFormData({
          ...formData,
          name: data.data.name || formData.name,
          description: data.data.description || formData.description,
          product_type: data.data.product_type || formData.product_type,
        })
        setShowInputHelper(false)
        toast.success(language === "ko" ? "웹사이트 정보를 분석했습니다!" : "Website analyzed successfully!")
      } else {
        toast.error(data.error || (language === "ko" ? "분석 실패" : "Analysis failed"))
      }
    } catch (error) {
      console.error("URL analysis error:", error)
      toast.error(language === "ko" ? "웹사이트 분석에 실패했습니다" : "Failed to analyze website")
    } finally {
      setAnalyzingUrl(false)
    }
  }

  const handleSelectTemplate = (template: typeof industryTemplates[0]) => {
    setFormData({
      ...formData,
      description: language === "ko" ? template.descriptionKo : template.descriptionEn,
      product_type: template.product_type,
    })
    setShowInputHelper(false)
    toast.success(language === "ko" ? "템플릿이 적용되었습니다. 브랜드명을 입력해주세요!" : "Template applied. Please enter your brand name!")
  }

  const handleDirectInput = () => {
    setShowInputHelper(false)
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
        <div className="text-zinc-400">{t("loadingText")}</div>
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
            <h2 className="text-2xl font-light text-white mb-2">{t("noBrands")}</h2>
            <p className="text-zinc-400 mb-6">{t("createFirstBrand")}</p>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("createFirstBrandButton")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="mb-6 flex justify-end gap-3">
          {!isCreatingNew && (
            <>
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-6 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t("newBrand")}
              </button>
              <button
                onClick={handleDelete}
                className="bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 font-medium py-3 px-6 transition-all duration-300 border border-zinc-700 hover:border-red-500/50 tracking-wide flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t("deleteBrand")}
              </button>
            </>
          )}
        </div>

        {/* Input Helper - Show when creating new brand */}
        {isCreatingNew && showInputHelper && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 mb-6 space-y-6">
            <h3 className="text-lg font-medium text-white">
              {language === "ko" ? "브랜드 정보 입력 방법 선택" : "Choose how to enter brand info"}
            </h3>

            {/* URL Auto-fill */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Globe className="w-5 h-5" />
                <span className="font-medium">
                  {language === "ko" ? "🔗 웹사이트로 자동 입력 (추천)" : "🔗 Auto-fill from website (Recommended)"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeUrl()}
                />
                <button
                  onClick={handleAnalyzeUrl}
                  disabled={analyzingUrl}
                  className="px-6 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {analyzingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === "ko" ? "분석중..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {language === "ko" ? "AI 분석" : "AI Analyze"}
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                {language === "ko"
                  ? "회사 홈페이지 URL을 입력하면 AI가 자동으로 브랜드 정보를 분석합니다"
                  : "Enter your company website URL and AI will automatically analyze brand information"
                }
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-700"></div>
              <span className="text-zinc-500 text-sm">{language === "ko" ? "또는" : "or"}</span>
              <div className="flex-1 h-px bg-zinc-700"></div>
            </div>

            {/* Industry Templates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">
                  {language === "ko" ? "📋 업종 템플릿으로 시작" : "📋 Start with industry template"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {industryTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="p-3 bg-zinc-800 border border-zinc-700 rounded hover:border-amber-400/50 hover:bg-zinc-700/50 transition-all text-left group"
                  >
                    <span className="text-2xl mb-1 block">{template.icon}</span>
                    <span className="text-sm text-zinc-300 group-hover:text-white">
                      {language === "ko" ? template.labelKo : template.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-700"></div>
              <span className="text-zinc-500 text-sm">{language === "ko" ? "또는" : "or"}</span>
              <div className="flex-1 h-px bg-zinc-700"></div>
            </div>

            {/* Direct Input */}
            <button
              onClick={handleDirectInput}
              className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-lg">✏️</span>
                <span className="font-medium">
                  {language === "ko" ? "직접 입력하기" : "Enter manually"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-7">
                {language === "ko"
                  ? "브랜드 정보를 직접 작성합니다"
                  : "Write brand information yourself"
                }
              </p>
            </button>
          </div>
        )}

        {/* Form */}
        <div className={`bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 space-y-6 ${isCreatingNew && showInputHelper ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* Brand Name */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("brandName")} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("brandNamePlaceholder")}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("productDescription")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === "ko"
                  ? "예: 30-40대 직장인을 위한 프리미엄 필라테스 스튜디오입니다. 1:1 맞춤 수업과 체형 교정 프로그램을 제공하며, 바쁜 일상 속 건강한 휴식을 선사합니다."
                  : "Example: A premium Pilates studio for professionals in their 30s-40s. We offer personalized 1:1 classes and body correction programs, providing healthy relaxation in busy daily life."
                }
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
              <p className="text-xs text-zinc-500">
                {language === "ko"
                  ? "💡 팁: 무엇을 제공하는지, 누구를 위한 것인지, 어떤 가치가 있는지 포함하면 좋습니다"
                  : "💡 Tip: Include what you offer, who it's for, and what value it provides"
                }
              </p>
            </div>

            {/* Product Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("productType")}
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              >
                <option value="">{t("selectType")}</option>
                <option value="product">{t("physicalProduct")}</option>
                <option value="service">{t("service")}</option>
                <option value="b2b_saas">B2B SaaS</option>
                <option value="b2c_saas">B2C SaaS</option>
                <option value="ecommerce">{language === "en" ? "E-commerce" : "이커머스"}</option>
                <option value="education">{language === "en" ? "Education" : "교육"}</option>
                <option value="consulting">{language === "en" ? "Consulting" : "컨설팅"}</option>
                <option value="personal_brand">{language === "en" ? "Personal Brand" : "개인 브랜드"}</option>
                <option value="company">{language === "en" ? "Company/Enterprise" : "회사/기업"}</option>
                <option value="other">{language === "en" ? "Other" : "기타"}</option>
              </select>
            </div>

          {/* Save Button */}
          <div className="pt-6 flex gap-4">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isCreatingNew ? t("createBrand") : t("save")}
            </button>
            {isCreatingNew && (
              <button
                onClick={handleCancelCreate}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-8 transition-all duration-300 border border-zinc-700 hover:border-zinc-600 tracking-wide"
              >
                {t("cancel")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
