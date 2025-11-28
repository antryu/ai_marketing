"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Sparkles,
  CreditCard,
  Target,
  User,
  Building2,
  ChevronDown,
  TrendingUp,
  Users,
  Moon,
  Sun,
} from "lucide-react"
import { useBrand } from "@/contexts/BrandContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { translations, TranslationKey } from "@/lib/translations"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { selectedBrandId, setSelectedBrandId, brands, loading } = useBrand()
  const { language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const t = (key: TranslationKey) => translations[key][language]
  const [showTrendsNew, setShowTrendsNew] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Check if user has visited trends page
  useEffect(() => {
    const hasVisitedTrends = localStorage.getItem('hasVisitedTrends')
    if (hasVisitedTrends === 'true') {
      setShowTrendsNew(false)
    }
  }, [])

  // Mark trends as visited when user navigates to trends page
  useEffect(() => {
    if (pathname === '/trends') {
      localStorage.setItem('hasVisitedTrends', 'true')
      setShowTrendsNew(false)
    }
  }, [pathname])

  // Get user email
  useEffect(() => {
    async function getUserEmail() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    getUserEmail()
  }, [])

  const navigation = [
    { name: t("navDashboard"), href: "/dashboard", icon: LayoutDashboard, highlight: false },
    { name: t("navBrandSettings"), href: "/brand", icon: Building2, highlight: false },
    { name: t("navBrandVoice"), href: "/writer-personas", icon: User, highlight: false },
    { name: t("navTargetCustomers"), href: "/personas", icon: Target, highlight: false },
    { name: t("navTrends"), href: "/trends", icon: TrendingUp, highlight: showTrendsNew },
    { name: t("navContentGeneration"), href: "/content/create", icon: Sparkles, highlight: false },
    { name: t("navContentList"), href: "/content", icon: FileText, highlight: false },
    { name: t("navCalendar"), href: "/calendar", icon: Calendar, highlight: false },
    { name: t("navAnalytics"), href: "/analytics", icon: BarChart3, highlight: false },
  ]

  const bottomNavigation = [
    ...(userEmail === 'seongpilryu@gmail.com' ? [
      { name: language === "ko" ? "구독자" : "Subscribers", href: "/subscribers", icon: Users, highlight: false }
    ] : []),
    { name: t("navPricing"), href: "/pricing", icon: CreditCard, highlight: false },
    { name: t("navSettings"), href: "/settings", icon: Settings, highlight: false },
  ]

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className={`w-64 bg-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:bg-gradient-to-b border-r border-slate-200 dark:border-zinc-800 flex flex-col z-50 transition-all duration-200 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } fixed top-0 left-0 h-screen overflow-hidden`}>
      <div className="absolute top-0 right-0 w-px h-full bg-transparent dark:bg-gradient-to-b dark:from-transparent dark:via-amber-400/20 dark:to-transparent"></div>

      <div className="h-16 px-6 flex items-center border-b border-slate-200 dark:border-zinc-800 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-700 rounded-lg flex items-center justify-center dark:border dark:border-zinc-700 group-hover:from-indigo-600 group-hover:to-indigo-700 dark:group-hover:border-amber-400/50 transition-all duration-200 dark:group-hover:shadow-amber-400/20">
            <Zap className="h-5 w-5 text-white dark:text-amber-400 dark:group-hover:scale-110 dark:transition-transform dark:duration-300" />
          </div>
          <span className="text-base font-semibold text-slate-800 dark:text-white dark:font-light dark:tracking-wide dark:group-hover:text-amber-400 transition-colors duration-200">Marketing Wise</span>
        </Link>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Brand Selector */}
        {!loading && brands.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="relative">
              <select
                value={selectedBrandId || ""}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full h-10 bg-white dark:bg-zinc-900/50 border border-slate-300 dark:border-zinc-700 pl-3 pr-8 text-slate-700 dark:text-white text-sm font-medium rounded-lg appearance-none hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:border-amber-400/50 dark:focus:ring-0 focus:outline-none transition-all cursor-pointer"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-400 pointer-events-none" />
            </div>
          </div>
        )}

        <nav className="p-6 space-y-1">
        {navigation.map((item, index) => {
          // 정확한 경로 매칭
          let isActive = false

          if (pathname === item.href) {
            // 정확히 같은 경로면 활성화
            isActive = true
          } else if (pathname?.startsWith(item.href + "/")) {
            // 하위 경로 체크
            if (item.href === "/content") {
              // /content는 정확히 일치하거나 /content/[id] 형식만 활성화
              // /content/create와 /content/bulk는 제외
              isActive = !pathname.startsWith("/content/create") && !pathname.startsWith("/content/bulk")
            } else if (item.href === "/content/bulk") {
              // /content/bulk는 정확히 일치할 때만 (위에서 처리됨)
              isActive = false
            } else {
              // 나머지는 하위 경로도 활성화
              isActive = true
            }
          }

          const isHighlight = item.highlight

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 dark:gap-4 dark:px-4 dark:py-4 dark:font-normal dark:tracking-wide dark:duration-300 dark:rounded-none ${
                isActive
                  ? "text-white bg-indigo-600 border-l-4 border-indigo-700 dark:text-white dark:bg-gradient-to-r dark:from-zinc-800 dark:to-transparent dark:border-l-2 dark:border-amber-400"
                  : isHighlight
                  ? "text-indigo-600 dark:text-white hover:bg-indigo-50 hover:text-indigo-700 dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-transparent dark:border-l-2 dark:border-amber-500 dark:hover:bg-amber-500/20 dark:hover:border-amber-400 dark:hover:translate-x-1"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900/50 dark:border-l-2 dark:border-transparent dark:hover:border-zinc-700 dark:hover:translate-x-1"
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 dark:transition-all dark:duration-300 ${
                isActive ? "text-white dark:text-amber-400" : isHighlight ? "text-indigo-600 dark:text-amber-400 dark:group-hover:scale-110" : "text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-amber-400 dark:group-hover:scale-110"
              }`} />
              <span className="flex-1 dark:transition-all dark:duration-300">{item.name}</span>
              {isHighlight && !isActive && (
                <span className="text-[10px] bg-indigo-600 dark:bg-amber-500 text-white px-2 py-1 rounded-full dark:rounded font-bold uppercase tracking-wide">NEW</span>
              )}

              {isActive && (
                <div className="hidden dark:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-slate-200 dark:border-zinc-800">
        <nav className="px-3 py-4 space-y-0.5 dark:p-6 dark:space-y-1">
          {bottomNavigation.map((item) => {
            let isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 dark:gap-4 dark:px-4 dark:py-4 dark:font-normal dark:tracking-wide dark:duration-300 dark:rounded-none ${
                  isActive
                    ? "text-white bg-indigo-600 border-l-4 border-indigo-700 dark:text-white dark:bg-gradient-to-r dark:from-zinc-800 dark:to-transparent dark:border-l-2 dark:border-amber-400"
                    : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900/50 dark:border-l-2 dark:border-transparent dark:hover:border-zinc-700 dark:hover:translate-x-1"
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 dark:transition-all dark:duration-300 ${
                  isActive ? "text-white dark:text-amber-400" : "text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-amber-400 dark:group-hover:scale-110"
                }`} />
                <span className="flex-1 dark:transition-all dark:duration-300">{item.name}</span>

                {isActive && (
                  <div className="hidden dark:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-zinc-800 dark:p-8">
        {/* 다크모드 토글 버튼 */}
        {theme === 'light' && (
          <button
            onClick={toggleTheme}
            className="w-full mb-4 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 group"
          >
            <Moon className="h-5 w-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              {language === 'ko' ? '다크 모드' : 'Dark Mode'}
            </span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-400 animate-pulse"></div>
          <div className="text-xs text-slate-600 dark:text-zinc-400 font-medium dark:font-normal tracking-wide">
            {t("mvpStage")}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
