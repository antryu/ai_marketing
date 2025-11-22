# 웹앱 디자인 시스템 가이드

> **버전**: 1.0.0  
> **최종 업데이트**: 2025-11-03  
> **목적**: 일관된 사용자 경험과 효율적인 개발을 위한 통합 디자인 시스템

---

## 목차

1. [디자인 철학](#디자인-철학)
2. [색상 시스템](#색상-시스템)
3. [타이포그래피](#타이포그래피)
4. [스페이싱 & 레이아웃](#스페이싱--레이아웃)
5. [컴포넌트](#컴포넌트)
6. [아이콘](#아이콘)
7. [애니메이션](#애니메이션)
8. [접근성](#접근성)
9. [다크모드](#다크모드)
10. [개발 가이드](#개발-가이드)

---

## 디자인 철학

### 핵심 원칙

**1. 명확성 (Clarity)**
- 사용자는 항상 현재 상태와 다음 액션을 명확히 이해할 수 있어야 함
- 불필요한 장식을 배제하고 콘텐츠에 집중

**2. 일관성 (Consistency)**
- 같은 액션은 항상 같은 방식으로 표현
- 디자인 토큰과 컴포넌트 재사용으로 일관성 유지

**3. 효율성 (Efficiency)**
- 사용자의 목표 달성까지의 단계를 최소화
- 반복 작업을 자동화하고 스마트한 기본값 제공

**4. 접근성 (Accessibility)**
- 모든 사용자가 제품을 사용할 수 있어야 함
- WCAG 2.1 AA 기준 준수

**5. 확장성 (Scalability)**
- 새로운 기능이 추가되어도 시스템이 일관되게 작동
- 디자인 토큰 기반으로 테마와 브랜딩 확장 용이

---

## 색상 시스템

### 디자인 철학
색상은 정보 위계, 상태, 브랜드 아이덴티티를 전달합니다. Indigo 기반의 Primary 색상은 전문성과 신뢰를 표현하며, Slate 계열의 Neutral 색상은 고급스러운 배경과 텍스트에 사용됩니다.

### CSS 변수 (Light Mode)

```css
:root {
  /* Primary - Indigo */
  --primary-50: #EEF2FF;
  --primary-100: #E0E7FF;
  --primary-200: #C7D2FE;
  --primary-300: #A5B4FC;
  --primary-400: #818CF8;
  --primary-500: #6366F1;  /* Main brand color */
  --primary-600: #4F46E5;  /* Hover state */
  --primary-700: #4338CA;
  --primary-800: #3730A3;
  --primary-900: #312E81;

  /* Success - Green */
  --success-400: #4ADE80;
  --success-500: #22C55E;
  --success-600: #16A34A;

  /* Warning - Amber */
  --warning-400: #FBBF24;
  --warning-500: #F59E0B;
  --warning-600: #D97706;

  /* Error - Red */
  --error-400: #F87171;
  --error-500: #EF4444;
  --error-600: #DC2626;

  /* Neutral - Slate */
  --neutral-50: #F8FAFC;
  --neutral-100: #F1F5F9;
  --neutral-200: #E2E8F0;
  --neutral-300: #CBD5E1;
  --neutral-400: #94A3B8;
  --neutral-500: #64748B;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1E293B;
  --neutral-900: #0F172A;

  /* Semantic Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-tertiary: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  --border-color: #E2E8F0;
}
```

### 색상 사용 규칙

| 용도 | 색상 | 예시 |
|------|------|------|
| 주요 액션 | `primary-500` | 제출 버튼, 링크 |
| 호버 상태 | `primary-600` | 버튼 호버 |
| 성공 메시지 | `success-500` | 저장 완료, 성공 알림 |
| 경고 메시지 | `warning-500` | 주의 필요, 확인 요청 |
| 오류 메시지 | `error-500` | 입력 오류, 실패 알림 |
| 본문 텍스트 | `text-primary` | 모든 본문 콘텐츠 |
| 보조 텍스트 | `text-secondary` | 설명, 캡션 |
| 비활성 텍스트 | `text-tertiary` | 레이블, 플레이스홀더 |
| 배경 | `bg-primary` | 카드, 모달 |
| 구분선 | `border-color` | 테두리, 디바이더 |

### 대비율 (WCAG AA)

- **본문 텍스트**: 최소 4.5:1
- **대형 텍스트** (18px+ 또는 14px+ bold): 최소 3:1
- **UI 컴포넌트**: 최소 3:1

---

## 타이포그래피

### 디자인 철학
명확한 정보 위계와 가독성을 위해 체계적인 타입 스케일을 사용합니다. 시스템 폰트를 활용해 빠른 로딩과 친숙한 경험을 제공합니다.

### 폰트 패밀리

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### 타입 스케일

| 레벨 | 크기 / Line Height | 가중치 | 용도 |
|------|-------------------|--------|------|
| **Display Large** | 57px / 64px | 700 | Hero 섹션 |
| **Display Medium** | 45px / 52px | 700 | 주요 랜딩 헤더 |
| **Display Small** | 36px / 44px | 700 | 페이지 타이틀 |
| **Headline Large** | 32px / 40px | 700 | 섹션 헤더 |
| **Headline Medium** | 28px / 36px | 600 | 서브 섹션 |
| **Headline Small** | 24px / 32px | 600 | 카드 타이틀 |
| **Title Large** | 22px / 28px | 600 | 큰 제목 |
| **Title Medium** | 16px / 24px | 600 | 기본 제목 |
| **Title Small** | 14px / 20px | 600 | 작은 제목 |
| **Body Large** | 16px / 24px | 400 | 주요 본문 |
| **Body Medium** | 14px / 20px | 400 | 기본 본문 |
| **Body Small** | 12px / 16px | 400 | 보조 본문 |
| **Label Large** | 14px / 20px | 600 | 큰 레이블 |
| **Label Medium** | 12px / 16px | 600 | 기본 레이블 |
| **Label Small** | 11px / 16px | 600 | 작은 레이블 |

### CSS 구현 예시

```css
.display-large {
  font-size: 57px;
  line-height: 64px;
  font-weight: 700;
  letter-spacing: -0.25px;
}

.body-large {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  letter-spacing: 0.15px;
}
```

### 가독성 규칙

- **최대 줄 길이**: 60-80자 (본문)
- **단락 간격**: 24px
- **링크**: `primary-500` + underline (hover)

---

## 스페이싱 & 레이아웃

### 디자인 철학
8pt 그리드 시스템을 기반으로 예측 가능하고 일관된 간격을 유지합니다. 이는 디자이너와 개발자 간 소통을 명확히 하고, 다양한 화면 크기에서도 일관성을 보장합니다.

### 스페이싱 토큰 (8pt Grid)

```css
--space-xs: 4px;    /* 0.5 * 8 */
--space-sm: 8px;    /* 1 * 8 */
--space-md: 16px;   /* 2 * 8 */
--space-lg: 24px;   /* 3 * 8 */
--space-xl: 32px;   /* 4 * 8 */
--space-2xl: 48px;  /* 6 * 8 */
--space-3xl: 64px;  /* 8 * 8 */
--space-4xl: 96px;  /* 12 * 8 */
```

### 사용 가이드

| 토큰 | 용도 |
|------|------|
| `xs (4px)` | 아이콘-텍스트 간격, 밀집된 요소 |
| `sm (8px)` | 관련 요소 간격, 인라인 요소 |
| `md (16px)` | 기본 컴포넌트 간격, 패딩 |
| `lg (24px)` | 카드/섹션 내부 패딩 |
| `xl (32px)` | 컴포넌트 간 간격 |
| `2xl (48px)` | 섹션 구분 |
| `3xl (64px)` | 주요 섹션 구분 |
| `4xl (96px)` | 페이지 레벨 구분 |

### 그리드 시스템

**12 컬럼 그리드**

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px; /* Desktop */
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
}
```

**반응형 브레이크포인트**

```css
/* Mobile */
@media (max-width: 767px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 0 16px;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid-container {
    grid-template-columns: repeat(8, 1fr);
    gap: 20px;
    padding: 0 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    padding: 0 32px;
  }
}
```

---

## 컴포넌트

### 디자인 철학
모든 컴포넌트는 재사용 가능하고, 접근 가능하며, 명확한 상태를 제공해야 합니다. 각 컴포넌트는 Default, Hover, Active, Focus, Disabled 상태를 정의합니다.

### 버튼

**사이즈**

| 사이즈 | 높이 | 패딩 | 폰트 사이즈 |
|--------|------|------|------------|
| Small | 32px | 0 16px | 13px |
| Medium | 40px | 0 24px | 14px |
| Large | 48px | 0 32px | 16px |

**변형 (Variants)**

```css
/* Primary - 주요 액션 (페이지당 1개 권장) */
.btn-primary {
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms cubic-bezier(0, 0, 0.2, 1);
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Secondary - 보조 액션 */
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 600;
}

.btn-secondary:hover {
  background: var(--neutral-200);
  border-color: var(--neutral-300);
}

/* Outlined - 대안 액션 */
.btn-outlined {
  background: transparent;
  color: var(--primary-500);
  border: 2px solid var(--primary-500);
  border-radius: 8px;
  font-weight: 600;
}

.btn-outlined:hover {
  background: rgba(99, 102, 241, 0.1);
}

/* Text - 최소 강조 액션 */
.btn-text {
  background: transparent;
  color: var(--primary-500);
  border: none;
  font-weight: 600;
}

.btn-text:hover {
  background: rgba(99, 102, 241, 0.1);
}
```

**사용 가이드**

- **Primary**: "저장", "제출", "구매" 같은 주요 액션
- **Secondary**: "취소", "이전" 같은 보조 액션
- **Outlined**: 동등한 중요도의 대안 액션
- **Text**: "자세히 보기", "건너뛰기" 같은 최소 강조

### 입력 필드

**기본 스펙**

```css
.input-field {
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 200ms ease;
}

.input-field:focus {
  outline: none;
  border: 2px solid var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-field.error {
  border-color: var(--error-500);
}

.input-field:disabled {
  background: var(--neutral-100);
  cursor: not-allowed;
  opacity: 0.6;
}
```

**레이블 & 헬퍼 텍스트**

```html
<div class="input-group">
  <label class="input-label">이메일</label>
  <input type="email" class="input-field" placeholder="example@email.com">
  <span class="input-helper">유효한 이메일을 입력하세요</span>
</div>
```

```css
.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.input-helper {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.input-error {
  font-size: 12px;
  color: var(--error-500);
  margin-top: 4px;
}
```

### 카드

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  transform: translateY(-4px);
  border-color: var(--primary-500);
}
```

### 알림 (Alert)

```css
.alert {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success-600);
  border-color: var(--success-500);
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-600);
  border-color: var(--warning-500);
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-600);
  border-color: var(--error-500);
}

.alert-info {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-600);
  border-color: var(--primary-500);
}
```

---

## 아이콘

### 디자인 철학
아이콘은 정보를 빠르게 전달하고 인터페이스를 직관적으로 만듭니다. 일관된 스타일과 크기로 시각적 조화를 이룹니다.

### 사이즈 표준

```css
--icon-sm: 16px;   /* 인라인 텍스트, 버튼 내부 */
--icon-md: 20px;   /* 리스트 아이템 */
--icon-lg: 24px;   /* 기본 아이콘 */
--icon-xl: 32px;   /* 강조 아이콘 */
```

### 사용 가이드

- **선 굵기**: 1.5-2px (일관되게)
- **라운딩**: 모서리는 약간 둥글게
- **색상**: 주변 텍스트와 동일하거나 `primary-500`
- **정렬**: 텍스트 베이스라인과 시각적으로 정렬
- **간격**: 아이콘-텍스트 간 8px

```css
.icon-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 24px;
  height: 24px;
  color: currentColor;
}
```

---

## 애니메이션

### 디자인 철학
애니메이션은 사용자의 주의를 유도하고, 피드백을 제공하며, 상태 변화를 자연스럽게 만듭니다. 과도하지 않되 의미 있게 사용합니다.

### 타이밍

```css
--duration-instant: 0ms;      /* 상태 변경 */
--duration-fast: 100ms;       /* 호버, 포커스 */
--duration-standard: 200ms;   /* 기본 전환 */
--duration-slow: 300ms;       /* 복잡한 전환 */
--duration-slower: 400ms;     /* 페이지 전환 */
```

### 이징 함수

```css
/* 진입 - 요소가 화면에 나타날 때 */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* 퇴장 - 요소가 화면에서 사라질 때 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* 이동 - 화면 내에서 위치 변경 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 적용 예시

```css
/* 버튼 호버 */
.btn {
  transition: all 200ms cubic-bezier(0, 0, 0.2, 1);
}

/* 카드 lift */
.card {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 모달 진입 */
.modal {
  animation: modalEnter 300ms cubic-bezier(0, 0, 0.2, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 접근성

### 디자인 철학
모든 사용자가 제품을 사용할 수 있어야 합니다. 접근성은 선택이 아닌 필수입니다.

### 체크리스트

**색상 & 대비**
- [ ] 텍스트-배경 대비 4.5:1 이상
- [ ] UI 컴포넌트 대비 3:1 이상
- [ ] 색상만으로 정보 전달 금지

**키보드 네비게이션**
- [ ] 모든 인터랙티브 요소 Tab으로 접근 가능
- [ ] 명확한 포커스 표시 (2px outline)
- [ ] 논리적인 Tab 순서

```css
/* 포커스 링 */
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

**ARIA & 시맨틱 HTML**
```html
<!-- 좋은 예 -->
<button aria-label="메뉴 열기">
  <svg aria-hidden="true">...</svg>
</button>

<!-- 나쁜 예 -->
<div onclick="openMenu()">
  <svg>...</svg>
</div>
```

**터치 타겟**
- 최소 44x44px (모바일)
- 터치 타겟 간 최소 8px 간격

**스크린 리더**
- 모든 이미지에 alt 텍스트
- 장식적 이미지는 `alt=""`
- ARIA 레이블 활용

---

## 다크모드

### 디자인 철학
다크모드는 단순히 색을 반전하는 것이 아닙니다. 눈의 피로를 줄이고, 어두운 환경에서 최적화된 경험을 제공합니다.

### CSS 변수 (Dark Mode)

```css
[data-theme="dark"] {
  /* Primary - 동일 */
  --primary-400: #818CF8;
  --primary-500: #6366F1;
  --primary-600: #4F46E5;

  /* Semantic - 동일 */
  --success-500: #22C55E;
  --warning-500: #F59E0B;
  --error-500: #EF4444;

  /* Theme Colors - 변경 */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-tertiary: #94A3B8;
  --border-color: #334155;

  /* Shadow - 더 진하게 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### 구현

```javascript
// 테마 전환
const toggleTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// 저장된 테마 불러오기
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

### 다크모드 최적화 팁

1. **Shadow 조정**: 다크모드에서 그림자를 더 진하게
2. **Border 명확**: 어두운 배경에서 경계 구분
3. **Primary 유지**: 브랜드 색상은 동일하게
4. **이미지 처리**: 필요시 opacity 감소

---

## 개발 가이드

### 시작하기

**1. CSS 변수 초기화**

모든 프로젝트에 다음 변수를 포함:

```css
:root {
  /* 위의 색상 시스템 변수 복사 */
}

[data-theme="dark"] {
  /* 위의 다크모드 변수 복사 */
}
```

**2. 기본 스타일**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: background-color 300ms ease, color 300ms ease;
}
```

**3. 유틸리티 클래스**

```css
/* 스페이싱 */
.p-xs { padding: 4px; }
.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }

.m-xs { margin: 4px; }
.m-sm { margin: 8px; }
.m-md { margin: 16px; }
.m-lg { margin: 24px; }

/* 타이포그래피 */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
```

### 컴포넌트 체크리스트

새 컴포넌트 개발 시:
- [ ] 모든 상태 정의 (default, hover, active, focus, disabled)
- [ ] 다크모드 지원
- [ ] 키보드 네비게이션
- [ ] ARIA 속성
- [ ] 반응형 대응
- [ ] 로딩/에러 상태

### 네이밍 컨벤션

```css
/* BEM 방식 권장 */
.component {}
.component__element {}
.component--modifier {}

/* 예시 */
.card {}
.card__title {}
.card__text {}
.card--featured {}
```

### 성능 최적화

```css
/* GPU 가속 활용 */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
}

/* 애니메이션 완료 후 제거 */
.animated-element.done {
  will-change: auto;
}
```

### 반응형 개발

```css
/* 모바일 우선 */
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px;
  }
}
```

---

## 추가 자료

### 도구 & 리소스

- **색상 대비 체크**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **접근성 테스트**: [WAVE](https://wave.webaim.org/)
- **디자인 토큰**: [Style Dictionary](https://amzn.github.io/style-dictionary/)
- **아이콘**: [Heroicons](https://heroicons.com/), [Lucide](https://lucide.dev/)

### 버전 관리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2025-11-03 | 초기 릴리즈 |

### 기여 가이드

1. 새 컴포넌트 제안 시 디자인 원칙 준수
2. 접근성 테스트 필수
3. 다크모드 지원 확인
4. 문서 업데이트

---

## 문의

- 디자인 관련: design@company.com
- 개발 관련: dev@company.com
- 접근성 이슈: accessibility@company.com

---

**© 2025 Your Company. All rights reserved.**