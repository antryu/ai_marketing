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
      // 1. 제품 생성
      const brandResponse = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!brandResponse.ok) {
        throw new Error("제품 생성 실패")
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
        {/* Enhanced Progress Bar with Energy - Porsche Style */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className={`w-12 h-12 border transition-all duration-500 ${
              step >= 1
                ? 'border-amber-400 bg-gradient-to-br from-amber-600 to-amber-500 shadow-lg shadow-amber-500/50'
                : 'border-zinc-700 bg-zinc-800'
            } flex items-center justify-center font-normal text-lg`}>
              1
            </div>
            <div className={`h-px w-32 transition-all duration-500 ${
              step >= 2 ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-zinc-800'
            }`}></div>
            <div className={`w-12 h-12 border transition-all duration-500 ${
              step >= 2
                ? 'border-amber-400 bg-gradient-to-br from-amber-600 to-amber-500 shadow-lg shadow-amber-500/50'
                : 'border-zinc-700 bg-zinc-800'
            } flex items-center justify-center font-normal text-lg`}>
              2
            </div>
          </div>
          <div className="flex justify-between max-w-sm mx-auto mt-4">
            <span className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
              step >= 1 ? 'text-amber-400' : 'text-zinc-400'
            }`}>제품 정보</span>
            <span className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
              step >= 2 ? 'text-amber-400' : 'text-zinc-400'
            }`}>타겟 분석</span>
          </div>
        </div>

        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
                  <Flag className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <h1 className="text-5xl font-light tracking-wide mb-4 text-white">
                제품 정보
              </h1>
              <div className="flex justify-center mb-6">
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              </div>
              <p className="text-zinc-300 text-base font-normal tracking-wide">
                AI가 당신의 제품을 분석하고 최적의 마케팅 전략을 제안합니다
              </p>
            </div>

            <ProductInfoForm onSubmit={handleProductSubmit} loading={loading} />
          </div>
        )}

        {step === 2 && personas && (
          <div>
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center">
                  <Target className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <h1 className="text-5xl font-light tracking-wide mb-4 text-white">
                타겟 발견
              </h1>
              <div className="flex justify-center mb-6">
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              </div>
              <p className="text-zinc-300 text-base font-normal tracking-wide">
                AI가 분석한 {personas.length}개의 주요 고객 페르소나 - 이 페르소나들을 기반으로 맞춤 콘텐츠를 생성합니다
              </p>
            </div>

            <PersonaDisplay personas={personas} />

            <div className="mt-12 flex justify-center">
              <button
                onClick={handleComplete}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium text-lg py-4 px-12 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
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
