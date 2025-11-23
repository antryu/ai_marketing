import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sepnrqzjccjrtssvytow.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG5ycXpqY2NqcnRzc3Z5dG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTk4MDUsImV4cCI6MjA3ODc3NTgwNX0.9bSgdRlnjBQtAMNqoUAjIk8ZVd8WbzgQiLM-l-mu_dw'
  )
