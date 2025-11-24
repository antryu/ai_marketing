"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Brand {
  id: string
  name: string
  description: string
  product_type: string
  target_market: string[]
  brand_voice: {
    tone: string
    style: string
    values: string[]
  }
  created_at: string
}

interface BrandContextType {
  selectedBrandId: string | null
  setSelectedBrandId: (id: string | null) => void
  brands: Brand[]
  loading: boolean
  refreshBrands: () => Promise<void>
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export function BrandProvider({ children }: { children: ReactNode }) {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  const loadBrands = async () => {
    try {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        const brands = data as Brand[]
        setBrands(brands)

        // Auto-select first brand if none selected
        if (!selectedBrandId) {
          setSelectedBrandId(brands[0].id)
        }
      }
    } catch (error) {
      console.error("Error loading brands:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const refreshBrands = async () => {
    await loadBrands()
  }

  return (
    <BrandContext.Provider
      value={{
        selectedBrandId,
        setSelectedBrandId,
        brands,
        loading,
        refreshBrands,
      }}
    >
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider")
  }
  return context
}
