import Link from "next/link"
import { ArrowRight, Zap, Target, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 dark:bg-zinc-950">
      {/* Navigation Bar - Porsche Style */}
      <nav className="sticky top-0 w-full z-50 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xl font-light tracking-wide text-white">
                AI <span className="text-amber-400">Marketing</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm font-light tracking-wide">대시보드</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-light tracking-wide">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-8">
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Porsche Style */}
      <section className="relative py-32 lg:py-48 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_50%)]"></div>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-zinc-800 to-zinc-700 border border-zinc-700">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium tracking-widest text-zinc-200">AI Marketing Automation</span>
              </div>
            </div>

            {/* Headline - Porsche Typography */}
            <h1 className="text-6xl lg:text-8xl xl:text-9xl font-light text-center leading-[1.1] mb-8">
              <span className="text-white">AI가 만드는</span>
              <br />
              <span className="text-amber-400">스마트 마케팅</span>
            </h1>

            {/* Accent line */}
            <div className="flex justify-center mb-12">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-center text-zinc-300 leading-relaxed mb-16 max-w-3xl mx-auto font-normal">
              제품 정보만 입력하면 AI가 타겟 고객을 분석하고,<br />
              Thread와 LinkedIn에 최적화된 콘텐츠를 자동으로 생성합니다
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center gap-6 mb-20">
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-12 group">
                  대시보드 바로가기
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="px-12 group">
                  <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  시작하기
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-12 max-w-3xl mx-auto">
              <div className="text-center group">
                <div className="text-4xl font-light text-amber-400 mb-3 group-hover:scale-110 transition-transform duration-300">5분</div>
                <div className="text-sm text-zinc-300 font-medium tracking-wide">빠른 시작</div>
              </div>
              <div className="text-center border-x border-zinc-800 group">
                <div className="text-4xl font-light text-white mb-3 group-hover:scale-110 transition-transform duration-300">AI</div>
                <div className="text-sm text-zinc-300 font-medium tracking-wide">자동화</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-light text-amber-400 mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
                <div className="text-sm text-zinc-300 font-medium tracking-wide">운영</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Porsche Style */}
      <section className="py-32 lg:py-40 border-t border-zinc-800">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-24">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-light mb-6 text-white">
              주요 <span className="text-amber-400">기능</span>
            </h2>
            <p className="text-lg text-zinc-300 font-normal tracking-wide">
              프리미엄 AI 마케팅 자동화
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 p-10 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 group-hover:border-amber-400/50 flex items-center justify-center mb-6 transition-all duration-300">
                  <Target className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-light mb-3 text-white group-hover:text-amber-400 transition-colors duration-300">
                  AI 페르소나 분석
                </h3>
                <div className="w-12 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
              </div>
              <p className="text-base text-zinc-300 leading-relaxed font-normal group-hover:text-zinc-200 transition-colors duration-300">
                제품 정보를 입력하면 AI가 자동으로 타겟 고객 페르소나를 생성합니다.
                고객의 니즈, 관심사, 구매 패턴을 분석하여 정확한 타겟팅이 가능합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 p-10 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 group-hover:border-amber-400/50 flex items-center justify-center mb-6 transition-all duration-300">
                  <Sparkles className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-light mb-3 text-white group-hover:text-amber-400 transition-colors duration-300">
                  플랫폼별 최적화
                </h3>
                <div className="w-12 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
              </div>
              <p className="text-base text-zinc-300 leading-relaxed font-normal group-hover:text-zinc-200 transition-colors duration-300">
                Thread, LinkedIn 등 각 플랫폼에 최적화된 콘텐츠를 자동으로 생성합니다.
                플랫폼별 특성에 맞는 길이, 톤, 형식으로 콘텐츠가 조정됩니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-amber-400/50 p-10 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/10">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 group-hover:border-amber-400/50 flex items-center justify-center mb-6 transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-light mb-3 text-white group-hover:text-amber-400 transition-colors duration-300">
                  성과 추적
                </h3>
                <div className="w-12 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
              </div>
              <p className="text-base text-zinc-300 leading-relaxed font-normal group-hover:text-zinc-200 transition-colors duration-300">
                실시간으로 콘텐츠 성과를 분석하고 개선점을 제안합니다.
                데이터 기반의 인사이트로 마케팅 ROI를 극대화할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Porsche Style */}
      <section className="relative py-32 lg:py-48 border-t border-zinc-800 overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]"></div>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-10">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>
            <h2 className="text-5xl lg:text-7xl font-light mb-8 text-white leading-tight">
              지금 시작하세요
            </h2>
            <p className="text-xl mb-16 text-zinc-300 font-normal tracking-wide">
              5분이면 AI 마케팅 자동화를 시작할 수 있습니다
            </p>
            <Link href="/signup">
              <Button size="lg" className="px-16 text-lg group">
                시작하기
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Porsche Style */}
      <footer className="py-16 border-t border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-light tracking-wide text-white">
                  AI Marketing
                </span>
                <span className="text-zinc-700">|</span>
                <span className="text-sm text-zinc-500 font-light">
                  © 2025
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-500 font-light tracking-wide">
              <Link href="/terms" className="hover:text-amber-400 transition-colors duration-300">Terms</Link>
              <Link href="/privacy" className="hover:text-amber-400 transition-colors duration-300">Privacy</Link>
              <Link href="/contact" className="hover:text-amber-400 transition-colors duration-300">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
