import Link from "next/link"
import { ArrowRight, Zap, Target, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1a1510]">
      {/* Navigation Bar - Hermès Style */}
      <nav className="sticky top-0 w-full z-50 backdrop-blur-sm bg-[#FAF7F2]/95 dark:bg-[#1a1510]/95 border-b border-[#D4A574]/20">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#D4A574] rounded-sm flex items-center justify-center">
                <span className="text-[#D4A574] font-serif text-xl">AI</span>
              </div>
              <span className="font-serif text-2xl tracking-wider text-[#2C1810] dark:text-[#FAF7F2]">AI MARKETING</span>
            </div>
            <div className="flex items-center gap-8">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-light tracking-wide text-[#2C1810] dark:text-[#FAF7F2] hover:bg-transparent hover:text-[#D4A574]">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#D4A574] text-white hover:bg-[#C89563] border border-[#D4A574] px-8 h-11 tracking-wide font-medium">
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Hermès Luxury Style */}
      <section className="relative py-32 lg:py-48">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-5xl mx-auto">
            {/* Category Tag */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 border border-[#D4A574]/30 bg-white/50 dark:bg-[#2C1810]/30">
                <div className="w-1 h-1 bg-[#D4A574] rounded-full"></div>
                <span className="text-sm font-light tracking-[0.2em] text-[#2C1810] dark:text-[#FAF7F2] uppercase">AI Marketing Automation</span>
                <div className="w-1 h-1 bg-[#D4A574] rounded-full"></div>
              </div>
            </div>

            {/* Headline - Hermès Typography */}
            <h1 className="font-serif text-6xl lg:text-7xl xl:text-8xl text-center leading-[1.1] mb-12 text-[#2C1810] dark:text-[#FAF7F2]">
              AI가 만드는<br />
              <span className="italic">완벽한</span> 마케팅 콘텐츠
            </h1>

            {/* Divider */}
            <div className="flex justify-center mb-12">
              <div className="w-24 h-px bg-[#D4A574]"></div>
            </div>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-center text-[#5C4A3A] dark:text-[#D4C5B0] leading-relaxed mb-16 max-w-3xl mx-auto font-light">
              제품 정보만 입력하면 AI가 타겟 고객을 분석하고,<br />Thread와 LinkedIn에 최적화된 콘텐츠를 자동으로 생성합니다.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="bg-[#D4A574] text-white hover:bg-[#C89563] border-2 border-[#D4A574] px-12 h-14 text-base tracking-wider font-semibold uppercase">
                  시작하기
                </Button>
              </Link>
            </div>

            {/* Info */}
            <div className="flex items-center justify-center gap-8 text-sm text-[#5C4A3A] dark:text-[#D4C5B0] font-light">
              <span>신용카드 불필요</span>
              <span className="text-[#D4A574]">·</span>
              <span>5분 만에 시작</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Hermès Elegant Style */}
      <section className="py-32 lg:py-48 border-t border-[#D4A574]/20">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="text-center mb-24">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-px bg-[#D4A574]"></div>
            </div>
            <h2 className="font-serif text-5xl lg:text-6xl mb-6 text-[#2C1810] dark:text-[#FAF7F2]">
              주요 기능
            </h2>
            <p className="text-lg text-[#5C4A3A] dark:text-[#D4C5B0] font-light tracking-wide">
              AI 기술로 마케팅을 자동화하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="group">
              <div className="mb-8">
                <div className="w-16 h-16 border border-[#D4A574] flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-[#D4A574]" />
                </div>
                <h3 className="font-serif text-3xl mb-4 text-[#2C1810] dark:text-[#FAF7F2]">
                  AI 페르소나 분석
                </h3>
                <div className="w-12 h-px bg-[#D4A574]/50 mb-6"></div>
              </div>
              <p className="text-lg text-[#5C4A3A] dark:text-[#D4C5B0] leading-relaxed font-light">
                제품 정보를 입력하면 AI가 자동으로 타겟 고객 페르소나를 생성합니다.
                고객의 니즈, 관심사, 구매 패턴을 분석하여 정확한 타겟팅이 가능합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="mb-8">
                <div className="w-16 h-16 border border-[#D4A574] flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-[#D4A574]" />
                </div>
                <h3 className="font-serif text-3xl mb-4 text-[#2C1810] dark:text-[#FAF7F2]">
                  플랫폼별 최적화
                </h3>
                <div className="w-12 h-px bg-[#D4A574]/50 mb-6"></div>
              </div>
              <p className="text-lg text-[#5C4A3A] dark:text-[#D4C5B0] leading-relaxed font-light">
                Thread, LinkedIn 등 각 플랫폼에 최적화된 콘텐츠를 자동으로 생성합니다.
                플랫폼별 특성에 맞는 길이, 톤, 형식으로 콘텐츠가 조정됩니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="mb-8">
                <div className="w-16 h-16 border border-[#D4A574] flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-[#D4A574]" />
                </div>
                <h3 className="font-serif text-3xl mb-4 text-[#2C1810] dark:text-[#FAF7F2]">
                  성과 추적
                </h3>
                <div className="w-12 h-px bg-[#D4A574]/50 mb-6"></div>
              </div>
              <p className="text-lg text-[#5C4A3A] dark:text-[#D4C5B0] leading-relaxed font-light">
                실시간으로 콘텐츠 성과를 분석하고 개선점을 제안합니다.
                데이터 기반의 인사이트로 마케팅 ROI를 극대화할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Hermès Luxury */}
      <section className="py-32 lg:py-48 bg-[#2C1810] dark:bg-[#1a1510] border-t border-[#D4A574]/30">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-px bg-[#D4A574]"></div>
            </div>
            <h2 className="font-serif text-5xl lg:text-6xl mb-8 text-[#FAF7F2]">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-16 text-[#D4C5B0] font-light tracking-wide">
              AI가 당신의 마케팅 팀이 되어드립니다.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-transparent border-2 border-[#D4A574] text-[#D4A574] hover:bg-[#D4A574] hover:text-white transition-all duration-300 px-12 h-14 text-base tracking-wider font-semibold uppercase">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Hermès Minimal */}
      <footer className="py-16 border-t border-[#D4A574]/20 bg-[#FAF7F2] dark:bg-[#1a1510]">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border border-[#D4A574] flex items-center justify-center">
                <span className="text-[#D4A574] font-serif text-sm">AI</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif text-sm tracking-wider text-[#2C1810] dark:text-[#FAF7F2]">
                  AI MARKETING
                </span>
                <span className="text-[#D4A574]">·</span>
                <span className="text-sm text-[#5C4A3A] dark:text-[#D4C5B0] font-light">
                  © 2025
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-[#5C4A3A] dark:text-[#D4C5B0] font-light">
              <Link href="/terms" className="hover:text-[#D4A574] transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-[#D4A574] transition-colors">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-[#D4A574] transition-colors">문의하기</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
