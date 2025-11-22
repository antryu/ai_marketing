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
    <header className="h-20 bg-gradient-to-r from-gray-900 to-black border-b-2 border-[#E10600] flex items-center justify-between px-8 relative">
      {/* Racing stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E10600] to-transparent"></div>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#E10600] flex items-center justify-center border-2 border-white">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">AI MARKETING</h2>
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest">AUTOMATION PLATFORM</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/content/create")}
          className="bg-[#E10600] hover:bg-[#C10500] text-white font-black uppercase py-3 px-6 transition-all transform hover:scale-105 border-2 border-white tracking-wider text-sm"
        >
          새 콘텐츠 생성
        </button>

        <div className="relative">
          <button className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black border-2 border-gray-700 hover:border-[#E10600] rounded-full flex items-center justify-center font-black text-white text-xl transition-all peer">
            U
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-black border-2 border-[#E10600] hidden peer-hover:block hover:block transition-all z-[9999] shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <div className="p-4 border-b-2 border-gray-800 bg-gradient-to-br from-gray-900 to-black">
              <p className="font-black text-white uppercase text-sm tracking-wide">내 계정</p>
            </div>
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 font-black uppercase text-sm tracking-wide transition-all"
            >
              <User className="w-4 h-4 text-[#E10600]" />
              프로필
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 font-black uppercase text-sm tracking-wide transition-all"
            >
              <LogOut className="w-4 h-4 text-[#E10600]" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
