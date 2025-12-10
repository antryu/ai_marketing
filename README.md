# AI 마케팅 자동화 플랫폼

Thread(한국)/LinkedIn(미국) 중심의 AI 기반 마케팅 자동화 SaaS 플랫폼입니다.

> **IMPORTANT: Language Rules**
> - **NEVER use Chinese (Hanzi), Japanese (Kanji/Hiragana/Katakana), or any CJK characters**
> - Allowed languages: **Korean (Hangul) and English ONLY**
> - This rule applies to ALL files in the project

## 🎯 프로젝트 개요

사용자가 제품 정보를 입력하면 AI가 자동으로:
- 타겟 고객 페르소나를 분석
- 플랫폼별 최적화된 콘텐츠 생성
- 여러 SNS에 자동 발행
- 성과를 추적 및 분석

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Queue**: BullMQ + Redis (Upstash)

### AI Services
- **LLM**: OpenAI GPT-4o-mini
- **Image**: Replicate (Stable Diffusion)

### Platform APIs
- Thread (Meta Threads API)
- LinkedIn API
- Instagram Graph API
- YouTube Data API v3

### Deployment
- **Platform**: Vercel
- **Database**: Supabase Cloud
- **Redis**: Upstash Redis

## 📦 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
cd marketing-automation
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 입력하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# DeepSeek (optional)
DEEPSEEK_API_KEY=your_deepseek_key

# Replicate (for images)
REPLICATE_API_TOKEN=your_replicate_token

# Thread API
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret

# Redis (Upstash)
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 설정

#### 3.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key를 `.env.local`에 추가

#### 3.2 데이터베이스 스키마 실행
1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/001_initial_schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣기 후 실행

#### 3.3 Google OAuth 설정 (선택사항)
1. Supabase Dashboard → Authentication → Providers
2. Google 활성화 및 클라이언트 ID/Secret 입력

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
marketing-automation/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # 대시보드 (인증 필요)
│   │   ├── dashboard/            # 메인 대시보드
│   │   ├── onboarding/           # 온보딩 플로우
│   │   ├── content/              # 콘텐츠 관리
│   │   ├── calendar/             # 콘텐츠 캘린더
│   │   ├── analytics/            # 성과 분석
│   │   └── settings/             # 설정
│   └── api/                      # API Routes
│       ├── auth/
│       ├── brands/
│       ├── onboarding/
│       ├── content/
│       └── platforms/
├── components/                   # React 컴포넌트
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── auth/                     # 인증 컴포넌트
│   ├── onboarding/               # 온보딩 컴포넌트
│   ├── content/                  # 콘텐츠 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   └── layout/                   # 레이아웃 컴포넌트
├── lib/                          # 유틸리티 라이브러리
│   ├── supabase/                 # Supabase 클라이언트
│   ├── ai/                       # AI 관련 로직
│   ├── platforms/                # 플랫폼 API 클라이언트
│   └── utils/                    # 헬퍼 함수
├── types/                        # TypeScript 타입 정의
├── hooks/                        # React Hooks
├── store/                        # Zustand 스토어
└── supabase/                     # Supabase 관련 파일
    └── migrations/               # 데이터베이스 마이그레이션
```

## 🎯 Phase 1 MVP 기능 (완료)

- ✅ 사용자 인증 (이메일/비밀번호, Google OAuth)
- ✅ 온보딩 플로우 (제품 정보 입력)
- ✅ AI 페르소나 생성 (OpenAI GPT-4o-mini)
- ✅ 기본 대시보드
- ✅ Supabase 데이터베이스 스키마
- ✅ 반응형 UI (shadcn/ui)

## 🚧 다음 단계 (Phase 1 계속)

### Week 3: 콘텐츠 생성
- [ ] Thread 콘텐츠 생성 로직
- [ ] 콘텐츠 생성 페이지
- [ ] 콘텐츠 편집기
- [ ] 콘텐츠 미리보기
- [ ] 콘텐츠 DB 저장

### Week 4: Thread 발행
- [ ] Thread OAuth 연동
- [ ] Thread API 클라이언트
- [ ] Thread 발행 기능
- [ ] 발행 상태 추적
- [ ] 콘텐츠 목록

### Week 5: 분석 & 개선
- [ ] Thread Analytics API 연동
- [ ] 성과 데이터 수집
- [ ] 기본 차트 (Recharts)
- [ ] 성과 대시보드
- [ ] 버그 수정 및 UX 개선

## 📋 API 서비스 설정 가이드

### OpenAI API
1. [OpenAI Platform](https://platform.openai.com) 방문
2. API Keys → Create new secret key
3. `.env.local`에 추가: `OPENAI_API_KEY=sk-...`

### Supabase
1. [Supabase](https://supabase.com) 프로젝트 생성
2. Settings → API에서 URL과 키 복사
3. `.env.local`에 추가

### Thread API (Meta)
1. [Meta for Developers](https://developers.facebook.com) 방문
2. 앱 생성 및 Threads API 활성화
3. App ID와 Secret 복사

### Upstash Redis
1. [Upstash](https://upstash.com) 계정 생성
2. Redis 데이터베이스 생성
3. REST API URL과 Token 복사

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# 타입 체크
npm run type-check
```

## 🐛 문제 해결

### Supabase 연결 오류
- `.env.local` 파일의 Supabase URL과 키가 올바른지 확인
- Supabase 프로젝트가 활성 상태인지 확인

### OpenAI API 오류
- API 키가 유효한지 확인
- OpenAI 계정에 크레딧이 있는지 확인
- 요청 제한(rate limit)에 걸리지 않았는지 확인

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📝 라이선스

MIT License

## 🤝 기여

Phase 1 MVP 개발 중입니다. 기여는 Phase 2부터 받을 예정입니다.

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
