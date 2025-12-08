"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBrand } from "@/contexts/BrandContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  FileText,
  Target,
  Sparkles,
  Search,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

// 프롬프트 카테고리 정의
const PROMPT_CATEGORIES = {
  topic_suggestion: {
    ko: "토픽 추천 (AI 자동 추천)",
    en: "Topic Suggestion (AI Auto)",
    icon: Target,
    description: {
      ko: "타겟 고객과 브랜드 정보를 기반으로 AI가 자동으로 토픽을 추천할 때 사용되는 프롬프트입니다.",
      en: "Prompt used when AI automatically recommends topics based on target audience and brand info."
    }
  },
  topic_search: {
    ko: "토픽 검색 (AI 웹 검색)",
    en: "Topic Search (AI Web Search)",
    icon: Search,
    description: {
      ko: "사용자가 입력한 주제에 대해 AI가 웹 검색을 수행하여 관련 토픽을 찾을 때 사용되는 프롬프트입니다.",
      en: "Prompt used when AI performs web search to find related topics based on user input."
    }
  },
  content_generation: {
    ko: "콘텐츠 생성 (글쓰기)",
    en: "Content Generation (Writing)",
    icon: Sparkles,
    description: {
      ko: "선택한 토픽으로 실제 콘텐츠를 생성할 때 사용되는 프롬프트입니다.",
      en: "Prompt used when generating actual content from selected topic."
    }
  }
}

// 기본 프롬프트 템플릿
const DEFAULT_PROMPTS = {
  topic_suggestion: {
    ko: `당신은 마케팅 트렌드 전문가입니다. 다음 정보를 바탕으로 현재 한국 시장에서 효과적인 콘텐츠 마케팅 주제 6개를 추천해주세요.

**오늘 날짜: {{currentDate}}**

{{brandContext}}

{{targetContext}}

{{realTimeTrends}}

요구사항:
1. 각 주제는 구체적이고 실행 가능해야 합니다
2. 타겟 고객의 고민과 목표를 직접적으로 해결하는 내용이어야 합니다
3. 실시간 트렌드 데이터를 반드시 반영해야 합니다
4. 브랜드의 산업 특성과 타겟 고객의 특성을 고려해야 합니다
5. 각 주제마다 왜 이 주제가 효과적인지 구체적인 이유를 제시해야 합니다

JSON 형식으로 응답해주세요:
{
  "suggestions": [
    {
      "keyword": "구체적인 마케팅 주제",
      "reason": "이 주제가 효과적인 이유",
      "priority": "high/medium/low"
    }
  ]
}`,
    en: `You are a marketing trend expert. Based on the following information, recommend 6 effective content marketing topics for the current US/global market.

**Today's Date: {{currentDate}}**

{{brandContext}}

{{targetContext}}

{{realTimeTrends}}

Requirements:
1. Each topic must be specific and actionable
2. Content must directly address target customer pain points and goals
3. Must incorporate real-time trend data
4. Consider brand's industry characteristics and target customer profile
5. Provide specific reasons why each topic is effective

Respond in JSON format:
{
  "suggestions": [
    {
      "keyword": "Specific marketing topic",
      "reason": "Why this topic is effective",
      "priority": "high/medium/low"
    }
  ]
}`
  },
  topic_search: {
    ko: `당신은 마케팅 트렌드 리서치 전문가입니다. 사용자가 입력한 주제에 대해 인터넷 검색을 통해 얻을 수 있는 최신 정보와 트렌드를 바탕으로 마케팅 콘텐츠 토픽을 추천해주세요.

**검색 주제: "{{topic}}"**
**오늘 날짜: {{currentDate}}**

{{brandContext}}
{{targetContext}}

당신의 역할:
1. "{{topic}}" 주제에 대해 현재 인터넷에서 어떤 내용들이 논의되고 있는지 추론합니다
2. 해당 주제와 관련된 최신 트렌드, 뉴스, 논쟁점, 인기 키워드를 파악합니다
3. 마케팅 콘텐츠로 활용할 수 있는 구체적인 토픽 5개를 추천합니다
4. 추가로, 검색 주제와 연관되지만 사용자가 생각하지 못했을 수 있는 색다른 관점의 토픽 3개도 추천합니다

요구사항:
- 각 토픽은 구체적이고 콘텐츠로 바로 만들 수 있어야 합니다
- 메인 토픽은 검색 주제와 직접적으로 연관되어야 합니다
- 연관 토픽은 검색 주제와 간접적으로 연결되거나, 다른 각도에서 접근하는 새로운 아이디어여야 합니다
- 각 토픽이 왜 효과적인지 이유를 설명해주세요

JSON 형식으로 응답해주세요:
{
  "webInsights": "검색 주제에 대한 현재 인터넷 트렌드 요약 (2-3문장)",
  "topics": [
    {
      "keyword": "구체적인 콘텐츠 토픽",
      "reason": "이 토픽이 효과적인 이유",
      "source": "이 주제가 논의되는 플랫폼/매체",
      "priority": "high/medium/low"
    }
  ],
  "relatedTopics": [
    {
      "keyword": "연관된 색다른 토픽",
      "reason": "이 토픽을 추천하는 이유",
      "category": "카테고리 (예: 다른 관점, 연관 산업, 트렌드 확장 등)"
    }
  ]
}`,
    en: `You are a marketing trend research expert. Based on the topic entered by the user, recommend marketing content topics using the latest information and trends that could be found through internet search.

**Search Topic: "{{topic}}"**
**Today's Date: {{currentDate}}**

{{brandContext}}
{{targetContext}}

Your role:
1. Infer what content is currently being discussed on the internet about "{{topic}}"
2. Identify latest trends, news, controversies, and popular keywords related to the topic
3. Recommend 5 specific topics that can be used for marketing content
4. Additionally, recommend 3 alternative topics that are related but offer fresh perspectives

Requirements:
- Each topic must be specific and ready to create content
- Main topics must be directly related to the search topic
- Related topics should be indirectly connected or approach from a different angle
- Explain why each topic is effective

Respond in JSON format:
{
  "webInsights": "Summary of current internet trends about the topic (2-3 sentences)",
  "topics": [
    {
      "keyword": "Specific content topic",
      "reason": "Why this topic is effective",
      "source": "Platform/media where this topic is discussed",
      "priority": "high/medium/low"
    }
  ],
  "relatedTopics": [
    {
      "keyword": "Related alternative topic",
      "reason": "Why this topic is recommended",
      "category": "Category (e.g., Different Angle, Related Industry, etc.)"
    }
  ]
}`
  },
  content_generation: {
    ko: `당신은 {{brandName}}의 전문 마케팅 콘텐츠 작성자입니다.
중요: 반드시 한국어로만 작성하세요.

제품/브랜드 정보:
- 이름: {{brandName}}
- 설명: {{brandDescription}}
- 타겟 시장: {{targetMarket}}
- 브랜드 톤: {{brandTone}}
- 브랜드 스타일: {{brandStyle}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 콘텐츠 주제
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{topic}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 플랫폼 & 형식
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
플랫폼: {{platform}}
스타일: {{platformStyle}}
최대 길이: {{maxLength}}자
형식: {{format}}
톤: {{tone}}

{{seoKeywords}}

타겟 페르소나:
{{personas}}

{{writerContext}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 작성 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **독자의 관심을 끄는 시작**
   - 흥미로운 질문이나 놀라운 사실로 시작
   - 공감을 불러일으키는 상황 묘사

2. **핵심 가치 전달**
   - 독자가 얻을 수 있는 혜택 강조
   - 구체적인 예시와 디테일 사용

3. **행동 유도**
   - 자연스러운 CTA로 마무리
   - 독자가 다음 행동을 하고 싶게 만들기

4. **마크다운 형식 사용**
   - ## 로 소제목 구분
   - **굵게** 강조
   - - 리스트 활용

출력 요구사항:
1. 언어: 100% 한국어만 사용
2. 코드 블록 사용 금지
3. 마크다운 형식 사용 가능
4. 바로 콘텐츠 작성 시작`,
    en: `You are a professional marketing content writer for {{brandName}}.
Important: Write in English only.

Product/Brand Information:
- Name: {{brandName}}
- Description: {{brandDescription}}
- Target Market: {{targetMarket}}
- Brand Tone: {{brandTone}}
- Brand Style: {{brandStyle}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Content Topic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{topic}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Platform & Format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform: {{platform}}
Style: {{platformStyle}}
Max Length: {{maxLength}} characters
Format: {{format}}
Tone: {{tone}}

{{seoKeywords}}

Target Persona:
{{personas}}

{{writerContext}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Writing Guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Capture Reader's Attention**
   - Start with an intriguing question or surprising fact
   - Describe relatable situations

2. **Deliver Core Value**
   - Highlight benefits readers can gain
   - Use specific examples and details

3. **Call to Action**
   - End with a natural CTA
   - Make readers want to take the next step

4. **Use Markdown Format**
   - ## for subheadings
   - **bold** for emphasis
   - - for lists

Output Requirements:
1. Language: English only
2. No code blocks
3. Markdown format allowed
4. Start content immediately`
  }
}

interface UserPrompt {
  id?: string
  user_id: string
  category: string
  prompt_ko: string
  prompt_en: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function PromptsSettingsPage() {
  const { language } = useLanguage()
  const { selectedBrandId } = useBrand()

  const [prompts, setPrompts] = useState<Record<string, UserPrompt>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 사용자의 커스텀 프롬프트 로드
    const { data: userPrompts } = await (supabase as any)
      .from("user_prompts")
      .select("*")
      .eq("user_id", user.id)

    const promptMap: Record<string, UserPrompt> = {}

    // 기본 프롬프트로 초기화
    Object.keys(PROMPT_CATEGORIES).forEach(category => {
      promptMap[category] = {
        user_id: user.id,
        category,
        prompt_ko: DEFAULT_PROMPTS[category as keyof typeof DEFAULT_PROMPTS]?.ko || "",
        prompt_en: DEFAULT_PROMPTS[category as keyof typeof DEFAULT_PROMPTS]?.en || "",
        is_active: true
      }
    })

    // 사용자 커스텀 프롬프트로 덮어쓰기
    if (userPrompts) {
      userPrompts.forEach((p: UserPrompt) => {
        promptMap[p.category] = p
      })
    }

    setPrompts(promptMap)
    setLoading(false)
  }

  const handleExpand = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null)
      setEditingCategory(null)
    } else {
      setExpandedCategory(category)
      setEditingCategory(null)
    }
  }

  const handleEdit = (category: string) => {
    setEditingCategory(category)
    const prompt = prompts[category]
    setEditedPrompt(language === "ko" ? prompt.prompt_ko : prompt.prompt_en)
  }

  const handleSave = async (category: string) => {
    setSaving(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      toast.error(language === "ko" ? "로그인이 필요합니다" : "Login required")
      return
    }

    const existingPrompt = prompts[category]
    const updatedPrompt = {
      ...existingPrompt,
      user_id: user.id,
      category,
      [language === "ko" ? "prompt_ko" : "prompt_en"]: editedPrompt,
      updated_at: new Date().toISOString()
    }

    let result
    if (existingPrompt.id) {
      // 업데이트
      result = await (supabase as any)
        .from("user_prompts")
        .update({
          prompt_ko: updatedPrompt.prompt_ko,
          prompt_en: updatedPrompt.prompt_en,
          updated_at: updatedPrompt.updated_at
        })
        .eq("id", existingPrompt.id)
    } else {
      // 새로 생성
      result = await (supabase as any)
        .from("user_prompts")
        .insert({
          user_id: user.id,
          category,
          prompt_ko: updatedPrompt.prompt_ko,
          prompt_en: updatedPrompt.prompt_en,
          is_active: true
        })
        .select()
        .single()

      if (result.data) {
        updatedPrompt.id = result.data.id
      }
    }

    if (result.error) {
      console.error("Save error:", result.error)
      toast.error(language === "ko" ? "저장 실패" : "Save failed")
    } else {
      setPrompts(prev => ({
        ...prev,
        [category]: updatedPrompt
      }))
      setEditingCategory(null)
      toast.success(language === "ko" ? "프롬프트가 저장되었습니다" : "Prompt saved successfully")
    }

    setSaving(false)
  }

  const handleReset = (category: string) => {
    if (!confirm(language === "ko"
      ? "기본 프롬프트로 초기화하시겠습니까? 현재 수정 내용은 저장되지 않습니다."
      : "Reset to default prompt? Current changes will not be saved."
    )) return

    const defaultPrompt = DEFAULT_PROMPTS[category as keyof typeof DEFAULT_PROMPTS]
    if (defaultPrompt) {
      setEditedPrompt(language === "ko" ? defaultPrompt.ko : defaultPrompt.en)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300">{language === "ko" ? "로딩 중..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-light text-white tracking-wide">
              {language === "ko" ? "AI 프롬프트 관리" : "AI Prompt Management"}
            </h1>
          </div>
          <p className="text-zinc-400">
            {language === "ko"
              ? "토픽 선정, 타겟 오디언스, 글쓰기에 사용되는 AI 프롬프트를 확인하고 수정할 수 있습니다."
              : "View and edit AI prompts used for topic selection, target audience, and content writing."
            }
          </p>
        </div>

        {/* Info Banner */}
        <Card className="p-4 bg-amber-400/10 border-amber-400/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-300">
              <p className="font-medium text-amber-400 mb-1">
                {language === "ko" ? "프롬프트 변수 안내" : "Prompt Variables Guide"}
              </p>
              <p>
                {language === "ko"
                  ? "{{변수명}} 형태의 텍스트는 실행 시 자동으로 실제 값으로 대체됩니다. 예: {{brandName}} → 실제 브랜드명"
                  : "Text in {{variable}} format will be automatically replaced with actual values at runtime. e.g., {{brandName}} → actual brand name"
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Prompt Categories */}
        <div className="space-y-4">
          {Object.entries(PROMPT_CATEGORIES).map(([category, config]) => {
            const Icon = config.icon
            const isExpanded = expandedCategory === category
            const isEditing = editingCategory === category
            const prompt = prompts[category]
            const hasCustomPrompt = prompt?.id

            return (
              <Card
                key={category}
                className={`bg-zinc-900 border-zinc-800 overflow-hidden transition-all ${
                  isExpanded ? "border-amber-400/50" : ""
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => handleExpand(category)}
                  className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-400/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-white">
                          {config[language as "ko" | "en"]}
                        </h3>
                        {hasCustomPrompt && (
                          <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded">
                            {language === "ko" ? "커스텀" : "Custom"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        {config.description[language as "ko" | "en"]}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-zinc-800">
                    <div className="pt-4">
                      {isEditing ? (
                        <>
                          <Textarea
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            className="min-h-[400px] font-mono text-sm bg-zinc-950 border-zinc-700 text-zinc-300"
                            placeholder={language === "ko" ? "프롬프트를 입력하세요..." : "Enter prompt..."}
                          />
                          <div className="flex items-center gap-3 mt-4">
                            <Button
                              onClick={() => handleSave(category)}
                              disabled={saving}
                              className="bg-amber-500 hover:bg-amber-600 text-black"
                            >
                              {saving ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              {language === "ko" ? "저장" : "Save"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingCategory(null)}
                            >
                              {language === "ko" ? "취소" : "Cancel"}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleReset(category)}
                              className="text-zinc-400 hover:text-zinc-300"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {language === "ko" ? "기본값으로 초기화" : "Reset to Default"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                            <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-mono">
                              {language === "ko" ? prompt?.prompt_ko : prompt?.prompt_en}
                            </pre>
                          </div>
                          <div className="flex items-center gap-3 mt-4">
                            <Button
                              onClick={() => handleEdit(category)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {language === "ko" ? "수정하기" : "Edit"}
                            </Button>
                            {hasCustomPrompt && (
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                {language === "ko"
                                  ? `마지막 수정: ${new Date(prompt.updated_at!).toLocaleDateString("ko-KR")}`
                                  : `Last modified: ${new Date(prompt.updated_at!).toLocaleDateString("en-US")}`
                                }
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Tips Section */}
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {language === "ko" ? "프롬프트 작성 팁" : "Prompt Writing Tips"}
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• {language === "ko"
              ? "구체적인 지시사항을 포함할수록 AI의 응답 품질이 높아집니다."
              : "More specific instructions lead to higher quality AI responses."
            }</li>
            <li>• {language === "ko"
              ? "JSON 형식의 출력을 요청하면 결과를 쉽게 처리할 수 있습니다."
              : "Requesting JSON format output makes results easier to process."
            }</li>
            <li>• {language === "ko"
              ? "예시를 포함하면 AI가 원하는 형식을 더 잘 이해합니다."
              : "Including examples helps AI better understand the desired format."
            }</li>
            <li>• {language === "ko"
              ? "역할(Role)을 명확히 지정하면 더 전문적인 응답을 얻을 수 있습니다."
              : "Clearly defining a role leads to more professional responses."
            }</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
