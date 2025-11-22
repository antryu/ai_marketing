'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, TrendingUp, ShoppingBag, BookOpen, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VideoTemplate } from '@/types/video.types'
import { VIDEO_TEMPLATES } from '@/lib/video/templates'

interface TemplateSelectorProps {
  onSelectTemplate: (template: VideoTemplate) => void
}

const CATEGORIES = [
  { id: 'all', label: '전체', icon: Sparkles },
  { id: 'product', label: '제품 소개', icon: ShoppingBag },
  { id: 'promo', label: '프로모션', icon: TrendingUp },
  { id: 'story', label: '스토리', icon: BookOpen },
  { id: 'testimonial', label: '후기', icon: Users },
]

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = VIDEO_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 bg-zinc-900 border-b border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-2">비디오 템플릿</h2>
        <p className="text-zinc-400">
          전문가가 디자인한 템플릿으로 빠르게 시작하세요
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors
                  ${selectedCategory === category.id
                    ? 'bg-amber-500 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/50">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onSelect={() => onSelectTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  index,
  onSelect
}: {
  template: VideoTemplate
  index: number
  onSelect: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden hover:shadow-lg hover:shadow-amber-500/10 transition-shadow cursor-pointer bg-zinc-800 border-zinc-700" onClick={onSelect}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-zinc-700 to-zinc-800 overflow-hidden">
          {/* Preview placeholder - would be actual template preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-zinc-300">{template.format}</div>
            </div>
          </div>

          {/* Hover overlay */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-zinc-900">
                템플릿 사용
              </Button>
            </motion.div>
          )}

          {/* Duration badge */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
            {template.duration}초
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white line-clamp-1">
              {template.name}
            </h3>
            <Badge variant="secondary" className="text-xs shrink-0 bg-zinc-700 text-zinc-300">
              {getCategoryLabel(template.category)}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
            <span>{template.scenes.length}개 씬</span>
            <span>•</span>
            <span>{template.format}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function getCategoryLabel(category: VideoTemplate['category']): string {
  const labels = {
    product: '제품',
    promo: '프로모션',
    story: '스토리',
    testimonial: '후기',
    tutorial: '튜토리얼'
  }
  return labels[category] || category
}
