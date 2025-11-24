"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, Target, User, Sparkles, FileText, TrendingUp, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useBrand } from "@/contexts/BrandContext"

export default function DashboardPage() {
  const { selectedBrandId } = useBrand()
  const [brands, setBrands] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [writerPersonas, setWriterPersonas] = useState<any[]>([])
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!selectedBrandId) {
        setLoading(false)
        return
      }

      const supabase = createClient()

      const [brandsRes, personasRes, writerPersonasRes, contentsRes] = await Promise.all([
        supabase.from("brands").select("*").eq("id", selectedBrandId),
        supabase.from("personas").select("*").eq("brand_id", selectedBrandId).order("created_at", { ascending: false }),
        supabase.from("writer_personas").select("*").eq("brand_id", selectedBrandId).order("created_at", { ascending: false }),
        supabase.from("contents").select("*").eq("brand_id", selectedBrandId).order("created_at", { ascending: false }).limit(5),
      ])

      if (brandsRes.data) setBrands(brandsRes.data)
      if (personasRes.data) setPersonas(personasRes.data)
      if (writerPersonasRes.data) setWriterPersonas(writerPersonasRes.data)
      if (contentsRes.data) setContents(contentsRes.data)

      setLoading(false)
    }

    loadData()
  }, [selectedBrandId])

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

  const hasBrand = brands.length > 0
  const hasPersonas = personas.length > 0
  const hasWriterPersonas = writerPersonas.length > 0
  const hasContent = contents.length > 0

  const setupSteps = [
    {
      title: "브랜드 설정",
      description: "제품, 서비스, 브랜드 정보 입력",
      icon: Building2,
      href: "/brand",
      completed: hasBrand,
      count: brands.length,
    },
    {
      title: "타겟 고객",
      description: "목표 고객층 정의",
      icon: Target,
      href: "/personas",
      completed: hasPersonas,
      count: personas.length,
    },
    {
      title: "브랜드 보이스",
      description: "브랜드 톤앤매너 설정",
      icon: User,
      href: "/writer-personas",
      completed: hasWriterPersonas,
      count: writerPersonas.length,
    },
    {
      title: "콘텐츠 생성",
      description: "AI 콘텐츠 자동 생성",
      icon: Sparkles,
      href: "/content/create",
      completed: hasContent,
      count: contents.length,
    },
  ]

  const completedSteps = setupSteps.filter(step => step.completed).length
  const progress = (completedSteps / setupSteps.length) * 100

  return (
    <div className="p-4 md:p-8 lg:p-12 text-white">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-16">
        {/* Header */}
        <div className="relative">
          <div className="absolute -left-4 md:-left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent hidden md:block"></div>
          <h1 className="text-2xl md:text-4xl font-light tracking-wide mb-2 md:mb-3">대시보드</h1>
          <p className="text-zinc-300 font-normal text-sm md:text-base tracking-wide">
            AI 마케팅 자동화 현황
          </p>
        </div>

        {/* Setup Progress */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-light tracking-wide mb-2">시작 가이드</h2>
              <p className="text-zinc-400 text-xs md:text-sm">
                {completedSteps}/{setupSteps.length} 단계 완료
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-light text-amber-400">{Math.round(progress)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Setup Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {setupSteps.map((step, index) => (
              <Link key={step.title} href={step.href}>
                <div className="group relative bg-zinc-900/50 border border-zinc-700 hover:border-amber-400/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10 cursor-pointer h-full">
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>

                  {/* Status Icon */}
                  <div className="absolute -top-3 -right-3">
                    {step.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex flex-col h-full">
                    <step.icon className="w-10 h-10 text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300" />

                    <h3 className="text-lg font-medium text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-sm text-zinc-400 mb-4 flex-1">
                      {step.description}
                    </p>

                    {step.completed && (
                      <div className="text-xs text-amber-400 font-medium">
                        {step.count}개 등록됨
                      </div>
                    )}

                    {!step.completed && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
                        시작하기 <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Recent Content */}
          <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-6 md:p-10">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-zinc-700">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              <div>
                <h2 className="text-lg md:text-xl font-light tracking-wide">최근 콘텐츠</h2>
                <p className="text-zinc-300 text-xs font-normal tracking-wider">최신 생성 콘텐츠</p>
              </div>
            </div>

            {hasContent ? (
              <div className="space-y-3 md:space-y-4">
                {contents.slice(0, 3).map((content) => (
                  <Link key={content.id} href={`/content/${content.id}`}>
                    <div className="border-l-2 border-amber-400 hover:border-amber-300 pl-4 md:pl-6 py-2 md:py-3 transition-all duration-300 hover:bg-zinc-800/50 cursor-pointer">
                      <div className="font-normal text-sm md:text-base tracking-wide">
                        {content.title || "제목 없음"}
                      </div>
                      <div className="text-zinc-400 text-xs md:text-sm mt-1">
                        {content.created_at && new Date(content.created_at).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16 border border-dashed border-zinc-700">
                <p className="text-zinc-300 font-normal mb-4 md:mb-6 tracking-wide text-sm md:text-base">아직 생성된 콘텐츠가 없습니다</p>
                <Link
                  href="/content/create"
                  className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-2 md:py-3 px-6 md:px-8 text-sm md:text-base transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50"
                >
                  첫 콘텐츠 생성 →
                </Link>
              </div>
            )}
          </div>

          {/* Target Personas */}
          <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 transition-all duration-300 p-6 md:p-10">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-zinc-700">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              <div>
                <h2 className="text-lg md:text-xl font-light tracking-wide">타겟 고객</h2>
                <p className="text-zinc-300 text-xs font-normal tracking-wider">목표 고객층</p>
              </div>
            </div>

            {hasPersonas ? (
              <div className="space-y-3 md:space-y-4">
                {personas.slice(0, 3).map((persona) => (
                  <div key={persona.id} className="border-l-2 border-amber-400 hover:border-amber-300 pl-4 md:pl-6 py-2 md:py-3 transition-all duration-300 hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="font-normal text-sm md:text-base tracking-wide">{persona.name}</div>
                      {persona.is_primary && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">주요</span>
                      )}
                    </div>
                    {persona.age_range && (
                      <div className="text-zinc-400 text-xs md:text-sm mt-1">{persona.age_range}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16 border border-dashed border-zinc-700">
                <p className="text-zinc-300 font-normal mb-4 md:mb-6 tracking-wide text-sm md:text-base">아직 타겟 고객이 없습니다</p>
                <Link
                  href="/personas"
                  className="inline-block bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-2 md:py-3 px-6 md:px-8 text-sm md:text-base transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50"
                >
                  타겟 고객 설정하기 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
