'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Star, Edit2, Check, X } from 'lucide-react'
import { WritingAnalyzer } from '@/components/writer-persona/WritingAnalyzer'
import { PersonaTemplateGallery } from '@/components/writer-persona/PersonaTemplateGallery'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations, TranslationKey } from '@/lib/translations'

interface WriterPersona {
  id: string
  name: string
  description: string
  writing_style: string
  tone: string
  preferred_structure: {
    opening: string
    body: string
    closing: string
  }
  expertise_areas: string[]
  unique_perspective: string
  language_preferences: {
    emoji_usage: string
    sentence_length: string
    paragraph_length: string
    technical_terms: boolean
    use_analogies: boolean
    use_data_statistics: boolean
  }
  signature_phrases: string[]
  catchphrase: string
  is_default: boolean
  usage_count: number
}

export default function WriterPersonaPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const [personas, setPersonas] = useState<WriterPersona[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sampleText, setSampleText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiModel, setAiModel] = useState('claude')

  const supabase = createClient()

  const WRITING_STYLES = useMemo(() => [
    { value: 'professional', label: t('writingStyleProfessional') },
    { value: 'casual', label: t('writingStyleCasual') },
    { value: 'technical', label: t('writingStyleTechnical') },
    { value: 'storytelling', label: t('writingStyleStorytelling') },
    { value: 'humorous', label: t('writingStyleHumorous') },
  ], [language])

  const TONES = useMemo(() => [
    { value: 'formal', label: t('toneFormal') },
    { value: 'friendly', label: t('toneFriendlyLabel') },
    { value: 'authoritative', label: t('toneAuthoritative') },
    { value: 'conversational', label: t('toneConversational') },
    { value: 'inspirational', label: t('toneInspirational') },
  ], [language])

  const EMOJI_USAGE = useMemo(() => [
    { value: 'heavy', label: t('emojiHeavy') },
    { value: 'moderate', label: t('emojiModerate') },
    { value: 'minimal', label: t('emojiMinimal') },
    { value: 'none', label: t('emojiNone') },
  ], [language])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    writing_style: 'professional',
    tone: 'friendly',
    opening: 'question',
    body: 'mixed',
    closing: 'cta',
    expertise_areas: '',
    unique_perspective: '',
    emoji_usage: 'moderate',
    sentence_length: 'medium',
    paragraph_length: 'standard',
    technical_terms: false,
    use_analogies: true,
    use_data_statistics: false,
    signature_phrases: '',
    catchphrase: '',
  })

  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('writer_personas')
      .select('*')
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false })

    if (error) {
      toast.error(t('personaLoadFailed'))
    } else {
      setPersonas(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const personaData = {
      name: formData.name,
      description: formData.description,
      writing_style: formData.writing_style,
      tone: formData.tone,
      preferred_structure: {
        opening: formData.opening,
        body: formData.body,
        closing: formData.closing,
      },
      expertise_areas: formData.expertise_areas.split(',').map(s => s.trim()).filter(Boolean),
      unique_perspective: formData.unique_perspective,
      language_preferences: {
        emoji_usage: formData.emoji_usage,
        sentence_length: formData.sentence_length,
        paragraph_length: formData.paragraph_length,
        technical_terms: formData.technical_terms,
        use_analogies: formData.use_analogies,
        use_data_statistics: formData.use_data_statistics,
      },
      signature_phrases: formData.signature_phrases.split(',').map(s => s.trim()).filter(Boolean),
      catchphrase: formData.catchphrase,
    }

    if (editingId) {
      // Update existing
      const result = await (supabase as any)
        .from('writer_personas')
        .update(personaData)
        .eq('id', editingId)

      const { error } = result

      if (error) {
        toast.error(t('personaUpdateFailed'))
      } else {
        toast.success(t('personaUpdated'))
        setEditingId(null)
        resetForm()
        fetchPersonas()
      }
    } else {
      // Create new
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const insertResult = await (supabase as any)
        .from('writer_personas')
        .insert({ ...personaData, user_id: user.id })

      const { error } = insertResult

      if (error) {
        toast.error(t('personaCreateFailed'))
      } else {
        toast.success(t('personaCreatedSuccess'))
        setIsCreating(false)
        resetForm()
        fetchPersonas()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return

    const deleteResult = await (supabase as any)
      .from('writer_personas')
      .delete()
      .eq('id', id)

    const { error } = deleteResult

    if (error) {
      toast.error(t('deleteFailed'))
    } else {
      toast.success(t('deleteSuccess'))
      fetchPersonas()
    }
  }

  const handleSetDefault = async (id: string) => {
    // Unset all defaults
    await (supabase as any)
      .from('writer_personas')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Set new default
    const setDefaultResult = await (supabase as any)
      .from('writer_personas')
      .update({ is_default: true })
      .eq('id', id)

    const { error } = setDefaultResult

    if (error) {
      toast.error(t('setDefaultFailed'))
    } else {
      toast.success(t('setDefaultSuccess'))
      fetchPersonas()
    }
  }

  const handleEdit = (persona: WriterPersona) => {
    setFormData({
      name: persona.name,
      description: persona.description,
      writing_style: persona.writing_style,
      tone: persona.tone,
      opening: persona.preferred_structure?.opening || 'question',
      body: persona.preferred_structure?.body || 'mixed',
      closing: persona.preferred_structure?.closing || 'cta',
      expertise_areas: persona.expertise_areas?.join(', ') || '',
      unique_perspective: persona.unique_perspective || '',
      emoji_usage: persona.language_preferences?.emoji_usage || 'moderate',
      sentence_length: persona.language_preferences?.sentence_length || 'medium',
      paragraph_length: persona.language_preferences?.paragraph_length || 'standard',
      technical_terms: persona.language_preferences?.technical_terms || false,
      use_analogies: persona.language_preferences?.use_analogies || false,
      use_data_statistics: persona.language_preferences?.use_data_statistics || false,
      signature_phrases: persona.signature_phrases?.join(', ') || '',
      catchphrase: persona.catchphrase || '',
    })
    setEditingId(persona.id)
    setIsCreating(true)
  }

  const handleAnalysisComplete = (analysis: any) => {
    setFormData({
      name: analysis.suggested_name || '',
      description: t('aiGeneratedPersona'),
      writing_style: analysis.writing_style || 'professional',
      tone: analysis.tone || 'friendly',
      opening: 'question',
      body: 'mixed',
      closing: 'cta',
      expertise_areas: analysis.expertise_areas?.join(', ') || '',
      unique_perspective: analysis.unique_perspective || '',
      emoji_usage: analysis.emoji_usage || 'moderate',
      sentence_length: analysis.sentence_length || 'medium',
      paragraph_length: 'standard',
      technical_terms: analysis.technical_terms || false,
      use_analogies: analysis.use_analogies || false,
      use_data_statistics: analysis.use_data_statistics || false,
      signature_phrases: analysis.signature_phrases?.join(', ') || '',
      catchphrase: '',
    })
    setIsCreating(true)
    toast.success(t('analysisComplete'))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      writing_style: 'professional',
      tone: 'friendly',
      opening: 'question',
      body: 'mixed',
      closing: 'cta',
      expertise_areas: '',
      unique_perspective: '',
      emoji_usage: 'moderate',
      sentence_length: 'medium',
      paragraph_length: 'standard',
      technical_terms: false,
      use_analogies: true,
      use_data_statistics: false,
      signature_phrases: '',
      catchphrase: '',
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-end items-center">
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('newPersona')}
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="space-y-6">
          {!editingId && (
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                <TabsTrigger value="manual" className="data-[state=active]:bg-zinc-700 text-zinc-300">
                  {t('manualInput')}
                </TabsTrigger>
                <TabsTrigger value="analyze" className="data-[state=active]:bg-zinc-700 text-zinc-300">
                  {t('aiAnalysis')}
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-zinc-700 text-zinc-300">
                  {t('sophisticatedTemplates')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">{t('newWriterPersona')}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {t('defineYourStyle')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t('personaName')} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('personaNamePlaceholder')}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">{t('writingStyle')}</Label>
                  <Select value={formData.writing_style} onValueChange={(v) => setFormData({ ...formData, writing_style: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WRITING_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">{t('descriptionLabel')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('personaDescription')}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t('tone')}</Label>
                  <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">{t('emojiUsage')}</Label>
                  <Select value={formData.emoji_usage} onValueChange={(v) => setFormData({ ...formData, emoji_usage: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJI_USAGE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">{t('expertiseAreas')}</Label>
                <Input
                  value={formData.expertise_areas}
                  onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                  placeholder={t('expertiseAreasPlaceholder')}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">{t('uniquePerspective')}</Label>
                <Input
                  value={formData.unique_perspective}
                  onChange={(e) => setFormData({ ...formData, unique_perspective: e.target.value })}
                  placeholder={t('uniquePerspectivePlaceholder')}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">{t('signaturePhrases')}</Label>
                <Input
                  value={formData.signature_phrases}
                  onChange={(e) => setFormData({ ...formData, signature_phrases: e.target.value })}
                  placeholder={t('signaturePhrasesPlaceholder')}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">{t('catchphrase')}</Label>
                <Input
                  value={formData.catchphrase}
                  onChange={(e) => setFormData({ ...formData, catchphrase: e.target.value })}
                  placeholder={t('catchphrasePlaceholder')}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  <Check className="w-4 h-4 mr-2" />
                  {editingId ? t('edit') : t('create')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
              </TabsContent>

              <TabsContent value="analyze" className="mt-6">
                <WritingAnalyzer onAnalysisComplete={handleAnalysisComplete} />
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <PersonaTemplateGallery onSelectTemplate={(template) => {
                  toast.success(t('personaGeneratedRefresh'))
                  setIsCreating(false)
                  fetchPersonas()
                }} />
              </TabsContent>
            </Tabs>
          )}

          {editingId && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">{t('editPersonaTitle')}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {t('editPersonaDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Same form content as manual input */}
                  <div className="text-zinc-400 text-sm mb-4">
                    {t('editMode')}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-400">{t('loadingPersonas')}</div>
      ) : personas.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="text-center py-12">
            <p className="text-zinc-400">{t('noPersonasYet')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" key={language}>
          {personas.map((persona) => (
            <Card key={persona.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{persona.name}</h3>
                      {persona.is_default && (
                        <Badge className="bg-amber-600">{t('defaultBadgeLabel')}</Badge>
                      )}
                      <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                        {persona.usage_count}{t('usageCount')}
                      </Badge>
                    </div>
                    {persona.description && (
                      <p className="text-zinc-400 mb-3">{persona.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                        {WRITING_STYLES.find(s => s.value === persona.writing_style)?.label}
                      </Badge>
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                        {TONES.find(t => t.value === persona.tone)?.label}
                      </Badge>
                      {persona.expertise_areas?.map((area) => (
                        <Badge key={area} variant="outline" className="border-amber-600 text-amber-500">
                          {area}
                        </Badge>
                      ))}
                    </div>
                    {persona.unique_perspective && (
                      <p className="text-sm text-zinc-500 italic">💡 {persona.unique_perspective}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!persona.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(persona.id)}
                        className="text-zinc-400 hover:text-amber-500"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(persona)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(persona.id)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
