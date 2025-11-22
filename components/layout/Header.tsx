"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Zap } from "lucide-react"
import { toast } from "sonner"

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("로그아웃 되었습니다")
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between px-12 relative">
      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>

      <div>
        <h2 className="text-xl font-normal text-white tracking-wide">대시보드</h2>
        <p className="text-xs text-zinc-400 font-normal tracking-wide">AI 마케팅 자동화 현황</p>
      </div>

      <div className="flex items-center gap-5">
        {/* Enhanced CTA Button with Energy */}
        <button
          onClick={() => router.push("/content/create")}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium py-3 px-8 transition-all duration-300 border border-amber-500 hover:border-amber-400 tracking-wide text-sm hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5"
        >
          새 콘텐츠 생성
        </button>

        <div className="relative group">
          <button className="w-11 h-11 bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 hover:border-amber-400/50 rounded-full flex items-center justify-center font-light text-white text-base transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 hover:scale-105">
            U
          </button>

          {/* Dropdown with enhanced animations */}
          <div className="absolute right-0 top-full mt-3 w-52 bg-zinc-900 border border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] shadow-2xl">
            <div className="p-4 border-b border-zinc-800">
              <p className="font-normal text-white text-sm tracking-wide">내 계정</p>
            </div>
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-normal text-sm tracking-wide transition-all duration-300 group/item"
            >
              <User className="w-4 h-4 text-amber-400 group-hover/item:scale-110 transition-transform duration-300" />
              프로필
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-normal text-sm tracking-wide transition-all duration-300 group/item"
            >
              <LogOut className="w-4 h-4 text-amber-400 group-hover/item:scale-110 transition-transform duration-300" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
