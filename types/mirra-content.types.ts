// Mirra 스타일 콘텐츠 생성 타입 정의

export type StoryFrame =
  | "success_story"
  | "failure_lesson"
  | "daily_insight"
  | "customer_episode"
  | "controversial_opinion"
  | "how_to_guide"

export type GenerationMode =
  | "creative"
  | "search_based"
  | "knowledge_based"

export type EmotionalTone =
  | "hopeful"
  | "honest"
  | "energetic"
  | "calm"

export type EngagementGoal =
  | "inspire"
  | "educate"
  | "entertain"
  | "persuade"

export type RefineAction =
  | "refine"
  | "add_hook"
  | "shorten"
  | "expand"
  | "adjust_tone"

export type ContentStatus =
  | "idea"
  | "draft"
  | "refined"

export interface StoryFrameTemplate {
  name: string
  description: string
  structure: string[]
  hookExamples: string[]
  icon: string
}

export interface MirraContentRequest {
  // 기존 필드
  topic: string
  brandId: string
  platform?: string
  tone?: string
  length?: string
  writerPersonaId?: string
  aiModel?: string
  language?: string
  seoKeywords?: string[]

  // Mirra 스타일 필드
  storyFrame: StoryFrame
  generationMode: GenerationMode
  emotionalTone: EmotionalTone
  engagementGoal: EngagementGoal
  customHook?: string
}

export interface RefineContentRequest {
  contentId: string
  action: RefineAction
  customInstruction?: string
}

export interface ContentMetadata {
  storyFrame: StoryFrame
  generationMode: GenerationMode
  emotionalTone: EmotionalTone
  engagementGoal: EngagementGoal
  selectedHook?: string
  status: ContentStatus
}

// 스토리 프레임별 템플릿 정의
export const STORY_FRAME_TEMPLATES: Record<StoryFrame, StoryFrameTemplate> = {
  success_story: {
    name: "성공 스토리",
    description: "문제를 극복하고 성공한 이야기로 공감과 희망을 전달",
    structure: ["문제 상황", "전환점", "실행 과정", "결과", "교훈/인사이트"],
    hookExamples: [
      "처음엔 저도 막막했습니다",
      "3개월 전만 해도 불가능해 보였던 일이",
      "누구나 처음엔 실패합니다. 저도 그랬으니까요"
    ],
    icon: "🎯"
  },
  failure_lesson: {
    name: "실패에서 배운 교훈",
    description: "실패 경험을 솔직하게 공유하고 얻은 통찰을 전달",
    structure: ["실패 상황", "당시 감정", "원인 분석", "전환점", "성장/배움"],
    hookExamples: [
      "100만원을 날린 후에야 깨달았습니다",
      "이 실수만은 여러분이 안 했으면 좋겠어요",
      "망하기 직전까지 가봤던 사람의 고백"
    ],
    icon: "💡"
  },
  daily_insight: {
    name: "일상 속 인사이트",
    description: "평범한 일상에서 발견한 깊은 통찰을 공유",
    structure: ["일상 장면", "관찰", "연결/비유", "인사이트", "적용 방법"],
    hookExamples: [
      "커피를 마시다가 문득 깨달았어요",
      "출근길 지하철에서 본 한 장면이",
      "아이와 놀아주다가 발견한 일의 본질"
    ],
    icon: "✨"
  },
  customer_episode: {
    name: "고객 에피소드",
    description: "실제 고객과의 경험을 생동감 있게 전달",
    structure: ["고객 소개", "문제/고민", "대화/과정", "해결책", "결과/변화"],
    hookExamples: [
      "어제 만난 고객이 이런 말을 하더군요",
      "3년째 단골인 김 대표님의 이야기",
      "상담 중에 눈물을 보이시던 분이 있었습니다"
    ],
    icon: "💬"
  },
  controversial_opinion: {
    name: "논쟁적 의견",
    description: "통념에 도전하는 새로운 관점을 제시",
    structure: ["통념/상식", "반론 제기", "근거/증거", "새로운 관점", "결론"],
    hookExamples: [
      "다들 그렇게 말하지만, 저는 다르게 봅니다",
      "이건 좀 불편한 진실일 수 있어요",
      "인기 없는 의견이겠지만, 누군가는 말해야 할 것 같아서"
    ],
    icon: "🔥"
  },
  how_to_guide: {
    name: "실용 가이드",
    description: "구체적이고 실행 가능한 방법을 단계별로 안내",
    structure: ["문제 정의", "흔한 장벽", "해결 단계", "주의사항", "실행 팁"],
    hookExamples: [
      "제가 100번 넘게 해본 방법 공유합니다",
      "5분이면 충분합니다. 지금 바로 시작하세요",
      "복잡해 보이지만 이것만 알면 쉬워요"
    ],
    icon: "📋"
  }
}

// 감정 톤별 스타일 가이드
export const EMOTIONAL_TONE_STYLES: Record<EmotionalTone, string> = {
  hopeful: "희망적이고 격려하는 톤. 긍정적 에너지와 가능성을 강조. '할 수 있다', '함께라면' 같은 표현 사용.",
  honest: "솔직하고 진솔한 톤. 있는 그대로를 표현하되 공감을 유지. '사실은', '솔직히' 같은 표현 사용.",
  energetic: "활기차고 역동적인 톤. 짧고 강렬한 문장. 느낌표 활용. '지금 당장', '바로' 같은 표현 사용.",
  calm: "차분하고 안정적인 톤. 긴 호흡의 문장. 사려 깊은 표현. '천천히', '여유롭게' 같은 표현 사용."
}

// 목표별 CTA 가이드
export const ENGAGEMENT_GOAL_CTAS: Record<EngagementGoal, string[]> = {
  inspire: [
    "여러분도 할 수 있습니다",
    "오늘부터 시작해보세요",
    "함께 도전해봐요"
  ],
  educate: [
    "이 방법을 꼭 기억해두세요",
    "댓글로 질문 남겨주세요",
    "더 궁금한 점이 있으시면 DM 주세요"
  ],
  entertain: [
    "공감되시나요?",
    "여러분의 경험도 공유해주세요",
    "좋아요로 공감 표현해주세요"
  ],
  persuade: [
    "지금 시작하지 않으면 언제 하시겠어요?",
    "더 늦기 전에 결정하세요",
    "링크 클릭해서 자세히 알아보세요"
  ]
}
