export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          product_type: string | null
          target_market: string[] | null
          logo_url: string | null
          brand_colors: Json | null
          brand_voice: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          product_type?: string | null
          target_market?: string[] | null
          logo_url?: string | null
          brand_colors?: Json | null
          brand_voice?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          product_type?: string | null
          target_market?: string[] | null
          logo_url?: string | null
          brand_colors?: Json | null
          brand_voice?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      personas: {
        Row: {
          id: string
          brand_id: string
          name: string
          description: string | null
          age_range: string | null
          gender: string | null
          location: string[] | null
          job_title: string[] | null
          industry: string[] | null
          company_size: string | null
          pain_points: string[] | null
          goals: string[] | null
          values: string[] | null
          platforms: string[] | null
          content_preferences: Json | null
          confidence_score: number | null
          data_sources: string[] | null
          is_primary: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          description?: string | null
          age_range?: string | null
          gender?: string | null
          location?: string[] | null
          job_title?: string[] | null
          industry?: string[] | null
          company_size?: string | null
          pain_points?: string[] | null
          goals?: string[] | null
          values?: string[] | null
          platforms?: string[] | null
          content_preferences?: Json | null
          confidence_score?: number | null
          data_sources?: string[] | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          description?: string | null
          age_range?: string | null
          gender?: string | null
          location?: string[] | null
          job_title?: string[] | null
          industry?: string[] | null
          company_size?: string | null
          pain_points?: string[] | null
          goals?: string[] | null
          values?: string[] | null
          platforms?: string[] | null
          content_preferences?: Json | null
          confidence_score?: number | null
          data_sources?: string[] | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      contents: {
        Row: {
          id: string
          brand_id: string
          persona_id: string | null
          title: string | null
          body: string
          media_urls: string[] | null
          topic: string | null
          content_type: string | null
          ai_model: string | null
          ai_prompt: string | null
          generation_time_ms: number | null
          platform_variations: Json | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          persona_id?: string | null
          title?: string | null
          body: string
          media_urls?: string[] | null
          topic?: string | null
          content_type?: string | null
          ai_model?: string | null
          ai_prompt?: string | null
          generation_time_ms?: number | null
          platform_variations?: Json | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          persona_id?: string | null
          title?: string | null
          body?: string
          media_urls?: string[] | null
          topic?: string | null
          content_type?: string | null
          ai_model?: string | null
          ai_prompt?: string | null
          generation_time_ms?: number | null
          platform_variations?: Json | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      platform_connections: {
        Row: {
          id: string
          brand_id: string
          platform: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          platform_user_id: string | null
          platform_username: string | null
          is_active: boolean | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          platform: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          platform?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      published_posts: {
        Row: {
          id: string
          content_id: string
          platform: string
          platform_post_id: string | null
          platform_url: string | null
          published_at: string | null
          scheduled_for: string | null
          metrics: Json | null
          last_metrics_update: string | null
          status: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          platform: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          metrics?: Json | null
          last_metrics_update?: string | null
          status?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          platform?: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          metrics?: Json | null
          last_metrics_update?: string | null
          status?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          brand_id: string
          date: string
          platform: string
          posts_published: number | null
          total_impressions: number | null
          total_engagement: number | null
          total_clicks: number | null
          leads_generated: number | null
          conversions: number | null
          revenue: number | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          date: string
          platform: string
          posts_published?: number | null
          total_impressions?: number | null
          total_engagement?: number | null
          total_clicks?: number | null
          leads_generated?: number | null
          conversions?: number | null
          revenue?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          date?: string
          platform?: string
          posts_published?: number | null
          total_impressions?: number | null
          total_engagement?: number | null
          total_clicks?: number | null
          leads_generated?: number | null
          conversions?: number | null
          revenue?: number | null
          created_at?: string
        }
      }
    }
  }
}
