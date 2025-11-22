export interface PersonaContentPreferences {
  format: string[]
  tone: string
  topics: string[]
}

export interface Persona {
  id?: string
  brand_id: string
  name: string
  description?: string
  age_range?: string
  gender?: string
  location?: string[]
  job_title?: string[]
  industry?: string[]
  company_size?: string
  pain_points?: string[]
  goals?: string[]
  values?: string[]
  platforms?: string[]
  content_preferences?: PersonaContentPreferences
  confidence_score?: number
  data_sources?: string[]
  is_primary?: boolean
  created_at?: string
  updated_at?: string
}

export interface GeneratePersonasResponse {
  personas: Persona[]
}
