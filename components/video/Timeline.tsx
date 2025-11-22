'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VideoScene } from '@/types/video.types'

interface TimelineProps {
  scenes: VideoScene[]
  selectedSceneId: string | null
  currentTime: number
  onSceneSelect: (sceneId: string) => void
  onSceneUpdate: (sceneId: string, updates: Partial<VideoScene>) => void
  onSceneDelete: (sceneId: string) => void
  onAddScene: () => void
}

export function Timeline({
  scenes,
  selectedSceneId,
  currentTime,
  onSceneSelect,
  onSceneUpdate,
  onSceneDelete,
  onAddScene
}: TimelineProps) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null)

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)

  const handleDragStart = (sceneId: string) => {
    setDraggedSceneId(sceneId)
  }

  const handleDragOver = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault()
    if (!draggedSceneId || draggedSceneId === targetSceneId) return

    const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId)
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId)

    if (draggedIndex === targetIndex) return

    // Reorder scenes
    const newScenes = [...scenes]
    const [draggedScene] = newScenes.splice(draggedIndex, 1)
    newScenes.splice(targetIndex, 0, draggedScene)

    // Update order property
    newScenes.forEach((scene, index) => {
      onSceneUpdate(scene.id, { order: index })
    })
  }

  const handleDragEnd = () => {
    setDraggedSceneId(null)
  }

  const handleDuplicateScene = (scene: VideoScene) => {
    const newScene: VideoScene = {
      ...scene,
      id: `scene-${Date.now()}`,
      order: scene.order + 1
    }
    // This would need to be handled by parent component
    console.log('Duplicate scene:', newScene)
  }

  return (
    <div className="p-4 bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">타임라인</h3>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{scenes.length}개 씬</span>
          <span>•</span>
          <span>{Math.round(totalDuration)}초</span>
        </div>
      </div>

      <div className="relative">
        {/* Time ruler */}
        <div className="h-8 mb-2 relative bg-zinc-800 rounded">
          {scenes.length > 0 && (
            <div
              className="absolute top-0 h-full bg-amber-500/30 rounded-l"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          )}
          <div className="absolute inset-0 flex items-center px-2 text-xs text-zinc-400">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Scenes */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {scenes
            .sort((a, b) => a.order - b.order)
            .map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                isSelected={scene.id === selectedSceneId}
                isDragging={scene.id === draggedSceneId}
                onSelect={() => onSceneSelect(scene.id)}
                onDelete={() => onSceneDelete(scene.id)}
                onDuplicate={() => handleDuplicateScene(scene)}
                onDragStart={() => handleDragStart(scene.id)}
                onDragOver={(e) => handleDragOver(e, scene.id)}
                onDragEnd={handleDragEnd}
              />
            ))}

          {/* Add scene button */}
          <button
            onClick={onAddScene}
            className="flex-shrink-0 w-32 h-24 rounded-lg border-2 border-dashed border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 transition-colors flex items-center justify-center text-zinc-500 hover:text-amber-400"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface SceneCardProps {
  scene: VideoScene
  index: number
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function SceneCard({
  scene,
  index,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd
}: SceneCardProps) {
  const [showActions, setShowActions] = useState(false)

  const getBackgroundPreview = () => {
    if (scene.background.type === 'color') {
      return scene.background.value as string
    } else if (scene.background.type === 'gradient' && typeof scene.background.value === 'object') {
      const gradient = scene.background.value
      return `linear-gradient(${gradient.angle || 135}deg, ${gradient.colors.join(', ')})`
    }
    return '#f0f0f0'
  }

  return (
    <motion.div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 group
        ${isSelected
          ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
          : 'ring-1 ring-zinc-700 hover:ring-amber-500/50'
        }
      `}
    >
      {/* Background preview */}
      <div
        className="absolute inset-0"
        style={{ background: getBackgroundPreview() }}
      />

      {/* Drag handle */}
      <div className="absolute top-1 left-1 p-1 bg-black/40 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Scene info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="text-white text-xs font-medium">
          씬 {index + 1}
        </div>
        <div className="text-white/80 text-xs">
          {scene.duration}초 • {scene.elements.length}개 요소
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1 right-1 flex gap-1"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="p-1 bg-black/60 hover:bg-black/80 rounded text-white transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 bg-black/60 hover:bg-red-600 rounded text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
