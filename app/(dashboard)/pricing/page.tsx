"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Crown, Users } from "lucide-react"
import { toast } from "sonner"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      name: "Standard",
      icon: Zap,
      description: "개인 및 소규모 비즈니스를 위한 기본 플랜",
      monthlyPrice: 25,
      yearlyPrice: 250, // 2개월 무료
      color: "amber",
      features: [
        "월 100개 콘텐츠 생성",
        "3개 플랫폼 연동 (Threads, LinkedIn, X)",
        "플랫폼별 자동 최적화",
        "10개 작성자 페르소나",
        "기본 성과 분석",
        "이메일 지원",
      ],
      limitations: [
        "예약 발행: 10개/월",
        "브랜드: 1개",
      ],
    },
    {
      name: "Pro",
      icon: Crown,
      description: "성장하는 비즈니스를 위한 프로 플랜",
      monthlyPrice: 99,
      yearlyPrice: 990,
      color: "purple",
      popular: true,
      features: [
        "월 500개 콘텐츠 생성",
        "모든 플랫폼 연동 무제한",
        "AI 기반 성과 개선 제안",
        "무제한 작성자 페르소나",
        "고급 성과 분석 & 대시보드",
        "우선 이메일 지원",
        "A/B 테스팅",
        "커스텀 브랜딩",
      ],
      limitations: [
        "예약 발행: 무제한",
        "브랜드: 5개",
        "팀 멤버: 3명",
      ],
    },
    {
      name: "Team",
      icon: Users,
      description: "팀 협업을 위한 엔터프라이즈 플랜",
      monthlyPrice: 199,
      yearlyPrice: 1990,
      color: "blue",
      features: [
        "월 2,000개 콘텐츠 생성",
        "모든 Pro 기능 포함",
        "ERP 연동 & ROI 추적",
        "전담 계정 매니저",
        "24/7 우선 지원",
        "커스텀 AI 모델 튜닝",
        "화이트라벨 옵션",
        "API 액세스",
      ],
      limitations: [
        "브랜드: 무제한",
        "팀 멤버: 10명",
        "워크스페이스: 3개",
      ],
    },
  ]

  const handleSubscribe = (planName: string) => {
    toast.info(`${planName} 플랜 결제 기능은 Stripe 연동 후 사용 가능합니다`)
    // TODO: Implement Stripe payment
  }

  const getColorClasses = (color: string, type: "bg" | "border" | "text") => {
    const colors = {
      amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-400" },
      purple: { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-400" },
      blue: { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-400" },
    }
    return colors[color as keyof typeof colors]?.[type] || colors.amber[type]
  }

  return (
    <div className="p-12 text-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-light tracking-wide">요금제</h1>
          <p className="text-xl text-zinc-300 font-normal max-w-2xl mx-auto">
            비즈니스 규모에 맞는 플랜을 선택하세요
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded transition-all ${
                billingCycle === "monthly"
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              연간 결제
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                20% 할인
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice

            return (
              <Card
                key={plan.name}
                className={`bg-zinc-900 border-2 transition-all hover:scale-105 duration-300 ${
                  plan.popular
                    ? `${getColorClasses(plan.color, "border")} shadow-lg shadow-${plan.color}-500/20`
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <CardHeader className="text-center relative">
                  {plan.popular && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${getColorClasses(plan.color, "bg")} text-white text-xs px-4 py-1 rounded-full font-medium`}>
                      가장 인기있는 플랜
                    </div>
                  )}

                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${getColorClasses(plan.color, "bg")}/20 flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${getColorClasses(plan.color, "text")}`} />
                  </div>

                  <CardTitle className="text-2xl font-light tracking-wide mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{plan.description}</CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-light tracking-tight">${price}</span>
                      <span className="text-zinc-400 text-sm">/ {billingCycle === "monthly" ? "월" : "년"}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-xs text-zinc-500 mt-2">
                        월 ${(price / 12).toFixed(0)} (연간 결제 시)
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button
                    onClick={() => handleSubscribe(plan.name)}
                    className={`w-full ${
                      plan.popular
                        ? `${getColorClasses(plan.color, "bg")} hover:opacity-90`
                        : "bg-zinc-800 hover:bg-zinc-700"
                    } text-white`}
                  >
                    시작하기
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide">주요 기능</p>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${getColorClasses(plan.color, "text")} flex-shrink-0 mt-0.5`} />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations && (
                    <div className="pt-4 border-t border-zinc-800 space-y-2">
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">사용 제한</p>
                      {plan.limitations.map((limit, index) => (
                        <div key={index} className="text-sm text-zinc-400">
                          • {limit}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-2xl font-light tracking-wide mb-6 text-center">자주 묻는 질문</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-white mb-2">플랜을 변경할 수 있나요?</h3>
              <p className="text-sm text-zinc-400">
                언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 차액은 일할 계산됩니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">무료 체험 기간이 있나요?</h3>
              <p className="text-sm text-zinc-400">
                모든 플랜은 14일 무료 체험이 제공됩니다. 신용카드 등록 필요 없이 바로 시작할 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">환불 정책은 어떻게 되나요?</h3>
              <p className="text-sm text-zinc-400">
                30일 환불 보장 정책을 제공합니다. 만족하지 못하시면 전액 환불해드립니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">팀 플랜에서 멤버를 추가할 수 있나요?</h3>
              <p className="text-sm text-zinc-400">
                네, 추가 멤버당 월 $20의 비용으로 무제한 추가 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
