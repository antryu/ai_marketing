"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Crown, Users } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function PricingPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const plans = useMemo(() => [
    {
      name: t("planStandard"),
      icon: Zap,
      description: t("planStandardDesc"),
      monthlyPrice: 25,
      yearlyPrice: 250,
      color: "amber",
      features: [
        t("feature100Contents"),
        t("feature3Platforms"),
        t("featurePlatformOptimization"),
        t("feature10Personas"),
        t("featureBasicAnalytics"),
        t("featureEmailSupport"),
      ],
      limitations: [
        t("limitScheduled10"),
        t("limitBrand1"),
      ],
    },
    {
      name: t("planPro"),
      icon: Crown,
      description: t("planProDesc"),
      monthlyPrice: 99,
      yearlyPrice: 990,
      color: "purple",
      popular: true,
      features: [
        t("feature500Contents"),
        t("featureUnlimitedPlatforms"),
        t("featureAISuggestions"),
        t("featureUnlimitedPersonas"),
        t("featureAdvancedAnalytics"),
        t("featurePrioritySupport"),
        t("featureABTesting"),
        t("featureCustomBranding"),
      ],
      limitations: [
        t("limitScheduledUnlimited"),
        t("limitBrand5"),
        t("limitTeam3"),
      ],
    },
    {
      name: t("planTeam"),
      icon: Users,
      description: t("planTeamDesc"),
      monthlyPrice: 199,
      yearlyPrice: 1990,
      color: "blue",
      features: [
        t("feature2000Contents"),
        t("featureAllPro"),
        t("featureERPIntegration"),
        t("featureDedicatedManager"),
        t("feature24x7Support"),
        t("featureCustomAI"),
        t("featureWhiteLabel"),
        t("featureAPIAccess"),
      ],
      limitations: [
        t("limitBrandUnlimited"),
        t("limitTeam10"),
        t("limitWorkspace3"),
      ],
    },
  ], [language])

  const handleSubscribe = (planName: string) => {
    toast.info(`${planName} ${t("stripeComingSoon")}`)
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
              {t("monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t("yearly")}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                {t("discount20")}
              </span>
            </button>
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
                      {t("mostPopular")}
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
                      <span className="text-zinc-400 text-sm">/ {billingCycle === "monthly" ? t("perMonth") : t("perYear")}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {t("monthlyBilled")}{(price / 12).toFixed(0)} {t("yearlyBilled")}
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
                    {t("getStarted")}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide">{t("keyFeatures")}</p>
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
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{t("usageLimits")}</p>
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
          <h2 className="text-2xl font-light tracking-wide mb-6 text-center">{t("faqTitle")}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-white mb-2">{t("faqChangePlanQ")}</h3>
              <p className="text-sm text-zinc-400">
                {t("faqChangePlanA")}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">{t("faqFreeTrialQ")}</h3>
              <p className="text-sm text-zinc-400">
                {t("faqFreeTrialA")}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">{t("faqRefundQ")}</h3>
              <p className="text-sm text-zinc-400">
                {t("faqRefundA")}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">{t("faqAddMembersQ")}</h3>
              <p className="text-sm text-zinc-400">
                {t("faqAddMembersA")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
