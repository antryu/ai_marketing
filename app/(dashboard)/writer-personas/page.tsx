"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Plus, Edit, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useBrand } from "@/contexts/BrandContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

interface WriterPersona {
  id: string
  brand_id: string
  name: string
  description: string
  tone: string[]
  style_attributes: string[]
  writing_style: any
  vocabulary_preferences: any
  content_structure_preferences: any
  example_content: string
  do_list: string[]
  dont_list: string[]
  is_default: boolean
  created_at: string
}

export default function WriterPersonasPage() {
  const { selectedBrandId, brands } = useBrand()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]
  const [loading, setLoading] = useState(true)
  const [writerPersonas, setWriterPersonas] = useState<WriterPersona[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    brand_id: "",
    name: "",
    description: "",
    tone: [] as string[],
    style_attributes: [] as string[],
    writing_style: {} as any,
    vocabulary_preferences: {} as any,
    content_structure_preferences: {} as any,
    example_content: "",
    do_list: [] as string[],
    dont_list: [] as string[],
    is_default: false,
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

      // Load writer personas for selected brand only
      const { data: writerPersonasData } = await (supabase as any)
        .from("writer_personas")
        .select("*")
        .eq("brand_id", selectedBrandId)
        .order("created_at", { ascending: false })

      if (writerPersonasData) {
        setWriterPersonas(writerPersonasData)
      }

      // Set default brand_id for new writer persona
      if (!formData.brand_id) {
        setFormData(prev => ({ ...prev, brand_id: selectedBrandId }))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error(t("dataLoadError"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.brand_id) {
      toast.error(t("requiredFields"))
      return
    }

    try {
      const supabase = createClient()

      // Only include fields that exist in the database
      const saveData = {
        brand_id: formData.brand_id,
        name: formData.name,
        description: formData.description,
        tone: formData.tone,
        style_attributes: formData.style_attributes,
        example_content: formData.example_content,
        do_list: formData.do_list,
        dont_list: formData.dont_list,
        is_default: formData.is_default,
      }

      if (editingId) {
        // Update existing writer persona
        const { error } = await (supabase as any)
          .from("writer_personas")
          .update(saveData)
          .eq("id", editingId)

        if (error) throw error
        toast.success(t("voiceUpdated"))
      } else {
        // Create new writer persona
        const { error } = await (supabase as any)
          .from("writer_personas")
          .insert([saveData])

        if (error) throw error
        toast.success(t("voiceCreated"))
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error("Error saving writer persona:", error)
      toast.error(error.message || t("saveFailed"))
    }
  }

  const handleEdit = (writerPersona: WriterPersona) => {
    setFormData({
      brand_id: writerPersona.brand_id,
      name: writerPersona.name,
      description: writerPersona.description || "",
      tone: Array.isArray(writerPersona.tone) ? writerPersona.tone : [],
      style_attributes: Array.isArray(writerPersona.style_attributes) ? writerPersona.style_attributes : [],
      writing_style: writerPersona.writing_style || {},
      vocabulary_preferences: writerPersona.vocabulary_preferences || {},
      content_structure_preferences: writerPersona.content_structure_preferences || {},
      example_content: writerPersona.example_content || "",
      do_list: Array.isArray(writerPersona.do_list) ? writerPersona.do_list : [],
      dont_list: Array.isArray(writerPersona.dont_list) ? writerPersona.dont_list : [],
      is_default: writerPersona.is_default || false,
    })
    setEditingId(writerPersona.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteVoiceConfirm"))) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from("writer_personas")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success(t("voiceDeleted"))
      loadData()
    } catch (error: any) {
      console.error("Error deleting writer persona:", error)
      toast.error(error.message || t("deleteFailed"))
    }
  }

  const resetForm = () => {
    setFormData({
      brand_id: brands[0]?.id || "",
      name: "",
      description: "",
      tone: [],
      style_attributes: [],
      writing_style: {},
      vocabulary_preferences: {},
      content_structure_preferences: {},
      example_content: "",
      do_list: [],
      dont_list: [],
      is_default: false,
    })
  }

  const handleArrayInput = (field: keyof typeof formData, value: string) => {
    const items = value.split(",").map(item => item.trim()).filter(Boolean)
    setFormData({ ...formData, [field]: items })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400">{t("loadingText")}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Action Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              resetForm()
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-6 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("newVoice")}
          </button>
        </div>

        {/* Writer Persona List */}
        {!showForm && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {writerPersonas.map((persona) => (
              <div
                key={persona.id}
                className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-medium text-white">{persona.name}</h3>
                    {persona.is_default && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{t("defaultBadge")}</span>
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
                  {persona.tone && Array.isArray(persona.tone) && persona.tone.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">{t("toneLabel")}</span>
                      <span className="text-zinc-300">{persona.tone.join(", ")}</span>
                    </div>
                  )}
                  {persona.style_attributes && Array.isArray(persona.style_attributes) && persona.style_attributes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">{t("styleLabel")}</span>
                      <span className="text-zinc-300">{persona.style_attributes.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {writerPersonas.length === 0 && (
              <div className="col-span-full text-center py-16 border border-dashed border-zinc-700">
                <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">{t("noBrandVoices")}</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {t("createFirstVoice")}
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
                {editingId ? t("editVoice") : t("newBrandVoice")}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {t("cancel")}
              </button>
            </div>

            {/* Brand Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("brandSelect")} *
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
                {t("voiceName")} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("voiceNamePlaceholder")}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Tone */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("tone")}
              </label>
              <input
                type="text"
                defaultValue={formData.tone.join(", ")}
                onBlur={(e) => setFormData({ ...formData, tone: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder={t("tonePlaceholder")}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Style Attributes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("styleAttributes")}
              </label>
              <input
                type="text"
                defaultValue={formData.style_attributes.join(", ")}
                onBlur={(e) => setFormData({ ...formData, style_attributes: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                placeholder={t("styleAttributesPlaceholder")}
                className="w-full h-12 bg-zinc-900/50 border border-zinc-700 px-4 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Example Content */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-200 tracking-wide">
                {t("exampleContent")}
              </label>
              <textarea
                value={formData.example_content}
                onChange={(e) => setFormData({ ...formData, example_content: e.target.value })}
                placeholder={t("exampleContentPlaceholder")}
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Do List */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200 tracking-wide">
                  {t("doList")}
                </label>
                <textarea
                  defaultValue={formData.do_list.join(", ")}
                  onBlur={(e) => setFormData({ ...formData, do_list: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                  placeholder={t("doListPlaceholder")}
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Don't List */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200 tracking-wide">
                  {t("dontList")}
                </label>
                <textarea
                  defaultValue={formData.dont_list.join(", ")}
                  onBlur={(e) => setFormData({ ...formData, dont_list: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                  placeholder={t("dontListPlaceholder")}
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-white rounded focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Is Default */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-5 h-5 bg-zinc-900/50 border border-zinc-700 rounded focus:ring-amber-400 text-amber-400"
              />
              <label htmlFor="is_default" className="text-sm text-zinc-300">
                {t("setAsDefault")}
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-6 flex gap-4">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {t("save")}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-8 transition-all duration-300 border border-zinc-700 hover:border-zinc-600"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
