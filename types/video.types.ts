// 비디오 편집 관련 타입 정의

export type VideoFormat = '16:9' | '9:16' | '1:1' | '4:5'
export type VideoQuality = '720p' | '1080p' | '4k'
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'none'
export type AnimationType = 'fadeIn' | 'fadeOut' | 'slideUp' | 'slideDown' | 'zoomIn' | 'zoomOut' | 'bounce'

export interface VideoTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  format: VideoFormat
  duration: number
  scenes: VideoScene[]
  category: 'product' | 'testimonial' | 'promo' | 'story' | 'tutorial'
}

export interface VideoScene {
  id: string
  order: number
  duration: number
  background: BackgroundConfig
  elements: SceneElement[]
  transition?: TransitionConfig
  audio?: AudioConfig
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'video'
  value: string | GradientConfig
  blur?: number
  opacity?: number
}

export interface GradientConfig {
  type: 'linear' | 'radial'
  colors: string[]
  angle?: number
}

export interface SceneElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'logo'
  position: Position
  size: Size
  content?: string
  src?: string
  style?: ElementStyle
  animation?: AnimationConfig
}

export interface Position {
  x: number
  y: number
  z?: number
}

export interface Size {
  width: number
  height: number
}

export interface ElementStyle {
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  color?: string
  backgroundColor?: string
  borderRadius?: number
  padding?: number
  textAlign?: 'left' | 'center' | 'right'
  opacity?: number
  shadow?: ShadowConfig
}

export interface ShadowConfig {
  x: number
  y: number
  blur: number
  color: string
}

export interface AnimationConfig {
  type: AnimationType
  duration: number
  delay?: number
  easing?: string
}

export interface TransitionConfig {
  type: TransitionType
  duration: number
}

export interface AudioConfig {
  src: string
  volume: number
  fadeIn?: number
  fadeOut?: number
  loop?: boolean
}

export interface VideoProject {
  id: string
  brand_id: string
  title: string
  format: VideoFormat
  quality: VideoQuality
  duration: number
  scenes: VideoScene[]
  backgroundMusic?: AudioConfig
  status: 'draft' | 'rendering' | 'completed' | 'failed'
  thumbnail?: string
  output_url?: string
  created_at: string
  updated_at: string
}

export interface RenderOptions {
  format: VideoFormat
  quality: VideoQuality
  fps: number
  codec: 'h264' | 'h265' | 'vp9'
  includeAudio: boolean
}

export interface VideoGenerationParams {
  brand: any
  topic: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin'
  duration: number
  style?: 'minimal' | 'professional' | 'creative' | 'energetic'
}
