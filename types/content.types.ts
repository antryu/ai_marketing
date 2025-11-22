export interface ContentMetadata {
  hook_strength?: 'high' | 'medium' | 'low'
  estimated_engagement?: 'high' | 'medium' | 'low'
  length?: number
  video_project_id?: string
  video_duration?: number
}

export interface PlatformVariation {
  text: string
  hashtags?: string[]
  metadata?: ContentMetadata
}

export interface Content {
  id?: string
  brand_id: string
  persona_id?: string
  title?: string
  body: string
  media_urls?: string[]
  topic?: string
  content_type?: 'text' | 'image' | 'video' | 'carousel'
  ai_model?: string
  ai_prompt?: string
  generation_time_ms?: number
  platform_variations?: {
    threads?: PlatformVariation
    linkedin?: PlatformVariation
    [key: string]: PlatformVariation | undefined
  }
  status?: 'draft' | 'scheduled' | 'published' | 'failed'
  created_at?: string
  updated_at?: string
}

export interface GenerateContentParams {
  brand: any
  persona: any
  topic: string
  platform: 'threads' | 'linkedin'
}

export interface GenerateContentResponse {
  content: string
  hashtags: string[]
  metadata: ContentMetadata
}
