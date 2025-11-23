"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, TrendingUp, Users, Zap, Flag } from "lucide-react"

export default function DashboardPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false })

      if (brandsData) {
        setBrands(brandsData)
      }

      const { data: personasData } = await supabase
        .from("personas")
        .select("*")
        .order("created_at", { ascending: false })

      if (personasData) {
        setPersonas(personasData)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative text-center">
          <div className="w-20 h-20 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-white font-normal text-lg tracking-wide">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { name: "총 콘텐츠", value: "0", icon: FileText, change: "+0%" },
    { name: "발행 포스트", value: "0", icon: TrendingUp, change: "+0%" },
    { name: "총 조회수", value: "0", icon: Users, change: "+0%" },
    { name: "참여율", value: "0%", icon: Zap, change: "+0%" },
  ]

  return (
    <div className="p-12 text-white">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="relative">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent"></div>
          <h1 className="text-4xl font-light tracking-wide mb-3">개요</h1>
          <p className="text-zinc-300 font-normal text-base tracking-wide">
            주요 지표 및 최근 활동
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.name} className="relative group cursor-pointer">
              {/* Energy accent line with animation */}
              <div className="absolute -top-2 -left-2 w-1 h-16 bg-gradient-to-b from-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

              {/* Card with smooth hover effects */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 group-hover:border-amber-400/50 transition-all duration-300 p-8 group-hover:shadow-lg group-hover:shadow-amber-400/10 group-hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <stat.icon className="w-7 h-7 text-zinc-400 group-hover:text-amber-400 transition-all duration-300 group-hover:scale-110" />
                  <span className="text-xs text-zinc-400 font-normal tracking-wider group-hover:text-amber-400 transition-colors duration-300">{stat.change}</span>
                </div>
                <div className="text-4xl font-light mb-3 tracking-wide group-hover:text-white transition-colors duration-300">{stat.value}</div>
                <div className="text-xs text-zinc-300 tracking-widest font-medium uppercase group-hover:text-zinc-200 transition-colors duration-300">{stat.name}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Recent Content Card with hover effects */}
          <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-10 hover:shadow-lg hover:shadow-amber-400/5">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-700 group-hover:border-zinc-600 transition-colors duration-300">
              <FileText className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h2 className="text-xl font-light tracking-wide group-hover:text-white transition-colors duration-300">최근 콘텐츠</h2>
                <p className="text-zinc-300 text-xs font-normal tracking-wider">최신 생성 콘텐츠</p>
              </div>
            </div>
            <div className="text-center py-16 border border-dashed border-zinc-700">
              <p className="text-zinc-300 font-normal mb-6 tracking-wide">아직 생성된 콘텐츠가 없습니다</p>
              <a
                href="/content/create"
                className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
              >
                첫 콘텐츠 생성 →
              </a>
            </div>
          </div>

          {/* Target Persona Card with hover effects */}
          <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-10 hover:shadow-lg hover:shadow-amber-400/5">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-700 group-hover:border-zinc-600 transition-colors duration-300">
              <Users className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h2 className="text-xl font-light tracking-wide group-hover:text-white transition-colors duration-300">타겟 페르소나</h2>
                <p className="text-zinc-300 text-xs font-normal tracking-wider">목표 고객층</p>
              </div>
            </div>
            {personas.length > 0 ? (
              <div className="space-y-4">
                {personas.map((persona) => (
                  <div key={persona.id} className="group/item border-l-2 border-amber-400 hover:border-amber-300 pl-6 py-3 transition-all duration-300 hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="font-normal text-lg tracking-wide group-hover/item:text-white transition-colors duration-300">{persona.name}</div>
                      {persona.is_primary && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">주요</span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-sm mt-2 font-normal group-hover/item:text-zinc-300 transition-colors duration-300">{persona.description}</div>
                    {persona.age_range && (
                      <div className="text-zinc-500 text-xs mt-1">{persona.age_range} · {persona.job_title?.join(", ")}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-zinc-700">
                <p className="text-zinc-300 font-normal mb-6 tracking-wide">아직 페르소나가 없습니다</p>
                <a
                  href="/onboarding"
                  className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
                >
                  페르소나 생성하기 →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
