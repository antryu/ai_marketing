"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductInfoForm } from "@/components/onboarding/ProductInfoForm"
import { PersonaDisplay } from "@/components/onboarding/PersonaDisplay"
import { toast } from "sonner"
import { Flag, Target } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [personas, setPersonas] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleProductSubmit = async (data: any) => {
    setLoading(true)

    try {
      // 1. 브랜드 생성
      const brandResponse = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!brandResponse.ok) {
        throw new Error("브랜드 생성 실패")
      }

      const brand = await brandResponse.json()
      setProductInfo(brand)

      toast.success("제품 정보가 저장되었습니다!")

      // 2. AI 페르소나 생성
      const personaResponse = await fetch("/api/onboarding/generate-personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      })

      if (!personaResponse.ok) {
        throw new Error("페르소나 생성 실패")
      }

      const generatedPersonas = await personaResponse.json()
      setPersonas(generatedPersonas)

      toast.success("AI가 타겟 고객을 분석했습니다!")
      setStep(2)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    toast.success("온보딩 완료! 대시보드로 이동합니다.")
    router.push("/dashboard")
  }

  return (
    <div className="p-8 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className={`w-12 h-12 border-4 ${step >= 1 ? 'border-[#E10600] bg-[#E10600]' : 'border-gray-800'} flex items-center justify-center font-black text-xl`}>
              1
            </div>
            <div className={`h-1 w-32 ${step >= 2 ? 'bg-[#E10600]' : 'bg-gray-800'}`}></div>
            <div className={`w-12 h-12 border-4 ${step >= 2 ? 'border-[#E10600] bg-[#E10600]' : 'border-gray-800'} flex items-center justify-center font-black text-xl`}>
              2
            </div>
          </div>
          <div className="flex justify-between max-w-sm mx-auto mt-4">
            <span className="text-sm font-black uppercase">제품 정보</span>
            <span className="text-sm font-black uppercase">타겟 분석</span>
          </div>
        </div>

        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 border-l-4 border-[#E10600] pl-6 text-left">
              <Flag className="w-16 h-16 text-[#E10600] mb-4" />
              <h1 className="text-5xl font-black uppercase tracking-wider mb-4">
                제품 정보
              </h1>
              <p className="text-gray-400 text-lg uppercase tracking-wide">
                AI가 당신의 제품을 분석하고 최적의 마케팅 전략을 제안합니다
              </p>
            </div>

            <ProductInfoForm onSubmit={handleProductSubmit} loading={loading} />
          </div>
        )}

        {step === 2 && personas && (
          <div>
            <div className="text-center mb-12 border-l-4 border-[#E10600] pl-6 text-left max-w-4xl mx-auto">
              <Target className="w-16 h-16 text-[#E10600] mb-4" />
              <h1 className="text-5xl font-black uppercase tracking-wider mb-4">
                타겟 발견!
              </h1>
              <p className="text-gray-400 text-lg uppercase tracking-wide">
                AI가 분석한 {personas.length}개의 주요 고객 페르소나 - 이 페르소나들을 기반으로 맞춤 콘텐츠를 생성합니다
              </p>
            </div>

            <PersonaDisplay personas={personas} />

            <div className="mt-12 flex justify-center">
              <button
                onClick={handleComplete}
                className="bg-[#E10600] hover:bg-[#C10500] text-white font-black text-2xl uppercase py-6 px-12 transition-all transform hover:scale-105 border-2 border-white tracking-widest"
              >
                시작하기 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
