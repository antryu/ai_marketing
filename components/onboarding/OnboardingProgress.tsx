"use client"

import { cn } from "@/lib/utils"

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          단계 {currentStep} / {totalSteps}
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% 완료
        </div>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2",
                step < currentStep && "text-primary",
                step === currentStep && "text-primary font-medium",
                step > currentStep && "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  step < currentStep && "border-primary bg-primary text-primary-foreground",
                  step === currentStep && "border-primary bg-primary text-primary-foreground",
                  step > currentStep && "border-muted"
                )}
              >
                {step < currentStep ? "✓" : step}
              </div>
              <span className="hidden md:block text-sm">
                {step === 1 && "제품 정보"}
                {step === 2 && "타겟 고객"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
