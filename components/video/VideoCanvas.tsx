'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { VideoScene, VideoFormat } from '@/types/video.types'
import Image from 'next/image'

interface VideoCanvasProps {
  scene?: VideoScene
  format: VideoFormat
  isPlaying?: boolean
  width?: number
  height?: number
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail: string
}

const CANVAS_DIMENSIONS = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 }
}

export function VideoCanvas({ scene, format, isPlaying, width, height }: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [backgroundMedia, setBackgroundMedia] = useState<MediaItem | null>(null)
  const [loadingMedia, setLoadingMedia] = useState(false)

  const dimensions = CANVAS_DIMENSIONS[format]
  const displayWidth = width || dimensions.width
  const displayHeight = height || dimensions.height

  // Fetch background media based on scene content
  useEffect(() => {
    if (!scene) return

    const fetchMedia = async () => {
      // Extract keywords from scene for image search
      const keywords = scene.elements
        .filter(el => el.type === 'text' && el.content)
        .map(el => el.content)
        .join(' ')

      if (!keywords) return

      setLoadingMedia(true)
      try {
        const response = await fetch(`/api/pexels?query=${encodeURIComponent(keywords)}&per_page=1`)
        const data = await response.json()

        if (data.success && data.results?.length > 0) {
          setBackgroundMedia(data.results[0])
        }
      } catch (error) {
        console.error('Failed to fetch media:', error)
      } finally {
        setLoadingMedia(false)
      }
    }

    fetchMedia()
  }, [scene?.id])

  // Calculate scale to fit in container
  useEffect(() => {
    if (!containerRef.current) return

    const updateScale = () => {
      const container = containerRef.current!
      const containerWidth = container.clientWidth - 64
      const containerHeight = container.clientHeight - 64

      const scaleX = containerWidth / dimensions.width
      const scaleY = containerHeight / dimensions.height
      setScale(Math.min(scaleX, scaleY, 1))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [dimensions])

  // Render scene to canvas
  useEffect(() => {
    if (!canvasRef.current || !scene) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    drawBackground(ctx, scene.background, canvas.width, canvas.height)

    // Draw elements
    scene.elements.forEach(element => {
      drawElement(ctx, element, canvas.width, canvas.height)
    })
  }, [scene])

  if (!scene) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center w-full h-full"
        style={{
          aspectRatio: format === '16:9' ? '16/9' : format === '9:16' ? '9/16' : format === '1:1' ? '1/1' : '4/5'
        }}
      >
        <div className="text-center text-zinc-500">
          <p>씬을 선택하거나 추가해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative shadow-2xl rounded-lg overflow-hidden"
        style={{
          width: dimensions.width * scale,
          height: dimensions.height * scale
        }}
      >
        {/* Background Image Layer */}
        {backgroundMedia && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundMedia.url}
              alt="Scene background"
              className="w-full h-full object-cover"
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Loading indicator */}
        {loadingMedia && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">이미지 로딩중...</span>
            </div>
          </div>
        )}

        {/* Canvas for text/shapes overlay */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full relative z-10"
          style={{ backgroundColor: backgroundMedia ? 'transparent' : undefined }}
        />

        {/* Scene info overlay */}
        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
          씬 {scene.order + 1} • {scene.duration}초
        </div>

        {/* Media source credit */}
        {backgroundMedia && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
            📷 Unsplash/Pexels
          </div>
        )}
      </motion.div>
    </div>
  )
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  background: VideoScene['background'],
  width: number,
  height: number
) {
  if (background.type === 'color') {
    ctx.fillStyle = background.value as string
    ctx.fillRect(0, 0, width, height)
  } else if (background.type === 'gradient' && typeof background.value === 'object') {
    const gradient = background.value
    let grd: CanvasGradient

    if (gradient.type === 'linear') {
      const angle = (gradient.angle || 0) * (Math.PI / 180)
      const x1 = width / 2 - Math.cos(angle) * width / 2
      const y1 = height / 2 - Math.sin(angle) * height / 2
      const x2 = width / 2 + Math.cos(angle) * width / 2
      const y2 = height / 2 + Math.sin(angle) * height / 2
      grd = ctx.createLinearGradient(x1, y1, x2, y2)
    } else {
      grd = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
    }

    gradient.colors.forEach((color, index) => {
      grd.addColorStop(index / (gradient.colors.length - 1), color)
    })

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, width, height)
  }

  // Apply opacity if specified
  if (background.opacity !== undefined && background.opacity < 1) {
    ctx.globalAlpha = background.opacity
  }
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  element: VideoScene['elements'][0],
  canvasWidth: number,
  canvasHeight: number
) {
  const x = (element.position.x / 100) * canvasWidth
  const y = (element.position.y / 100) * canvasHeight
  const width = (element.size.width / 100) * canvasWidth
  const height = (element.size.height / 100) * canvasHeight

  ctx.save()

  // Apply opacity
  if (element.style?.opacity !== undefined) {
    ctx.globalAlpha = element.style.opacity
  }

  // Apply shadow
  if (element.style?.shadow) {
    const shadow = element.style.shadow
    ctx.shadowOffsetX = shadow.x
    ctx.shadowOffsetY = shadow.y
    ctx.shadowBlur = shadow.blur
    ctx.shadowColor = shadow.color
  }

  if (element.type === 'text' && element.content) {
    // Draw text
    const fontSize = element.style?.fontSize || 24
    const fontFamily = element.style?.fontFamily || 'Inter, sans-serif'
    const fontWeight = element.style?.fontWeight || 600

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = element.style?.color || '#000000'
    ctx.textAlign = (element.style?.textAlign as CanvasTextAlign) || 'left'
    ctx.textBaseline = 'top'

    // Background for text
    if (element.style?.backgroundColor) {
      const metrics = ctx.measureText(element.content)
      const padding = element.style?.padding || 0
      ctx.fillStyle = element.style.backgroundColor
      ctx.fillRect(
        x - padding,
        y - padding,
        metrics.width + padding * 2,
        fontSize + padding * 2
      )
      ctx.fillStyle = element.style?.color || '#000000'
    }

    ctx.fillText(element.content, x, y)
  } else if (element.type === 'shape') {
    ctx.fillStyle = element.style?.backgroundColor || '#000000'

    if (element.style?.borderRadius) {
      // Rounded rectangle
      const radius = element.style.borderRadius
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.fillRect(x, y, width, height)
    }
  }

  ctx.restore()
}
