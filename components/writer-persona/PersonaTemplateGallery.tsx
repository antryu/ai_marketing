'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Star, TrendingUp, Users, BookOpen, Briefcase, Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PersonaTemplate {
  id: string
  name: string
  category: string
  description: string
  profession: string
  known_for: string
  target_audience: string
  writing_style: string
  tone: string
  expertise_areas: string[]
  unique_perspective: string
  signature_phrases: string[]
  catchphrase: string
  example_posts: string[]
  typical_post_length: string
  tags: string[]
  popularity_score: number
}

interface PersonaTemplateGalleryProps {
  onSelectTemplate: (template: PersonaTemplate) => void
}

const categoryIcons: Record<string, any> = {
  marketing: TrendingUp,
  business: Briefcase,
  tech: Sparkles,
  lifestyle: Heart,
  education: BookOpen,
  all: Users
}

const categoryLabels: Record<string, string> = {
  all: '전체',
  marketing: '마케팅',
  business: '비즈니스',
  tech: '기술',
  lifestyle: '라이프스타일',
  education: '교육'
}

export function PersonaTemplateGallery({ onSelectTemplate }: PersonaTemplateGalleryProps) {
  const [templates, setTemplates] = useState<PersonaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates(selectedCategory)
  }, [selectedCategory])

  const loadTemplates = async (category: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/writer-persona/templates?category=${category}`)
      const data = await response.json()

      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        toast.error('템플릿을 불러오지 못했습니다')
      }
    } catch (error) {
      console.error('Template load error:', error)
      toast.error('템플릿을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromTemplate = async (template: PersonaTemplate) => {
    setCreating(template.id)
    try {
      const response = await fetch('/api/writer-persona/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          customizations: {
            name: `${template.name} 스타일`
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || '페르소나가 생성되었습니다')
        onSelectTemplate(template)
      } else {
        toast.error(data.error || '페르소나 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error('페르소나 생성 중 오류가 발생했습니다')
    } finally {
      setCreating(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || Users
    return <Icon className="w-4 h-4" />
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          정교한 페르소나 템플릿
        </CardTitle>
        <CardDescription className="text-zinc-400">
          유명 작가와 인플루언서의 글쓰기 스타일을 페르소나로 적용하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 카테고리 필터 */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-6 bg-zinc-800">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-1 text-xs"
              >
                {getCategoryIcon(key)}
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 템플릿 리스트 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            템플릿이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="bg-zinc-800/50 border-zinc-700 hover:border-amber-400/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {template.name}
                        {template.popularity_score > 5 && (
                          <Badge variant="outline" className="text-xs bg-amber-400/10 text-amber-400 border-amber-400/30">
                            인기
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 text-sm mt-1">
                        {template.profession}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags?.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-zinc-700 text-zinc-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-300">{template.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500">대표작:</span>
                      <span className="text-zinc-300 ml-2">{template.known_for}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">스타일:</span>
                      <span className="text-zinc-300 ml-2">{template.writing_style} / {template.tone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">시그니처:</span>
                      <span className="text-amber-300 ml-2 italic">"{template.catchphrase}"</span>
                    </div>
                  </div>

                  {template.example_posts && template.example_posts.length > 0 && (
                    <div className="bg-zinc-900/50 p-3 rounded border border-zinc-700 mt-3">
                      <p className="text-xs text-zinc-500 mb-2">예시 글:</p>
                      <p className="text-xs text-zinc-300 italic">
                        "{template.example_posts[0]}"
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => handleCreateFromTemplate(template)}
                    disabled={creating === template.id}
                    className="w-full bg-amber-600 hover:bg-amber-700 mt-3"
                    size="sm"
                  >
                    {creating === template.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-2" />
                        이 스타일로 페르소나 만들기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-900/10 border border-amber-400/30 rounded">
          <p className="text-xs text-amber-200">
            💡 <strong>Tip:</strong> 템플릿을 선택하면 해당 작가의 글쓰기 스타일이 자동으로 적용됩니다.
            생성 후 원하는 대로 수정할 수 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
