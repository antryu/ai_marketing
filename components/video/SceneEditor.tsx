'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Palette,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoScene, SceneElement, BackgroundConfig } from '@/types/video.types'

interface SceneEditorProps {
  scene: VideoScene
  onUpdate: (updates: Partial<VideoScene>) => void
}

export function SceneEditor({ scene, onUpdate }: SceneEditorProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const selectedElement = scene.elements.find(e => e.id === selectedElementId)

  const handleAddElement = (type: SceneElement['type']) => {
    const newElement: SceneElement = {
      id: `element-${Date.now()}`,
      type,
      position: { x: 50, y: 50 },
      size: { width: 30, height: 10 },
      ...(type === 'text' && {
        content: '텍스트를 입력하세요',
        style: {
          fontSize: 48,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center'
        }
      }),
      ...(type === 'shape' && {
        style: {
          backgroundColor: '#6366f1',
          borderRadius: 8
        }
      })
    }

    onUpdate({
      elements: [...scene.elements, newElement]
    })
    setSelectedElementId(newElement.id)
  }

  const handleUpdateElement = (elementId: string, updates: Partial<SceneElement>) => {
    onUpdate({
      elements: scene.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    })
  }

  const handleDeleteElement = (elementId: string) => {
    onUpdate({
      elements: scene.elements.filter(el => el.id !== elementId)
    })
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const handleUpdateBackground = (background: Partial<BackgroundConfig>) => {
    onUpdate({
      background: { ...scene.background, ...background }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">씬 편집</h3>
        <p className="text-xs text-zinc-400 mt-1">
          씬 {scene.order + 1}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="w-full justify-start border-b border-zinc-800 rounded-none bg-zinc-900">
            <TabsTrigger value="elements" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              요소
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              배경
            </TabsTrigger>
            <TabsTrigger value="timing" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              타이밍
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="p-4 space-y-4">
            {/* Add Element Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('text')}
                className="flex flex-col h-auto py-3 gap-1"
              >
                <Type className="w-5 h-5" />
                <span className="text-xs">텍스트</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('image')}
                className="flex flex-col h-auto py-3 gap-1"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">이미지</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('shape')}
                className="flex flex-col h-auto py-3 gap-1"
              >
                <Square className="w-5 h-5" />
                <span className="text-xs">도형</span>
              </Button>
            </div>

            {/* Elements List */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">레이어</Label>
              {scene.elements.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  요소를 추가해주세요
                </div>
              ) : (
                <div className="space-y-2">
                  {scene.elements.map((element, index) => (
                    <ElementCard
                      key={element.id}
                      element={element}
                      index={index}
                      isSelected={element.id === selectedElementId}
                      onSelect={() => setSelectedElementId(element.id)}
                      onDelete={() => handleDeleteElement(element.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Element Properties */}
            {selectedElement && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-4 border-t border-zinc-800"
              >
                <h4 className="text-sm font-semibold text-white">속성</h4>

                {selectedElement.type === 'text' && (
                  <TextElementEditor
                    element={selectedElement}
                    onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                  />
                )}

                {selectedElement.type === 'shape' && (
                  <ShapeElementEditor
                    element={selectedElement}
                    onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                  />
                )}

                {/* Position & Size */}
                <div className="space-y-3">
                  <Label className="text-xs text-zinc-300">위치 및 크기</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-zinc-400">X (%)</Label>
                      <Input
                        type="number"
                        value={selectedElement.position.x}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            position: { ...selectedElement.position, x: Number(e.target.value) }
                          })
                        }
                        className="h-8 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Y (%)</Label>
                      <Input
                        type="number"
                        value={selectedElement.position.y}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            position: { ...selectedElement.position, y: Number(e.target.value) }
                          })
                        }
                        className="h-8 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">너비 (%)</Label>
                      <Input
                        type="number"
                        value={selectedElement.size.width}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            size: { ...selectedElement.size, width: Number(e.target.value) }
                          })
                        }
                        className="h-8 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">높이 (%)</Label>
                      <Input
                        type="number"
                        value={selectedElement.size.height}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            size: { ...selectedElement.size, height: Number(e.target.value) }
                          })
                        }
                        className="h-8 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="background" className="p-4 space-y-4">
            <BackgroundEditor
              background={scene.background}
              onUpdate={handleUpdateBackground}
            />
          </TabsContent>

          <TabsContent value="timing" className="p-4 space-y-4">
            <div className="space-y-3">
              <Label>재생 시간</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={scene.duration}
                  onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                  min={0.5}
                  max={30}
                  step={0.5}
                />
                <span className="text-sm text-zinc-400">초</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Sub-components
function ElementCard({
  element,
  index,
  isSelected,
  onSelect,
  onDelete
}: {
  element: SceneElement
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const getIcon = () => {
    switch (element.type) {
      case 'text': return Type
      case 'image': return ImageIcon
      case 'shape': return Square
      default: return Layers
    }
  }

  const Icon = getIcon()

  return (
    <div
      onClick={onSelect}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-white">
            {element.type === 'text' ? element.content?.slice(0, 20) : `${element.type} ${index + 1}`}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Plus className="w-4 h-4 rotate-45" />
        </button>
      </div>
    </div>
  )
}

function TextElementEditor({
  element,
  onUpdate
}: {
  element: SceneElement
  onUpdate: (updates: Partial<SceneElement>) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-300">텍스트</Label>
        <Input
          value={element.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="h-8 bg-zinc-800 border-zinc-700 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-zinc-400">크기</Label>
          <Input
            type="number"
            value={element.style?.fontSize || 24}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, fontSize: Number(e.target.value) }
              })
            }
            className="h-8 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">색상</Label>
          <Input
            type="color"
            value={element.style?.color || '#000000'}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, color: e.target.value }
              })
            }
            className="h-8 bg-zinc-800 border-zinc-700"
          />
        </div>
      </div>
    </div>
  )
}

function ShapeElementEditor({
  element,
  onUpdate
}: {
  element: SceneElement
  onUpdate: (updates: Partial<SceneElement>) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-300">배경색</Label>
        <Input
          type="color"
          value={element.style?.backgroundColor || '#6366f1'}
          onChange={(e) =>
            onUpdate({
              style: { ...element.style, backgroundColor: e.target.value }
            })
          }
          className="h-8 bg-zinc-800 border-zinc-700"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-300">둥근 모서리</Label>
        <Input
          type="number"
          value={element.style?.borderRadius || 0}
          onChange={(e) =>
            onUpdate({
              style: { ...element.style, borderRadius: Number(e.target.value) }
            })
          }
          className="h-8 bg-zinc-800 border-zinc-700 text-white"
        />
      </div>
    </div>
  )
}

function BackgroundEditor({
  background,
  onUpdate
}: {
  background: BackgroundConfig
  onUpdate: (updates: Partial<BackgroundConfig>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-zinc-300">배경 유형</Label>
        <Select
          value={background.type}
          onValueChange={(value: BackgroundConfig['type']) => onUpdate({ type: value })}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="color">단색</SelectItem>
            <SelectItem value="gradient">그라데이션</SelectItem>
            <SelectItem value="image">이미지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {background.type === 'color' && (
        <div>
          <Label className="text-zinc-300">색상</Label>
          <Input
            type="color"
            value={background.value as string}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="bg-zinc-800 border-zinc-700"
          />
        </div>
      )}

      {background.type === 'gradient' && typeof background.value === 'object' && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-zinc-400">색상 1</Label>
            <Input
              type="color"
              value={(background.value as any).colors[0] || '#667eea'}
              onChange={(e) => {
                const gradientValue = background.value as any
                const newColors = [...gradientValue.colors]
                newColors[0] = e.target.value
                onUpdate({
                  value: { ...gradientValue, colors: newColors }
                })
              }}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">색상 2</Label>
            <Input
              type="color"
              value={(background.value as any).colors[1] || '#764ba2'}
              onChange={(e) => {
                const gradientValue = background.value as any
                const newColors = [...gradientValue.colors]
                newColors[1] = e.target.value
                onUpdate({
                  value: { ...gradientValue, colors: newColors }
                })
              }}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      )}
    </div>
  )
}
