'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { VideoProject, VideoScene } from '@/types/video.types'

let ffmpeg: FFmpeg | null = null

export async function initFFmpeg() {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  })

  return ffmpeg
}

export async function renderVideoProject(project: VideoProject): Promise<Blob> {
  const ffmpegInstance = await initFFmpeg()

  // Generate frames for each scene
  const frames: Blob[] = []

  for (const scene of project.scenes) {
    const sceneFrames = await renderScene(scene, project.format)
    frames.push(...sceneFrames)
  }

  // Combine frames into video using FFmpeg
  // This is a simplified version - actual implementation would be more complex
  const videoBlob = await combineFrames(ffmpegInstance, frames, project)

  return videoBlob
}

async function renderScene(scene: VideoScene, format: string): Promise<Blob[]> {
  // Create canvas for each frame
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const dimensions = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 }
  }

  const { width, height } = dimensions[format as keyof typeof dimensions]
  canvas.width = width
  canvas.height = height

  // Render background
  renderBackground(ctx, scene.background, width, height)

  // Render elements
  for (const element of scene.elements) {
    renderElement(ctx, element, width, height)
  }

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })

  return [blob]
}

function renderBackground(
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
      grd = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 2
      )
    }

    gradient.colors.forEach((color, index) => {
      grd.addColorStop(index / (gradient.colors.length - 1), color)
    })

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, width, height)
  }
}

function renderElement(
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

  if (element.style?.opacity !== undefined) {
    ctx.globalAlpha = element.style.opacity
  }

  if (element.style?.shadow) {
    const shadow = element.style.shadow
    ctx.shadowOffsetX = shadow.x
    ctx.shadowOffsetY = shadow.y
    ctx.shadowBlur = shadow.blur
    ctx.shadowColor = shadow.color
  }

  if (element.type === 'text' && element.content) {
    const fontSize = element.style?.fontSize || 24
    const fontFamily = element.style?.fontFamily || 'Inter, sans-serif'
    const fontWeight = element.style?.fontWeight || 600

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = element.style?.color || '#000000'
    ctx.textAlign = (element.style?.textAlign as CanvasTextAlign) || 'left'
    ctx.textBaseline = 'top'

    if (element.style?.backgroundColor) {
      const metrics = ctx.measureText(element.content)
      const padding = element.style?.padding || 0
      ctx.fillStyle = element.style.backgroundColor
      ctx.fillRect(x - padding, y - padding, metrics.width + padding * 2, fontSize + padding * 2)
      ctx.fillStyle = element.style?.color || '#000000'
    }

    // Handle multi-line text
    const lines = element.content.split('\n')
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * fontSize * 1.2)
    })
  } else if (element.type === 'shape') {
    ctx.fillStyle = element.style?.backgroundColor || '#000000'

    if (element.style?.borderRadius) {
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

async function combineFrames(
  ffmpeg: FFmpeg,
  frames: Blob[],
  project: VideoProject
): Promise<Blob> {
  // Write frames to FFmpeg file system
  for (let i = 0; i < frames.length; i++) {
    const data = await fetchFile(frames[i])
    await ffmpeg.writeFile(`frame${i.toString().padStart(4, '0')}.png`, data)
  }

  // Run FFmpeg command to create video
  const fps = 30
  await ffmpeg.exec([
    '-framerate', fps.toString(),
    '-i', 'frame%04d.png',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '23',
    'output.mp4'
  ])

  // Read output file
  const data = await ffmpeg.readFile('output.mp4')
  const blob = new Blob([data], { type: 'video/mp4' })

  return blob
}

export async function downloadVideo(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Simplified canvas-only export (without FFmpeg)
export async function exportAsGIF(project: VideoProject): Promise<Blob> {
  // This would require a GIF encoder library
  // For now, return a placeholder
  throw new Error('GIF export not yet implemented')
}

export async function exportAsImages(project: VideoProject): Promise<Blob[]> {
  const images: Blob[] = []

  for (const scene of project.scenes) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const dimensions = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 }
    }

    const { width, height } = dimensions[project.format as keyof typeof dimensions]
    canvas.width = width
    canvas.height = height

    renderBackground(ctx, scene.background, width, height)

    for (const element of scene.elements) {
      renderElement(ctx, element, width, height)
    }

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png')
    })

    images.push(blob)
  }

  return images
}
