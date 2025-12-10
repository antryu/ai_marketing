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
  Save,
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
    if (!textTrack) {
      const trackId = addTrack('text')
      textTrack = { id: trackId, name: 'Text Track', type: 'text', elements: [], muted: false }
    }

    addElement(textTrack.id, {
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

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {language === 'ko' ? '고급 비디오 편집기' : 'Advanced Video Editor'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onSave?.({ tracks, duration })}>
            <Save className="w-4 h-4 mr-2" />
            {language === 'ko' ? '저장' : 'Save'}
          </Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            {language === 'ko' ? '내보내기' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Panel */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center bg-black p-4">
            <div className="relative max-w-full max-h-full aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                playsInline
              />

              {/* Time overlay */}
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 rounded-lg text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-center gap-4">
              {/* Skip Back */}
              <Button variant="ghost" size="icon" onClick={() => seek(0)}>
                <SkipBack className="w-5 h-5" />
              </Button>

              {/* Play/Pause */}
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black"
                onClick={toggle}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </Button>

              {/* Skip Forward */}
              <Button variant="ghost" size="icon" onClick={() => seek(totalDuration)}>
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  min={0}
                  max={100}
                  onValueChange={([v]) => setVolume(v / 100)}
                  className="w-20"
                />
              </div>

              {/* Speed */}
              <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                <SelectTrigger className="w-20 h-8">
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

        {/* Right Sidebar - Tools */}
        <div className="w-14 border-l border-zinc-800 bg-zinc-900 flex flex-col items-center py-4 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleAddText}>
                  <Type className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {language === 'ko' ? '텍스트 추가' : 'Add Text'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSplit}>
                  <Scissors className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {language === 'ko' ? '분할 (Cmd+S)' : 'Split (Cmd+S)'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {language === 'ko' ? '삭제' : 'Delete'}
              </TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSnapping}
                  className={snappingEnabled ? 'text-amber-400' : ''}
                >
                  <Magnet className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {language === 'ko' ? '스냅 토글' : 'Toggle Snap'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
