"use client"

import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Menu } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"
import { LanguageToggle } from "@/components/LanguageToggle"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t("logoutSuccess"))
    router.push("/login")
    router.refresh()
  }

  // Get page title and subtitle based on pathname
  const getPageInfo = () => {
    if (pathname === "/dashboard") return { title: t("navDashboard"), subtitle: t("dashboardSubtitle") }
    if (pathname === "/brand") return { title: t("navBrandSettings"), subtitle: t("brandSettingsSubtitle") }
    if (pathname === "/writer-personas") return { title: t("navBrandVoice"), subtitle: t("brandVoiceSubtitle") }
    if (pathname === "/personas") return { title: t("navTargetCustomers"), subtitle: t("targetCustomersSubtitle") }
    if (pathname?.startsWith("/content/create")) return { title: t("navContentGeneration"), subtitle: t("contentGenerationSubtitle") }
    if (pathname?.startsWith("/content")) return { title: t("contentListTitle"), subtitle: t("contentListSubtitle") }
    if (pathname === "/calendar") return { title: t("calendarTitle"), subtitle: t("calendarSubtitle") }
    if (pathname === "/analytics") return { title: t("analyticsTitle"), subtitle: t("analyticsSubtitle") }
    if (pathname === "/pricing") return { title: t("pricingTitle"), subtitle: t("pricingSubtitle") }
    if (pathname === "/settings") return { title: t("navSettings"), subtitle: "" }
    if (pathname === "/settings/writer-persona") return { title: t("writerPersonaSettings"), subtitle: t("writerPersonaSubtitle") }
    return { title: t("navDashboard"), subtitle: t("dashboardSubtitle") }
  }

  const pageInfo = getPageInfo()

  // Hide "새 콘텐츠 생성" button on certain pages
  const hideContentButton = pathname === "/dashboard" ||
                           pathname === "/brand" ||
                           pathname === "/personas" ||
                           pathname === "/writer-personas" ||
                           pathname === "/settings" ||
                           pathname === "/content/create" ||
                           pathname === "/content/bulk"

  return (
    <header className="h-16 md:h-20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 md:px-12 relative">
      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>

      <div className="flex items-center gap-4">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-base md:text-xl font-normal text-white tracking-wide">{pageInfo.title}</h2>
          {pageInfo.subtitle && (
            <p className="text-xs text-zinc-400 font-normal tracking-wide hidden md:block">{pageInfo.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-5">
        {/* Language Toggle */}
        <LanguageToggle />

        {/* Enhanced CTA Button with Energy - Only show on relevant pages */}
        {!hideContentButton && (
          <button
            onClick={() => router.push("/content/create")}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-2 md:py-3 px-4 md:px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide text-xs md:text-sm hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
          >
            <span className="hidden md:inline">{t("newContent")}</span>
            <span className="md:hidden">{t("createShort")}</span>
          </button>
        )}

        <div className="relative group">
          <button className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 hover:border-amber-400/50 rounded-full flex items-center justify-center font-light text-white text-sm md:text-base transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 hover:scale-105">
            U
          </button>

          {/* Dropdown with enhanced animations */}
          <div className="absolute right-0 top-full mt-3 w-52 bg-zinc-900 border border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] shadow-2xl">
            <div className="p-4 border-b border-zinc-800">
              <p className="font-normal text-white text-sm tracking-wide">{t("myAccount")}</p>
            </div>
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-normal text-sm tracking-wide transition-all duration-300 group/item"
            >
              <User className="w-4 h-4 text-amber-400 group-hover/item:scale-110 transition-transform duration-300" />
              {t("profile")}
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-normal text-sm tracking-wide transition-all duration-300 group/item"
            >
              <LogOut className="w-4 h-4 text-amber-400 group-hover/item:scale-110 transition-transform duration-300" />
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
