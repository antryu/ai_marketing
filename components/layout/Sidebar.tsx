"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { useBrand } from "@/contexts/BrandContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { selectedBrandId, setSelectedBrandId, brands, loading } = useBrand()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const navigation = [
    { name: t("navDashboard"), href: "/dashboard", icon: LayoutDashboard, highlight: false },
    { name: t("navBrandSettings"), href: "/brand", icon: Building2, highlight: false },
    { name: t("navBrandVoice"), href: "/writer-personas", icon: User, highlight: false },
    { name: t("navTargetCustomers"), href: "/personas", icon: Target, highlight: false },
    { name: t("navTrends"), href: "/trends", icon: TrendingUp, highlight: true },
    { name: t("navContentGeneration"), href: "/content/create", icon: Sparkles, highlight: false },
    { name: t("navContentList"), href: "/content", icon: FileText, highlight: false },
    { name: t("navCalendar"), href: "/calendar", icon: Calendar, highlight: false },
    { name: t("navAnalytics"), href: "/analytics", icon: BarChart3, highlight: false },
  ]

  const bottomNavigation = [
    { name: t("navPricing"), href: "/pricing", icon: CreditCard, highlight: false },
    { name: t("navSettings"), href: "/settings", icon: Settings, highlight: false },
  ]

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className={`w-72 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-r border-zinc-800 flex flex-col z-50 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } fixed top-0 left-0 h-screen`}>
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-amber-400/20 to-transparent"></div>

      <div className="h-20 px-8 flex items-center border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700 group-hover:border-amber-400/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-400/20">
            <Zap className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-light text-base text-white tracking-wide block group-hover:text-amber-400 transition-colors duration-300 whitespace-nowrap overflow-hidden text-ellipsis">My Marketing Wise</span>
          </div>
        </Link>
      </div>

      {/* Brand Selector */}
      {!loading && brands.length > 0 && (
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="relative">
            <select
              value={selectedBrandId || ""}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full h-10 bg-zinc-900/50 border border-zinc-700 pl-3 pr-8 text-white text-sm rounded appearance-none focus:border-amber-400/50 focus:outline-none transition-colors cursor-pointer"
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

      <nav className="flex-1 p-6 space-y-1">
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
              className={`group relative flex items-center gap-4 px-4 py-4 text-sm font-normal tracking-wide transition-all duration-300 ${
                isActive
                  ? "text-white bg-gradient-to-r from-zinc-800 to-transparent border-l-2 border-amber-400"
                  : isHighlight
                  ? "text-white bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 hover:bg-amber-500/20 hover:border-amber-400 hover:translate-x-1"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-900/50 border-l-2 border-transparent hover:border-zinc-700 hover:translate-x-1"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-all duration-300 ${
                isActive ? "text-amber-400" : isHighlight ? "text-amber-400 group-hover:scale-110" : "group-hover:text-amber-400 group-hover:scale-110"
              }`} />
              <span className="transition-all duration-300">{item.name}</span>
              {isHighlight && !isActive && (
                <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-medium">NEW</span>
              )}

              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-zinc-800">
        <nav className="p-6 space-y-1">
          {bottomNavigation.map((item) => {
            let isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`group relative flex items-center gap-4 px-4 py-4 text-sm font-normal tracking-wide transition-all duration-300 ${
                  isActive
                    ? "text-white bg-gradient-to-r from-zinc-800 to-transparent border-l-2 border-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900/50 border-l-2 border-transparent hover:border-zinc-700 hover:translate-x-1"
                }`}
              >
                <item.icon className={`h-5 w-5 transition-all duration-300 ${
                  isActive ? "text-amber-400" : "group-hover:text-amber-400 group-hover:scale-110"
                }`} />
                <span className="transition-all duration-300">{item.name}</span>

                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-8 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <div className="text-xs text-zinc-400 font-normal tracking-wide">
            {t("mvpStage")}
          </div>
        </div>
      </div>
    </div>
  )
}
