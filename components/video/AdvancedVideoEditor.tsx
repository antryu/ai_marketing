'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Magnet,
  Type,
  Music,
  Video,
  ArrowLeft,
  Download,
  Undo,
  Redo,
  Copy,
  Maximize2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useVideoEditorStore, TimelineElement, TimelineTrack } from '@/store/video-editor-store'

interface AdvancedVideoEditorProps {
  videoUrl: string
  videoDuration?: number
  onBack?: () => void
  onSave?: (projectData: any) => void
  onExport?: () => void
  language?: 'ko' | 'en'
}

// Format time as MM:SS.ms
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

// Timeline Track Component
function TimelineTrackRow({
  track,
  zoomLevel,
  currentTime,
  selectedElementIds,
  onElementClick,
  onElementDoubleClick,
  language
}: {
  track: TimelineTrack
  zoomLevel: number
  currentTime: number
  selectedElementIds: string[]
  onElementClick: (elementId: string, e: React.MouseEvent) => void
  onElementDoubleClick: (element: TimelineElement) => void
  language: 'ko' | 'en'
}) {
  const trackColors = {
    video: 'bg-blue-500/80',
    audio: 'bg-green-500/80',
    text: 'bg-purple-500/80'
  }

  const trackIcons = {
    video: <Video className="w-3 h-3" />,
    audio: <Music className="w-3 h-3" />,
    text: <Type className="w-3 h-3" />
  }

  return (
    <div className="flex border-b border-zinc-800">
      {/* Track Header */}
      <div className="w-32 flex-shrink-0 p-2 bg-zinc-900 border-r border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{trackIcons[track.type]}</span>
          <span className="text-xs text-zinc-400 truncate">{track.name}</span>
        </div>
      </div>

      {/* Track Content */}
      <div className="flex-1 h-16 bg-zinc-950 relative">
        {track.elements.map(element => {
          const effectiveDuration = element.duration - element.trimStart - element.trimEnd
          const left = element.startTime * 50 * zoomLevel
          const width = effectiveDuration * 50 * zoomLevel

          return (
            <motion.div
              key={element.id}
              className={`
                absolute top-1 bottom-1 rounded cursor-pointer
                ${trackColors[track.type]}
                ${selectedElementIds.includes(element.id) ? 'ring-2 ring-amber-400' : ''}
              `}
              style={{
                left: `${left}px`,
                width: `${Math.max(width, 20)}px`,
              }}
              onClick={(e) => onElementClick(element.id, e)}
              onDoubleClick={() => onElementDoubleClick(element)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="px-2 py-1 h-full flex items-center overflow-hidden">
                <span className="text-xs text-white truncate font-medium">
                  {element.name}
                </span>
              </div>

              {/* Trim Handles */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-white/60 rounded-l" />
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-white/60 rounded-r" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Playhead Component
function Playhead({ currentTime, zoomLevel }: { currentTime: number; zoomLevel: number }) {
  const left = currentTime * 50 * zoomLevel + 128 // 128 = track header width

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
      style={{ left: `${left}px` }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
    </div>
  )
}

// Time Ruler Component
function TimeRuler({ duration, zoomLevel }: { duration: number; zoomLevel: number }) {
  const markers: number[] = []
  const interval = zoomLevel > 1.5 ? 1 : zoomLevel > 0.5 ? 2 : 5

  for (let i = 0; i <= duration; i += interval) {
    markers.push(i)
  }

  return (
    <div className="flex border-b border-zinc-800 bg-zinc-900/50">
      <div className="w-32 flex-shrink-0 border-r border-zinc-800" />
      <div className="flex-1 h-6 relative">
        {markers.map(time => (
          <div
            key={time}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${time * 50 * zoomLevel}px` }}
          >
            <div className="h-2 w-px bg-zinc-600" />
            <span className="text-[10px] text-zinc-500 mt-0.5">{time}s</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdvancedVideoEditor({
  videoUrl,
  videoDuration = 3,
  onBack,
  onSave,
  onExport,
  language = 'ko'
}: AdvancedVideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Store
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    speed,
    tracks,
    selectedElementIds,
    zoomLevel,
    snappingEnabled,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    toggleMute,
    setSpeed,
    addTrack,
    removeTrack,
    addElement,
    removeElement,
    updateElement,
    selectElement,
    clearSelection,
    zoomIn,
    zoomOut,
    toggleSnapping,
    initializeWithVideo,
    getTotalDuration,
    splitElement
  } = useVideoEditorStore()

  // Initialize store with video
  useEffect(() => {
    initializeWithVideo(videoUrl, videoDuration)
  }, [videoUrl, videoDuration, initializeWithVideo])

  // Sync video with playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
    }
  }, [isPlaying])

  // Sync video time
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  // Video volume
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = muted ? 0 : volume
    video.playbackRate = speed
  }, [volume, muted, speed])

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left - 128 // Subtract track header width
    const time = x / (50 * zoomLevel)
    seek(Math.max(0, time))
  }, [zoomLevel, seek])

  // Handle element click
  const handleElementClick = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(elementId, e.shiftKey || e.metaKey)
  }, [selectElement])

  // Handle video export/download via proxy API
  const handleExportVideo = useCallback(async () => {
    if (!videoUrl) return

    try {
      toast.info(language === 'ko' ? '다운로드 준비 중...' : 'Preparing download...')

      // Use proxy API to download video (avoids CORS issues)
      const proxyUrl = `/api/video/download?url=${encodeURIComponent(videoUrl)}`
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edited-video-${Date.now()}.mp4`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(language === 'ko' ? '비디오 다운로드 완료' : 'Video downloaded')
      onExport?.()
    } catch (error) {
      console.error('Export error:', error)
      toast.error(language === 'ko' ? '다운로드 실패' : 'Download failed')
    }
  }, [videoUrl, language, onExport])

  // Handle element double click (for editing)
  const handleElementDoubleClick = useCallback((element: TimelineElement) => {
    toast.info(
      language === 'ko'
        ? `"${element.name}" 편집 모드`
        : `Editing "${element.name}"`
    )
  }, [language])

  // Split at playhead
  const handleSplit = useCallback(() => {
    for (const track of tracks) {
      for (const element of track.elements) {
        const start = element.startTime
        const end = element.startTime + element.duration - element.trimStart - element.trimEnd
        if (currentTime > start && currentTime < end) {
          splitElement(track.id, element.id, currentTime)
          toast.success(language === 'ko' ? '클립 분할됨' : 'Clip split')
          return
        }
      }
    }
    toast.error(language === 'ko' ? '분할할 클립이 없습니다' : 'No clip to split')
  }, [tracks, currentTime, splitElement, language])

  // Delete selected
  const handleDelete = useCallback(() => {
    if (selectedElementIds.length === 0) {
      toast.error(language === 'ko' ? '선택된 요소가 없습니다' : 'No element selected')
      return
    }

    for (const track of tracks) {
      for (const elementId of selectedElementIds) {
        const element = track.elements.find(e => e.id === elementId)
        if (element) {
          removeElement(track.id, elementId)
        }
      }
    }
    clearSelection()
    toast.success(language === 'ko' ? '삭제됨' : 'Deleted')
  }, [selectedElementIds, tracks, removeElement, clearSelection, language])

  // Add text track
  const handleAddText = useCallback(() => {
    let textTrack = tracks.find(t => t.type === 'text')
    let trackId: string

    if (!textTrack) {
      // Create new text track and get its ID
      trackId = addTrack('text')
    } else {
      trackId = textTrack.id
    }

    // Add element to the track (use trackId directly)
    setTimeout(() => {
      addElement(trackId, {
        name: language === 'ko' ? '텍스트' : 'Text',
        type: 'text',
        startTime: currentTime,
        duration: 3,
        trimStart: 0,
        trimEnd: 0,
        content: language === 'ko' ? '텍스트를 입력하세요' : 'Enter text',
        fontSize: 48,
        color: '#ffffff',
        x: 50,
        y: 50
      })
      toast.success(language === 'ko' ? '텍스트 추가됨' : 'Text added')
    }, 0)
  }, [tracks, addTrack, addElement, currentTime, language])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          toggle()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(currentTime - (e.shiftKey ? 5 : 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(currentTime + (e.shiftKey ? 5 : 1))
          break
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            handleSplit()
          }
          break
        case 'Delete':
        case 'Backspace':
          handleDelete()
          break
        case 'Escape':
          clearSelection()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, seek, currentTime, handleSplit, handleDelete, clearSelection])

  const totalDuration = getTotalDuration()

  // Get selected text element for editing
  const selectedTextElement = selectedElementIds.length === 1
    ? tracks.flatMap(t => t.elements).find(e => e.id === selectedElementIds[0] && e.type === 'text')
    : null

  // Find track ID for selected element
  const selectedElementTrackId = selectedTextElement
    ? tracks.find(t => t.elements.some(e => e.id === selectedTextElement.id))?.id
    : null

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header - 통합 툴바 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        {/* 왼쪽: 뒤로가기 */}
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* 중앙: 도구 버튼들 */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleAddText} className="gap-2">
                  <Type className="w-4 h-4" />
                  <span className="text-xs">{language === 'ko' ? '텍스트' : 'Text'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{language === 'ko' ? '텍스트 추가' : 'Add Text'}</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-zinc-700 mx-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSplit}>
                  <Scissors className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{language === 'ko' ? '분할' : 'Split'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{language === 'ko' ? '삭제' : 'Delete'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSnapping}
                  className={snappingEnabled ? 'text-amber-400' : ''}
                >
                  <Magnet className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{language === 'ko' ? '스냅' : 'Snap'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 오른쪽: 다운로드 */}
        <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black" onClick={handleExportVideo}>
          <Download className="w-4 h-4 mr-2" />
          {language === 'ko' ? '다운로드' : 'Download'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Preview - 전체 너비 사용 */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div className="flex-1 flex items-center justify-center bg-black">
            <div className="relative w-full h-full max-w-4xl max-h-[60vh] m-4">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain rounded-lg"
                playsInline
              />
              {/* Time overlay */}
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Playback Controls - 간결하게 */}
          <div className="py-3 px-4 border-t border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seek(0)}>
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black"
                onClick={toggle}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seek(totalDuration)}>
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-zinc-700 mx-2" />

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume * 100]}
                min={0}
                max={100}
                onValueChange={([v]) => setVolume(v / 100)}
                className="w-16"
              />

              <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                <SelectTrigger className="w-16 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right Panel - 항상 표시 */}
        <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
          <Tabs defaultValue="text" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 p-1 m-2">
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                {language === 'ko' ? '텍스트' : 'Text'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                {language === 'ko' ? '설정' : 'Settings'}
              </TabsTrigger>
            </TabsList>

            {/* Text Tab */}
            <TabsContent value="text" className="flex-1 p-4 space-y-4 overflow-y-auto">
              <Button onClick={handleAddText} className="w-full bg-amber-500 hover:bg-amber-400 text-black">
                <Type className="w-4 h-4 mr-2" />
                {language === 'ko' ? '텍스트 추가' : 'Add Text'}
              </Button>

              {/* Text Elements List */}
              {tracks.filter(t => t.type === 'text').flatMap(t => t.elements).length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">
                    {language === 'ko' ? '텍스트 목록' : 'Text List'}
                  </label>
                  {tracks.filter(t => t.type === 'text').flatMap(t =>
                    t.elements.map(el => ({ ...el, trackId: t.id }))
                  ).map(element => (
                    <div
                      key={element.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedElementIds.includes(element.id)
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      onClick={() => selectElement(element.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{element.content || element.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-zinc-500 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeElement(element.trackId, element.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Text Editor */}
              {selectedTextElement && selectedElementTrackId && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">{language === 'ko' ? '내용' : 'Content'}</label>
                    <textarea
                      value={selectedTextElement.content || ''}
                      onChange={(e) => updateElement(selectedElementTrackId, selectedTextElement.id, { content: e.target.value })}
                      className="w-full h-16 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white resize-none focus:outline-none focus:border-amber-500"
                      placeholder={language === 'ko' ? '텍스트 입력...' : 'Enter text...'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">
                      {language === 'ko' ? '크기' : 'Size'}: {selectedTextElement.fontSize || 48}px
                    </label>
                    <Slider
                      value={[selectedTextElement.fontSize || 48]}
                      onValueChange={(v) => updateElement(selectedElementTrackId, selectedTextElement.id, { fontSize: v[0] })}
                      min={12}
                      max={120}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">{language === 'ko' ? '색상' : 'Color'}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedElementTrackId, selectedTextElement.id, { color })}
                          className={`w-5 h-5 rounded ${selectedTextElement.color === color ? 'ring-2 ring-amber-500' : 'ring-1 ring-zinc-600'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">
                      {language === 'ko' ? '시간' : 'Duration'}: {selectedTextElement.duration?.toFixed(1) || 3}s
                    </label>
                    <Slider
                      value={[selectedTextElement.duration || 3]}
                      onValueChange={(v) => updateElement(selectedElementTrackId, selectedTextElement.id, { duration: v[0] })}
                      min={0.5}
                      max={30}
                      step={0.5}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">{language === 'ko' ? '재생 속도' : 'Playback Speed'}</label>
                  <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                    <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">{language === 'ko' ? '볼륨' : 'Volume'}</label>
                  <Slider
                    value={[muted ? 0 : volume * 100]}
                    min={0}
                    max={100}
                    onValueChange={([v]) => setVolume(v / 100)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">{language === 'ko' ? '스냅' : 'Snapping'}</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSnapping}
                    className={snappingEnabled ? 'text-amber-400' : 'text-zinc-500'}
                  >
                    <Magnet className="w-4 h-4 mr-1" />
                    {snappingEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">{language === 'ko' ? '타임라인 줌' : 'Timeline Zoom'}</label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-zinc-400 flex-1 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Timeline Panel */}
      <div className="h-64 border-t border-zinc-800 bg-zinc-900 flex flex-col">
        {/* Timeline Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => addTrack('video')}>
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ko' ? '트랙' : 'Track'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-400 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto relative"
          onClick={handleTimelineClick}
        >
          {/* Time Ruler */}
          <TimeRuler duration={totalDuration} zoomLevel={zoomLevel} />

          {/* Tracks */}
          <div className="relative">
            {tracks.map(track => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                zoomLevel={zoomLevel}
                currentTime={currentTime}
                selectedElementIds={selectedElementIds}
                onElementClick={handleElementClick}
                onElementDoubleClick={handleElementDoubleClick}
                language={language}
              />
            ))}

            {/* Playhead */}
            <Playhead currentTime={currentTime} zoomLevel={zoomLevel} />
          </div>

          {/* Empty state */}
          {tracks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-zinc-500">
              {language === 'ko' ? '트랙을 추가하세요' : 'Add a track to get started'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
