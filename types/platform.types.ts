export type Platform = 'threads' | 'linkedin' | 'instagram' | 'youtube'

export interface PlatformConnection {
  id?: string
  brand_id: string
  platform: Platform
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  platform_user_id?: string
  platform_username?: string
  is_active?: boolean
  last_synced_at?: string
  created_at?: string
  updated_at?: string
}

export interface PublishPostResult {
  postId: string
  url: string
}

export interface PostAnalytics {
  views?: number
  likes?: number
  replies?: number
  reposts?: number
  shares?: number
  comments?: number
  impressions?: number
  engagement?: number
  clicks?: number
}
