"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  StoryFrame,
  GenerationMode,
  EmotionalTone,
  EngagementGoal,
  STORY_FRAME_TEMPLATES,
} from "@/types/mirra-content.types"

interface MirraStyleSelectorProps {
  onSelect: (config: {
    storyFrame: StoryFrame
    generationMode: GenerationMode
    emotionalTone: EmotionalTone
    engagementGoal: EngagementGoal
    customHook?: string
  }) => void
  disabled?: boolean
}

export function MirraStyleSelector({ onSelect, disabled }: MirraStyleSelectorProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [storyFrame, setStoryFrame] = useState<StoryFrame | null>(null)
  const [generationMode, setGenerationMode] = useState<GenerationMode>("creative")
  const [emotionalTone, setEmotionalTone] = useState<EmotionalTone | null>(null)
  const [engagementGoal, setEngagementGoal] = useState<EngagementGoal | null>(null)
  const [customHook, setCustomHook] = useState("")

  const handleComplete = () => {
    if (!storyFrame || !emotionalTone || !engagementGoal) {
      return
    }

    onSelect({
      storyFrame,
      generationMode,
      emotionalTone,
      engagementGoal,
      customHook: customHook.trim() || undefined
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return storyFrame !== null
      case 2:
        return emotionalTone !== null
      case 3:
        return engagementGoal !== null
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  s < step ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 스토리 프레임 선택 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">📖 스토리 프레임 선택</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              콘텐츠의 구조와 흐름을 결정합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(STORY_FRAME_TEMPLATES) as [StoryFrame, typeof STORY_FRAME_TEMPLATES[StoryFrame]][]).map(
              ([key, template]) => (
                <Card
                  key={key}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    storyFrame === key
                      ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950"
                      : "border border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => setStoryFrame(key)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <strong>구조:</strong> {template.structure.join(" → ")}
                      </div>
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        <strong>훅 예시:</strong> "{template.hookExamples[0]}"
                      </div>
                    </div>
                  </div>
                </Card>
              )
            )}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!canProceed()}
            className="w-full"
          >
            다음 단계
          </Button>
        </div>
      )}

      {/* Step 2: 감정 톤 선택 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">🎭 감정 톤 선택</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              콘텐츠의 전체적인 분위기와 느낌을 설정합니다
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "hopeful", label: "희망적", emoji: "🌟", desc: "긍정적, 격려하는" },
              { value: "honest", label: "솔직한", emoji: "💬", desc: "진솔한, 공감하는" },
              { value: "energetic", label: "활기찬", emoji: "⚡", desc: "역동적, 강렬한" },
              { value: "calm", label: "차분한", emoji: "🌊", desc: "안정적, 사려깊은" }
            ].map((tone) => (
              <Card
                key={tone.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md text-center ${
                  emotionalTone === tone.value
                    ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => setEmotionalTone(tone.value as EmotionalTone)}
              >
                <div className="text-4xl mb-2">{tone.emoji}</div>
                <div className="font-semibold mb-1">{tone.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{tone.desc}</div>
              </Card>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
              이전
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceed()}
              className="flex-1"
            >
              다음 단계
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 목표 선택 */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">🎯 콘텐츠 목표 선택</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              독자에게 원하는 반응과 행동을 설정합니다
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "inspire", label: "영감 주기", emoji: "✨", desc: "동기부여, 희망" },
              { value: "educate", label: "교육하기", emoji: "📚", desc: "지식, 정보 전달" },
              { value: "entertain", label: "즐거움", emoji: "🎉", desc: "재미, 공감" },
              { value: "persuade", label: "설득하기", emoji: "🎯", desc: "행동, 구매 유도" }
            ].map((goal) => (
              <Card
                key={goal.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md text-center ${
                  engagementGoal === goal.value
                    ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => setEngagementGoal(goal.value as EngagementGoal)}
              >
                <div className="text-4xl mb-2">{goal.emoji}</div>
                <div className="font-semibold mb-1">{goal.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{goal.desc}</div>
              </Card>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
              이전
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!canProceed()}
              className="flex-1"
            >
              다음 단계
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 커스텀 훅 (선택사항) */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">✍️ 커스텀 훅 (선택사항)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              원하는 시작 문구가 있다면 입력하세요. 비워두면 AI가 자동으로 생성합니다.
            </p>
          </div>

          {storyFrame && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-sm font-medium mb-2">💡 추천 훅 스타일:</div>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {STORY_FRAME_TEMPLATES[storyFrame].hookExamples.map((hook, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>"{hook}"</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Label htmlFor="customHook">시작 문구</Label>
            <Input
              id="customHook"
              placeholder="예: 저는 3개월 전까지만 해도..."
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
              이전
            </Button>
            <Button
              onClick={handleComplete}
              disabled={disabled}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              설정 완료
            </Button>
          </div>
        </div>
      )}

      {/* 선택 요약 */}
      {step > 1 && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm space-y-2">
            <div className="font-medium mb-2">✅ 선택한 설정:</div>
            {storyFrame && (
              <div>
                📖 <strong>스토리:</strong> {STORY_FRAME_TEMPLATES[storyFrame].name}
              </div>
            )}
            {emotionalTone && step > 2 && (
              <div>
                🎭 <strong>톤:</strong> {emotionalTone === "hopeful" ? "희망적" : emotionalTone === "honest" ? "솔직한" : emotionalTone === "energetic" ? "활기찬" : "차분한"}
              </div>
            )}
            {engagementGoal && step > 3 && (
              <div>
                🎯 <strong>목표:</strong> {engagementGoal === "inspire" ? "영감 주기" : engagementGoal === "educate" ? "교육하기" : engagementGoal === "entertain" ? "즐거움" : "설득하기"}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
