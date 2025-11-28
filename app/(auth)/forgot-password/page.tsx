"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function ForgotPasswordPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast.success(
        language === "en"
          ? "Password reset link sent to your email!"
          : "비밀번호 재설정 링크가 이메일로 전송되었습니다!"
      )
    } catch (error: any) {
      toast.error(
        error.message ||
        (language === "en" ? "Failed to send reset email" : "재설정 이메일 전송 실패")
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
        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 mb-8 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-wide">
            {language === "en" ? "Back to Login" : "로그인으로 돌아가기"}
          </span>
        </Link>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-light text-white tracking-wide mb-4">
              {language === "en" ? "Reset Password" : "비밀번호 재설정"}
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
            <p className="text-zinc-300 font-normal tracking-wide">
              {language === "en"
                ? "Enter your email address and we'll send you a link to reset your password."
                : "이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다."}
            </p>
          </div>

          {emailSent ? (
            <div className="space-y-6">
              <div className="bg-amber-400/10 border border-amber-400/30 rounded p-6">
                <p className="text-amber-400 text-sm tracking-wide">
                  {language === "en"
                    ? "Check your email for a password reset link. If you don't see it, check your spam folder."
                    : "이메일에서 비밀번호 재설정 링크를 확인하세요. 받은편지함에 없다면 스팸 폴더를 확인해주세요."}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium tracking-wide transition-all duration-300 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 h-11 px-8 w-full"
              >
                {language === "en" ? "Back to Login" : "로그인으로 돌아가기"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium tracking-wide text-zinc-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  ? (language === "en" ? "Sending..." : "전송 중...")
                  : (language === "en" ? "Send Reset Link" : "재설정 링크 전송")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
