"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Lock } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error(
        language === "en"
          ? "Passwords do not match"
          : "비밀번호가 일치하지 않습니다"
      )
      return
    }

    if (password.length < 6) {
      toast.error(
        language === "en"
          ? "Password must be at least 6 characters"
          : "비밀번호는 최소 6자 이상이어야 합니다"
      )
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      toast.success(
        language === "en"
          ? "Password updated successfully!"
          : "비밀번호가 성공적으로 변경되었습니다!"
      )
      router.push("/login")
    } catch (error: any) {
      toast.error(
        error.message ||
        (language === "en" ? "Failed to reset password" : "비밀번호 재설정 실패")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_50%)]"></div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-light text-white tracking-wide mb-4">
              {language === "en" ? "Create New Password" : "새 비밀번호 생성"}
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
            <p className="text-zinc-300 font-normal tracking-wide">
              {language === "en"
                ? "Enter your new password below."
                : "새로운 비밀번호를 입력해주세요."}
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium tracking-wide text-zinc-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                {language === "en" ? "New Password" : "새 비밀번호"}
              </label>
              <input
                id="password"
                type="password"
                placeholder={language === "en" ? "Enter new password" : "새 비밀번호 입력"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="flex h-11 w-full rounded border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-base font-normal tracking-wide text-white shadow-sm transition-all duration-300 placeholder:text-zinc-400 placeholder:font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50 focus-visible:bg-zinc-900 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium tracking-wide text-zinc-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                {language === "en" ? "Confirm Password" : "비밀번호 확인"}
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder={language === "en" ? "Confirm new password" : "비밀번호 재입력"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="flex h-11 w-full rounded border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-base font-normal tracking-wide text-white shadow-sm transition-all duration-300 placeholder:text-zinc-400 placeholder:font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50 focus-visible:bg-zinc-900 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5 h-11 px-8 w-full"
            >
              {loading
                ? (language === "en" ? "Updating..." : "업데이트 중...")
                : (language === "en" ? "Reset Password" : "비밀번호 재설정")}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
