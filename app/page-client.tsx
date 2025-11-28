"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap, Target, TrendingUp, Sparkles, CheckCircle2, Moon, Sun, Instagram, Twitter, Linkedin, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { LanguageToggle } from "@/components/LanguageToggle"
import { translations } from "@/lib/translations"

export function LandingPageClient() {
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const t = (key: keyof typeof translations) => translations[key][language]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Navigation Bar - Mobile Optimized */}
      <nav className="sticky top-0 w-full z-50 bg-white dark:bg-zinc-950/95 backdrop-blur-lg border-b-2 border-slate-300 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center border-2 border-indigo-700 dark:border-zinc-700 shadow-md dark:shadow-none transition-colors duration-300">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-white dark:text-amber-400" />
              </div>
              <span className="text-base md:text-xl font-semibold tracking-wide text-slate-900 dark:text-white transition-colors duration-300">
                My <span className="text-indigo-600 dark:text-amber-400">Marketing Wise</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800/50 transition-colors border border-slate-300 dark:border-transparent"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-slate-700 hover:text-indigo-600 transition-colors" />
                ) : (
                  <Sun className="h-5 w-5 text-zinc-400 hover:text-amber-400 transition-colors" />
                )}
              </button>
              <LanguageToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-xs md:text-sm font-medium tracking-wide px-2 md:px-4 text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-amber-400 border border-slate-300 dark:border-transparent">{t('login')}</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-4 md:px-8 text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-500 dark:hover:bg-amber-600 border-2 border-indigo-700 dark:border-amber-600 shadow-md dark:shadow-amber-500/20">
                  {t('getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile Optimized with Buffer-style spacing */}
      <section className="relative py-20 md:py-40 lg:py-56 xl:py-64 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_50%)]"></div>

        <div className="container mx-auto px-4 md:px-6 lg:px-12 relative">
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 bg-indigo-600 dark:bg-gradient-to-r dark:from-zinc-800 dark:to-zinc-700 border-2 border-indigo-700 dark:border-zinc-700 shadow-lg dark:shadow-none">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white dark:text-amber-400" />
                <span className="text-xs md:text-sm font-bold tracking-widest text-white dark:text-zinc-200">My Marketing Wise</span>
              </div>
            </div>

            {/* Headline - Mobile Responsive */}
            <h1 className="text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-center leading-[1.1] mb-6 md:mb-8 px-4">
              <span className="text-slate-900 dark:text-white">{t('heroTitle1')}</span>
              <br />
              <span className="text-indigo-600 dark:text-amber-400">{t('heroTitle2')}</span>
            </h1>

            {/* Accent line */}
            <div className="flex justify-center mb-8 md:mb-12">
              <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-transparent via-indigo-600 dark:via-amber-400 to-transparent"></div>
            </div>

            {/* Subheadline */}
            <p className="text-sm md:text-lg lg:text-xl text-center text-slate-700 dark:text-zinc-300 leading-relaxed mb-12 md:mb-16 max-w-3xl mx-auto font-medium px-4">
              {t('heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center gap-4 md:gap-6 mb-12 md:mb-20 px-4">
              <Link href="/signup">
                <Button size="lg" className="px-8 md:px-12 group h-12 md:h-14 bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-500 dark:hover:bg-amber-600 border-2 border-indigo-700 dark:border-amber-600 shadow-lg dark:shadow-amber-500/20">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm md:text-base font-semibold">{t('getStarted')}</span>
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-12 max-w-3xl mx-auto px-4 mb-16 md:mb-24">
              <div className="text-center group bg-white dark:bg-transparent border-2 border-slate-300 dark:border-transparent py-4 shadow-md dark:shadow-none">
                <div className="text-2xl md:text-4xl font-bold text-indigo-600 dark:text-amber-400 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">5{language === 'ko' ? '분' : 'min'}</div>
                <div className="text-xs md:text-sm text-slate-700 dark:text-zinc-300 font-semibold tracking-wide">{t('quickStart')}</div>
              </div>
              <div className="text-center group bg-white dark:bg-transparent border-2 border-slate-300 dark:border-transparent py-4 shadow-md dark:shadow-none">
                <div className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">AI</div>
                <div className="text-xs md:text-sm text-slate-700 dark:text-zinc-300 font-semibold tracking-wide">{t('automation')}</div>
              </div>
              <div className="text-center group bg-white dark:bg-transparent border-2 border-slate-300 dark:border-transparent py-4 shadow-md dark:shadow-none">
                <div className="text-2xl md:text-4xl font-bold text-indigo-600 dark:text-amber-400 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
                <div className="text-xs md:text-sm text-slate-700 dark:text-zinc-300 font-semibold tracking-wide">{t('operation')}</div>
              </div>
            </div>

            {/* Platform Logos */}
            <div className="max-w-5xl mx-auto px-4">
              <p className="text-center text-sm md:text-base text-slate-600 dark:text-zinc-400 font-semibold mb-8 md:mb-12">
                {language === 'ko' ? '지원하는 플랫폼' : 'Supported Platforms'}
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
                {/* Threads */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">Threads</span>
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <Linkedin className="w-8 h-8 md:w-10 md:h-10 text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">LinkedIn</span>
                </div>

                {/* Instagram */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <Instagram className="w-8 h-8 md:w-10 md:h-10 text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">Instagram</span>
                </div>

                {/* X (Twitter) */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <span className="text-2xl md:text-3xl font-black text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">𝕏</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">X (Twitter)</span>
                </div>

                {/* Naver */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <span className="text-xl md:text-2xl font-bold text-[#03C75A] dark:text-[#03C75A] group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">N</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">Naver</span>
                </div>

                {/* Tistory */}
                <div className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center shadow-md dark:shadow-none group-hover:border-indigo-600 dark:group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                    <span className="text-xl md:text-2xl font-bold text-[#FF6B35] dark:text-[#FF6B35] group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">T</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-zinc-400">Tistory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Buffer-style spacing with background differentiation */}
      <section className="py-20 md:py-40 lg:py-52 xl:py-60 bg-slate-100 dark:bg-zinc-900/30 border-y-2 border-slate-300 dark:border-zinc-800">
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          <div className="text-center mb-16 md:mb-32 lg:mb-40">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-transparent via-indigo-600 dark:via-amber-400 to-transparent"></div>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-white px-4">
              {language === 'ko' ? '주요' : 'Key'} <span className="text-indigo-600 dark:text-amber-400">{language === 'ko' ? '기능' : 'Features'}</span>
            </h2>
            <p className="text-sm md:text-lg text-slate-700 dark:text-zinc-300 font-semibold tracking-wide">
              {t('premiumAutomation')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-10 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800 border-2 border-slate-300 dark:border-zinc-700 hover:border-indigo-600 dark:hover:border-amber-400/50 p-6 md:p-10 transition-all duration-300 shadow-lg dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-400/10">
              <div className="mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-700 border-2 border-indigo-700 dark:border-zinc-700 group-hover:border-indigo-700 dark:group-hover:border-amber-400/50 flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 shadow-md dark:shadow-none">
                  <Target className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                  {t('feature1Title')}
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-indigo-600 dark:from-amber-400 to-transparent mb-4 md:mb-6"></div>
              </div>
              <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors duration-300">
                {t('feature1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800 border-2 border-slate-300 dark:border-zinc-700 hover:border-indigo-600 dark:hover:border-amber-400/50 p-6 md:p-10 transition-all duration-300 shadow-lg dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-400/10">
              <div className="mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-700 border-2 border-indigo-700 dark:border-zinc-700 group-hover:border-indigo-700 dark:group-hover:border-amber-400/50 flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 shadow-md dark:shadow-none">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                  {t('feature2Title')}
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-indigo-600 dark:from-amber-400 to-transparent mb-4 md:mb-6"></div>
              </div>
              <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors duration-300">
                {t('feature2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800 border-2 border-slate-300 dark:border-zinc-700 hover:border-indigo-600 dark:hover:border-amber-400/50 p-6 md:p-10 transition-all duration-300 shadow-lg dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-400/10">
              <div className="mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-700 border-2 border-indigo-700 dark:border-zinc-700 group-hover:border-indigo-700 dark:group-hover:border-amber-400/50 flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 shadow-md dark:shadow-none">
                  <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white dark:text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                  {t('feature3Title')}
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-indigo-600 dark:from-amber-400 to-transparent mb-4 md:mb-6"></div>
              </div>
              <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-zinc-200 transition-colors duration-300">
                {t('feature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Buffer-style with alternating background */}
      <section className="relative py-20 md:py-40 lg:py-52 xl:py-60 bg-white dark:bg-zinc-950 border-y-2 border-slate-300 dark:border-zinc-800 overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.1),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]"></div>

        <div className="container mx-auto px-4 md:px-6 lg:px-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6 md:mb-10">
              <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-transparent via-indigo-600 dark:via-amber-400 to-transparent"></div>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-white leading-tight px-4">
              {t('ctaTitle')}
            </h2>
            <p className="text-base md:text-xl mb-10 md:mb-16 text-slate-700 dark:text-zinc-300 font-semibold tracking-wide px-4">
              {t('ctaSubtitle')}
            </p>
            <Link href="/signup">
              <Button size="lg" className="px-10 md:px-16 text-base md:text-lg group h-12 md:h-14 bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-500 dark:hover:bg-amber-600 border-2 border-indigo-700 dark:border-amber-600 shadow-lg dark:shadow-amber-500/20">
                {t('getStarted')}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Porsche Style */}
      <footer className="py-16 border-t-2 border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center border-2 border-indigo-700 dark:border-zinc-700 shadow-md dark:shadow-none">
                <Zap className="w-5 h-5 text-white dark:text-amber-400" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                  My Marketing Wise
                </span>
                <span className="text-slate-400 dark:text-zinc-700">|</span>
                <span className="text-sm text-slate-600 dark:text-zinc-500 font-medium">
                  © 2025
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-600 dark:text-zinc-500 font-medium tracking-wide">
              <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-amber-400 transition-colors duration-300">Terms</Link>
              <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-amber-400 transition-colors duration-300">Privacy</Link>
              <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-amber-400 transition-colors duration-300">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
