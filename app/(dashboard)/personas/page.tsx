"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Target, Plus, Edit, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useBrand } from "@/contexts/BrandContext"

interface Persona {
  id: string
  brand_id: string
  name: string
  description: string
  age_range: string
  gender: string
  location: string[]
  job_title: string[]
  industry: string[]
  company_size: string
  pain_points: string[]
  goals: string[]
  values: string[]
  platforms: string[]
  content_preferences: any
  confidence_score: number
  data_sources: string[]
  is_primary: boolean
  created_at: string
}

export default function PersonasPage() {
  const { selectedBrandId, brands } = useBrand()
  const [loading, setLoading] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    brand_id: "",
    name: "",
    description: "",
    age_range: "",
    gender: "",
    location: [] as string[],
    job_title: [] as string[],
    industry: [] as string[],
    company_size: "",
    pain_points: [] as string[],
    goals: [] as string[],
    values: [] as string[],
    platforms: [] as string[],
    is_primary: false,
  })

  useEffect(() => {
    loadData()
  }, [selectedBrandId])

  const loadData = async () => {
    if (!selectedBrandId) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Load personas for selected brand only
      const { data: personasData } = await supabase
        .from("personas")
        .select("*")
        .eq("brand_id", selectedBrandId)
        .order("created_at", { ascending: false })

      if (personasData) {
        setPersonas(personasData)
      }

      // Set default brand_id for new persona
      if (!formData.brand_id) {
        setFormData(prev => ({ ...prev, brand_id: selectedBrandId }))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("데이터 로딩 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.brand_id) {
      toast.error("필수 항목을 입력해주세요")
      return
    }

    try {
      const supabase = createClient()

      if (editingId) {
        // Update existing persona
        const { error } = await supabase
          .from("personas")
          .update(formData)
          .eq("id", editingId)

        if (error) throw error
        toast.success("페르소나가 업데이트되었습니다")
      } else {
        // Create new persona
        const { error } = await supabase
          .from("personas")
          .insert([formData])

        if (error) throw error
        toast.success("페르소나가 생성되었습니다")
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error("Error saving persona:", error)
      toast.error(error.message || "저장 실패")
    }
  }

  const handleEdit = (persona: Persona) => {
    setFormData({
      brand_id: persona.brand_id,
      name: persona.name,
      description: persona.description || "",
      age_range: persona.age_range || "",
      gender: persona.gender || "",
      location: persona.location || [],
      job_title: persona.job_title || [],
      industry: persona.industry || [],
      company_size: persona.company_size || "",
      pain_points: persona.pain_points || [],
      goals: persona.goals || [],
      values: persona.values || [],
      platforms: persona.platforms || [],
      is_primary: persona.is_primary || false,
    })
    setEditingId(persona.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("personas")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("페르소나가 삭제되었습니다")
      loadData()
    } catch (error: any) {
      console.error("Error deleting persona:", error)
      toast.error(error.message || "삭제 실패")
    }
  }

  const resetForm = () => {
    setFormData({
      brand_id: brands[0]?.id || "",
      name: "",
      description: "",
      age_range: "",
      gender: "",
      location: [],
      job_title: [],
      industry: [],
      company_size: "",
      pain_points: [],
      goals: [],
      values: [],
      platforms: [],
      is_primary: false,
    })
  }

  const handleArrayInput = (field: keyof typeof formData, value: string) => {
    // Keep the raw string value to allow typing commas
    // Split only when actually needed (on save)
    const items = value.split(",").map(item => item.trim())
    setFormData({ ...formData, [field]: items })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
                <Target className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-light text-white tracking-wide">타겟 고객</h1>
                <p className="text-zinc-400 mt-2">목표 고객층을 정의하고 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm()
                setEditingId(null)
                setShowForm(!showForm)
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-6 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              새 타겟 고객
            </button>
          </div>
          <div className="w-24 h-px bg-gradient-to-r from-amber-400 to-transparent"></div>
        </div>

        {/* Persona List */}
        {!showForm && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-medium text-white">{persona.name}</h3>
                    {persona.is_primary && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">주요</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(persona)}
                      className="text-zinc-400 hover:text-amber-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(persona.id)}
                      className="text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {persona.description && (
                  <p className="text-zinc-400 text-sm mb-4">{persona.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  {persona.age_range && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">연령대:</span>
                      <span className="text-zinc-300">{persona.age_range}</span>
                    </div>
                  )}
                  {persona.job_title && persona.job_title.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">직업:</span>
                      <span className="text-zinc-300">{persona.job_title.join(", ")}</span>
                    </div>
                  )}
                  {persona.platforms && persona.platforms.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">플랫폼:</span>
                      <span className="text-zinc-300">{persona.platforms.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {personas.length === 0 && (
              <div className="col-span-full text-center py-16 border border-dashed border-zinc-700">
                <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">아직 타겟 고객이 없습니다</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  첫 타겟 고객 만들기 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white">
                {editingId ? "타겟 고객 수정" : "새 타겟 고객"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                취소
              </button>
            </div>

            {/* Brand Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                브랜드 선택 *
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                고객 이름 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 바쁜 마케팅 매니저"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="타겟 고객에 대한 간단한 설명"
                rows={3}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Age Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200 tracking-wide">
                  연령대
                </label>
                <input
                  type="text"
                  value={formData.age_range}
                  onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  placeholder="예: 25-34"
                  className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Gender */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200 tracking-wide">
                  성별
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="all">전체</option>
                </select>
              </div>
            </div>

            {/* Job Title */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                직업 (쉼표로 구분)
              </label>
              <input
                type="text"
                defaultValue={formData.job_title.join(", ")}
                onBlur={(e) => setFormData({ ...formData, job_title: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder="예: 마케팅 매니저, CMO, 마케팅 담당자"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Industry */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                산업 (쉼표로 구분)
              </label>
              <input
                type="text"
                defaultValue={formData.industry.join(", ")}
                onBlur={(e) => setFormData({ ...formData, industry: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder="예: IT, 스타트업, 이커머스"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Pain Points */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                고민/문제점 (쉼표로 구분)
              </label>
              <textarea
                defaultValue={formData.pain_points.join(", ")}
                onBlur={(e) => setFormData({ ...formData, pain_points: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder="예: 시간 부족, 콘텐츠 제작 어려움, 성과 측정"
                rows={3}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Goals */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                목표 (쉼표로 구분)
              </label>
              <textarea
                defaultValue={formData.goals.join(", ")}
                onBlur={(e) => setFormData({ ...formData, goals: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder="예: 브랜드 인지도 향상, 리드 생성, 고객 참여 증대"
                rows={3}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Platforms */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                선호 플랫폼 (쉼표로 구분)
              </label>
              <input
                type="text"
                defaultValue={formData.platforms.join(", ")}
                onBlur={(e) => setFormData({ ...formData, platforms: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder="예: LinkedIn, Instagram, Blog"
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Is Primary */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="w-5 h-5 bg-zinc-900/50 border border-zinc-700 rounded focus:ring-amber-400 text-amber-400"
              />
              <label htmlFor="is_primary" className="text-sm text-zinc-300">
                주요 타겟 고객으로 설정
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-6 flex gap-4">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                저장
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-8 transition-all duration-300 border border-zinc-700 hover:border-zinc-600"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
