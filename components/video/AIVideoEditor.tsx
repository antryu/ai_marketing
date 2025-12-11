'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Scissors,
  Type,
  Sparkles,
  Volume2,
  VolumeX,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Check,
  Loader2,
  Sliders,
  Palette,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  fontWeight: 'normal' | 'bold'
  startTime: number
  endTime: number
}

interface VideoFilter {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
}

interface AIVideoEditorProps {
  videoUrl: string
  onSave?: (editedVideoUrl: string) => void
  onClose?: () => void
  onOpenAdvanced?: () => void
  language?: 'ko' | 'en'
}

const DEFAULT_FILTER: VideoFilter = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
}

const PRESET_FILTERS: { name: string; nameEn: string; filter: VideoFilter }[] = [
  { name: '원본', nameEn: 'Original', filter: DEFAULT_FILTER },
  { name: '선명', nameEn: 'Vivid', filter: { ...DEFAULT_FILTER, contrast: 120, saturation: 130 } },
  { name: '따뜻함', nameEn: 'Warm', filter: { ...DEFAULT_FILTER, brightness: 105, saturation: 110, sepia: 20 } },
  { name: '시원함', nameEn: 'Cool', filter: { ...DEFAULT_FILTER, brightness: 105, saturation: 90, contrast: 110 } },
  { name: '빈티지', nameEn: 'Vintage', filter: { ...DEFAULT_FILTER, contrast: 90, saturation: 80, sepia: 40 } },
  { name: '흑백', nameEn: 'B&W', filter: { ...DEFAULT_FILTER, grayscale: 100 } },
  { name: '드라마틱', nameEn: 'Dramatic', filter: { ...DEFAULT_FILTER, contrast: 140, brightness: 90, saturation: 80 } },
  { name: '페이드', nameEn: 'Fade', filter: { ...DEFAULT_FILTER, contrast: 80, brightness: 110, saturation: 90 } },
]

export function AIVideoEditor({
  videoUrl,
  onSave,
  onClose,
  onOpenAdvanced,
  language = 'ko'
}: AIVideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)

  // Edit state
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [filter, setFilter] = useState<VideoFilter>(DEFAULT_FILTER)
  const [activeTab, setActiveTab] = useState<'trim' | 'text' | 'filter'>('trim')

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Initialize video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setTrimEnd(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Auto-pause at trim end
      if (video.currentTime >= trimEnd) {
        video.pause()
        setIsPlaying(false)
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [trimEnd])

  // Apply CSS filter to video
  const getFilterStyle = useCallback(() => {
    return {
      filter: `
        brightness(${filter.brightness}%)
        contrast(${filter.contrast}%)
        saturate(${filter.saturation}%)
        blur(${filter.blur}px)
        grayscale(${filter.grayscale}%)
        sepia(${filter.sepia}%)
      `.trim()
    }
  }, [filter])

  // Playback controls
  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      // Start from trim start if at end or before start
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart
      }
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = trimStart
    setCurrentTime(trimStart)
    setIsPlaying(false)
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    const newTime = value[0]
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    const newVolume = value[0]
    video.volume = newVolume / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Text overlay management
  const addTextOverlay = () => {
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: language === 'ko' ? '텍스트 입력' : 'Enter text',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff',
      fontWeight: 'bold',
      startTime: trimStart,
      endTime: trimEnd,
    }
    setTextOverlays([...textOverlays, newText])
    setSelectedTextId(newText.id)
  }

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(overlays =>
      overlays.map(t => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTextOverlay = (id: string) => {
    setTextOverlays(overlays => overlays.filter(t => t.id !== id))
    if (selectedTextId === id) {
      setSelectedTextId(null)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }

  // Export video via proxy API to avoid CORS
  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Show progress while downloading
      for (let i = 0; i <= 50; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setExportProgress(i)
      }

      // Use proxy API to download video (avoids CORS issues)
      const proxyUrl = `/api/video/download?url=${encodeURIComponent(videoUrl)}`
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      setExportProgress(80)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edited_video_${Date.now()}.mp4`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportProgress(100)

      toast.success(
        language === 'ko'
          ? '비디오 다운로드 완료!'
          : 'Video downloaded!'
      )

      onSave?.(videoUrl)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(
        language === 'ko'
          ? '다운로드 실패. 다시 시도해주세요.'
          : 'Download failed. Please try again.'
      )
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {language === 'ko' ? 'AI 비디오 편집기' : 'AI Video Editor'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onOpenAdvanced && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAdvanced}
              className="text-zinc-300 border-zinc-700"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {language === 'ko' ? '고급 편집기' : 'Advanced Editor'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-amber-500 hover:bg-amber-400 text-black"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {exportProgress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {language === 'ko' ? '다운로드' : 'Download'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col" ref={containerRef}>
          <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
            <div className="relative max-w-full max-h-full">
              <video
                ref={videoRef}
                src={videoUrl}
                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                style={getFilterStyle()}
                crossOrigin="anonymous"
              />

              {/* Text Overlays Preview */}
              {textOverlays.map(overlay => (
                currentTime >= overlay.startTime && currentTime <= overlay.endTime && (
                  <div
                    key={overlay.id}
                    className={`absolute cursor-move select-none ${
                      selectedTextId === overlay.id ? 'ring-2 ring-amber-500' : ''
                    }`}
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontWeight: overlay.fontWeight,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    }}
                    onClick={() => setSelectedTextId(overlay.id)}
                  >
                    {overlay.text}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800">
            {/* Progress Bar */}
            <div className="relative mb-4">
              {/* Trim markers */}
              <div
                className="absolute top-0 bottom-0 bg-amber-500/20 rounded"
                style={{
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`,
                }}
              />
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 1}
                step={0.1}
                onValueChange={handleSeek}
                className="relative z-10"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <span className="text-sm text-zinc-400 font-mono ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={100}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Edit Tools */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 p-1 m-2">
              <TabsTrigger value="trim" className="text-xs">
                <Scissors className="w-3 h-3 mr-1" />
                {language === 'ko' ? '트림' : 'Trim'}
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                {language === 'ko' ? '텍스트' : 'Text'}
              </TabsTrigger>
              <TabsTrigger value="filter" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                {language === 'ko' ? '필터' : 'Filter'}
              </TabsTrigger>
            </TabsList>

            {/* Trim Tab */}
            <TabsContent value="trim" className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <Label className="text-zinc-400">
                  {language === 'ko' ? '시작 지점' : 'Start Point'}
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[trimStart]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={(v) => setTrimStart(Math.min(v[0], trimEnd - 0.5))}
                    className="flex-1"
                  />
                  <span className="text-xs text-zinc-500 font-mono w-16">
                    {formatTime(trimStart)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-400">
                  {language === 'ko' ? '종료 지점' : 'End Point'}
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[trimEnd]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={(v) => setTrimEnd(Math.max(v[0], trimStart + 0.5))}
                    className="flex-1"
                  />
                  <span className="text-xs text-zinc-500 font-mono w-16">
                    {formatTime(trimEnd)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {language === 'ko' ? '편집된 길이' : 'Edited Length'}
                  </span>
                  <span className="text-amber-400 font-mono">
                    {formatTime(trimEnd - trimStart)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  const video = videoRef.current
                  if (video) {
                    video.currentTime = trimStart
                    setCurrentTime(trimStart)
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {language === 'ko' ? '시작점으로 이동' : 'Go to Start'}
              </Button>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="flex-1 p-4 space-y-4 overflow-y-auto">
              <Button onClick={addTextOverlay} className="w-full bg-amber-500 hover:bg-amber-400 text-black">
                <Type className="w-4 h-4 mr-2" />
                {language === 'ko' ? '텍스트 추가' : 'Add Text'}
              </Button>

              {textOverlays.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    {language === 'ko' ? '텍스트 목록' : 'Text List'}
                  </Label>
                  {textOverlays.map(overlay => (
                    <div
                      key={overlay.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTextId === overlay.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      onClick={() => setSelectedTextId(overlay.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{overlay.text}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-zinc-500 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTextOverlay(overlay.id)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedText && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">
                      {language === 'ko' ? '텍스트 내용' : 'Text Content'}
                    </Label>
                    <Input
                      value={selectedText.text}
                      onChange={(e) => updateTextOverlay(selectedText.id, { text: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">
                        {language === 'ko' ? '글자 크기' : 'Font Size'}
                      </Label>
                      <Slider
                        value={[selectedText.fontSize]}
                        min={12}
                        max={72}
                        onValueChange={(v) => updateTextOverlay(selectedText.id, { fontSize: v[0] })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">
                        {language === 'ko' ? '색상' : 'Color'}
                      </Label>
                      <Input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateTextOverlay(selectedText.id, { color: e.target.value })}
                        className="h-9 p-1 bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">X {language === 'ko' ? '위치' : 'Position'}</Label>
                      <Slider
                        value={[selectedText.x]}
                        min={0}
                        max={100}
                        onValueChange={(v) => updateTextOverlay(selectedText.id, { x: v[0] })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">Y {language === 'ko' ? '위치' : 'Position'}</Label>
                      <Slider
                        value={[selectedText.y]}
                        min={0}
                        max={100}
                        onValueChange={(v) => updateTextOverlay(selectedText.id, { y: v[0] })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Filter Tab */}
            <TabsContent value="filter" className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Preset Filters */}
              <div className="space-y-2">
                <Label className="text-zinc-400">
                  {language === 'ko' ? '프리셋' : 'Presets'}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_FILTERS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setFilter(preset.filter)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        JSON.stringify(filter) === JSON.stringify(preset.filter)
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                      }`}
                    >
                      {language === 'ko' ? preset.name : preset.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Adjustments */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <Label className="text-zinc-400">
                  {language === 'ko' ? '수동 조정' : 'Manual Adjustments'}
                </Label>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">{language === 'ko' ? '밝기' : 'Brightness'}</span>
                      <span className="text-zinc-400">{filter.brightness}%</span>
                    </div>
                    <Slider
                      value={[filter.brightness]}
                      min={50}
                      max={150}
                      onValueChange={(v) => setFilter({ ...filter, brightness: v[0] })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">{language === 'ko' ? '대비' : 'Contrast'}</span>
                      <span className="text-zinc-400">{filter.contrast}%</span>
                    </div>
                    <Slider
                      value={[filter.contrast]}
                      min={50}
                      max={150}
                      onValueChange={(v) => setFilter({ ...filter, contrast: v[0] })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">{language === 'ko' ? '채도' : 'Saturation'}</span>
                      <span className="text-zinc-400">{filter.saturation}%</span>
                    </div>
                    <Slider
                      value={[filter.saturation]}
                      min={0}
                      max={200}
                      onValueChange={(v) => setFilter({ ...filter, saturation: v[0] })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">{language === 'ko' ? '흐림' : 'Blur'}</span>
                      <span className="text-zinc-400">{filter.blur}px</span>
                    </div>
                    <Slider
                      value={[filter.blur]}
                      min={0}
                      max={10}
                      step={0.5}
                      onValueChange={(v) => setFilter({ ...filter, blur: v[0] })}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilter(DEFAULT_FILTER)}
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  {language === 'ko' ? '초기화' : 'Reset'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
