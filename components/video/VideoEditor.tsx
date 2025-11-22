'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Wand2,
  Image as ImageIcon,
  Type,
  Music,
  Layers,
  Settings,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoScene, VideoProject, VideoFormat } from '@/types/video.types'
import { VideoCanvas } from './VideoCanvas'
import { Timeline } from './Timeline'
import { SceneEditor } from './SceneEditor'
import { TemplateSelector } from './TemplateSelector'

interface VideoEditorProps {
  project?: VideoProject
  onSave?: (project: VideoProject) => void
  onExport?: (project: VideoProject) => void
  onBack?: () => void
}

export function VideoEditor({ project: initialProject, onSave, onExport, onBack }: VideoEditorProps) {
  const [project, setProject] = useState<VideoProject>(initialProject || createEmptyProject())
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    project.scenes[0]?.id || null
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeTab, setActiveTab] = useState<'edit' | 'templates' | 'ai'>('edit')

  const selectedScene = project.scenes.find(s => s.id === selectedSceneId)

  const handleAddScene = () => {
    const newScene: VideoScene = {
      id: `scene-${Date.now()}`,
      order: project.scenes.length,
      duration: 3,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#667eea', '#764ba2'],
          angle: 135
        }
      },
      elements: []
    }

    setProject({
      ...project,
      scenes: [...project.scenes, newScene],
      duration: project.duration + newScene.duration
    })
    setSelectedSceneId(newScene.id)
  }

  const handleUpdateScene = (sceneId: string, updates: Partial<VideoScene>) => {
    setProject({
      ...project,
      scenes: project.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    })
  }

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = project.scenes.filter(s => s.id !== sceneId)
    setProject({
      ...project,
      scenes: updatedScenes,
      duration: updatedScenes.reduce((sum, s) => sum + s.duration, 0)
    })
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(updatedScenes[0]?.id || null)
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleExport = () => {
    if (onExport) {
      onExport(project)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold text-white">{project.title}</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>{project.format}</span>
            <span>•</span>
            <span>{project.quality}</span>
            <span>•</span>
            <span>{Math.round(project.duration)}초</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onSave?.(project)}>
            저장
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-6 gap-4">
          <ToolButton icon={Type} label="텍스트" active={activeTab === 'edit'} />
          <ToolButton icon={ImageIcon} label="이미지" />
          <ToolButton icon={Layers} label="도형" />
          <ToolButton icon={Music} label="음악" />
          <div className="flex-1" />
          <ToolButton icon={Wand2} label="AI" onClick={() => setActiveTab('ai')} />
          <ToolButton icon={Settings} label="설정" />
        </div>

        {/* Center - Canvas & Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="w-full justify-start border-b border-zinc-800 rounded-none px-6 bg-zinc-900">
              <TabsTrigger value="edit">편집</TabsTrigger>
              <TabsTrigger value="templates">템플릿</TabsTrigger>
              <TabsTrigger value="ai">AI 생성</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="flex-1 flex flex-col mt-0">
              {/* Canvas Area */}
              <div className="flex-1 flex items-center justify-center p-8 bg-zinc-900/50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <VideoCanvas
                    scene={selectedScene}
                    format={project.format}
                    isPlaying={isPlaying}
                  />

                  {/* Playback Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Timeline */}
              <div className="border-t border-zinc-800">
                <Timeline
                  scenes={project.scenes}
                  selectedSceneId={selectedSceneId}
                  currentTime={currentTime}
                  onSceneSelect={setSelectedSceneId}
                  onSceneUpdate={handleUpdateScene}
                  onSceneDelete={handleDeleteScene}
                  onAddScene={handleAddScene}
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="flex-1 mt-0">
              <TemplateSelector
                onSelectTemplate={(template) => {
                  setProject({
                    ...project,
                    scenes: template.scenes,
                    format: template.format,
                    duration: template.duration
                  })
                  setActiveTab('edit')
                }}
              />
            </TabsContent>

            <TabsContent value="ai" className="flex-1 mt-0 p-8 bg-zinc-900/50">
              <div className="max-w-2xl mx-auto">
                <AIVideoGenerator
                  brandId={project.brand_id}
                  onGenerate={(scenes) => {
                    setProject({ ...project, scenes })
                    setActiveTab('edit')
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Scene Editor */}
        <AnimatePresence mode="wait">
          {selectedScene && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-zinc-800 bg-zinc-900 overflow-y-auto"
            >
              <SceneEditor
                scene={selectedScene}
                onUpdate={(updates) => handleUpdateScene(selectedScene.id, updates)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper Components
function ToolButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
        ${active ? 'bg-amber-500 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-amber-400'}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </button>
  )
}

function AIVideoGenerator({ brandId, onGenerate }: { brandId: string, onGenerate: (scenes: VideoScene[]) => void }) {
  return (
    <Card className="p-6 bg-zinc-800 border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-white">AI로 비디오 생성</h3>
      <p className="text-zinc-400 mb-4">
        주제를 입력하면 AI가 자동으로 씬과 콘텐츠를 생성합니다.
      </p>
      <Button className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900">
        <Wand2 className="w-4 h-4 mr-2" />
        AI로 생성하기
      </Button>
    </Card>
  )
}

function createEmptyProject(): VideoProject {
  return {
    id: `project-${Date.now()}`,
    brand_id: '',
    title: '새 비디오 프로젝트',
    format: '16:9',
    quality: '1080p',
    duration: 0,
    scenes: [],
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
