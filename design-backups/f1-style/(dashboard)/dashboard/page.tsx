"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, TrendingUp, Users, Zap, Flag } from "lucide-react"

export default function DashboardPage() {
  const [brands, setBrands] = useState<any[]>([])
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

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative text-center">
          <div className="w-20 h-20 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-white font-black text-xl uppercase tracking-wider">LOADING...</p>
        </div>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black border-2 border-[#E10600] p-12">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:8px_8px] opacity-20"></div>

          <Flag className="w-20 h-20 text-[#E10600] mb-6" />
          <h1 className="text-5xl font-black text-white uppercase mb-4 tracking-wider">
            RACE START
          </h1>
          <p className="text-gray-300 text-lg mb-8 uppercase tracking-wide">
            AI 마케팅 자동화를 시작하려면 먼저 제품 정보를 입력해주세요
          </p>
          <a
            href="/onboarding"
            className="inline-block w-full bg-[#E10600] hover:bg-[#C10500] text-white font-black text-xl uppercase py-4 px-8 transition-all transform hover:scale-105 border-2 border-white tracking-widest text-center"
          >
            시작하기 →
          </a>
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
    <div className="p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="border-l-4 border-[#E10600] pl-6">
          <h1 className="text-6xl font-black uppercase tracking-wider mb-2">DASHBOARD</h1>
          <p className="text-gray-400 uppercase tracking-wide text-lg">
            AI 마케팅 자동화 현황
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.name} className="relative group">
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#E10600] flex items-center justify-center font-black text-xl border-2 border-white">
                {index + 1}
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 group-hover:border-[#E10600] transition-all p-6 transform group-hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="w-8 h-8 text-[#E10600]" />
                  <span className="text-sm text-gray-500 font-bold uppercase">{stat.change}</span>
                </div>
                <div className="text-5xl font-black mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide font-bold">{stat.name}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 p-8">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-[#E10600] pb-4">
              <FileText className="w-8 h-8 text-[#E10600]" />
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide">최근 콘텐츠</h2>
                <p className="text-gray-500 text-sm uppercase">Recent Content</p>
              </div>
            </div>
            <div className="text-center py-12 border-2 border-dashed border-gray-800">
              <p className="text-gray-500 uppercase mb-4">아직 생성된 콘텐츠가 없습니다</p>
              <a
                href="/content/create"
                className="inline-block bg-[#E10600] hover:bg-[#C10500] text-white font-black uppercase py-3 px-6 transition-all border-2 border-white"
              >
                첫 콘텐츠 생성 →
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 p-8">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-[#E10600] pb-4">
              <Users className="w-8 h-8 text-[#E10600]" />
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide">타겟 페르소나</h2>
                <p className="text-gray-500 text-sm uppercase">Target Audience</p>
              </div>
            </div>
            {brands.length > 0 ? (
              <div className="space-y-4">
                {brands.map((brand) => (
                  <div key={brand.id} className="border-l-4 border-[#E10600] pl-4 py-2">
                    <div className="font-black text-xl uppercase">{brand.name}</div>
                    <div className="text-gray-400 text-sm mt-1">{brand.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-800">
                <p className="text-gray-500 uppercase">브랜드 정보 없음</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
