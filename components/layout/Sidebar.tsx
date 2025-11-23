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
} from "lucide-react"

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard, highlight: false },
  { name: "일괄 생성", href: "/content/bulk", icon: Sparkles, highlight: true },
  { name: "콘텐츠", href: "/content", icon: FileText, highlight: false },
  { name: "캘린더", href: "/calendar", icon: Calendar, highlight: false },
  { name: "분석", href: "/analytics", icon: BarChart3, highlight: false },
  { name: "요금제", href: "/pricing", icon: CreditCard, highlight: false },
  { name: "설정", href: "/settings", icon: Settings, highlight: false },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-72 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-r border-zinc-800 flex flex-col relative">
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-amber-400/20 to-transparent"></div>

      <div className="h-20 px-8 flex items-center border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700 group-hover:border-amber-400/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-400/20">
            <Zap className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <span className="font-light text-xl text-white tracking-wide block group-hover:text-amber-400 transition-colors duration-300">AI Marketing</span>
          </div>
        </Link>
      </div>

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
              // /content는 /content/bulk를 제외한 하위 경로만 활성화
              isActive = !pathname.startsWith("/content/bulk")
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

      <div className="p-8 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <div className="text-xs text-zinc-400 font-normal tracking-wide">
            1단계 MVP
          </div>
        </div>
      </div>
    </div>
  )
}
