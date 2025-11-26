"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Mail, Lock, Zap } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export function LoginForm() {
  const router = useRouter()
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success(language === "en" ? "Login successful!" : "로그인 성공!")
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t("loginError"))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || t("googleLoginError"))
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_50%)]"></div>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-light tracking-wide text-white">
              My <span className="text-amber-400">Marketing Wise</span>
            </span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-light text-white tracking-wide mb-4">
              {t("loginTitle")}
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
            <p className="text-zinc-300 font-normal tracking-wide">
              {t("loginSubtitle")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium tracking-wide text-zinc-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="flex h-11 w-full rounded border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-base font-normal tracking-wide text-white shadow-sm transition-all duration-300 placeholder:text-zinc-400 placeholder:font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50 focus-visible:bg-zinc-900 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-content gap-2 whitespace-nowrap rounded text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 hover:-translate-y-0.5 h-11 px-8 w-full"
            >
              {loading ? t("loggingIn") : t("loginButton")}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-zinc-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-4 text-zinc-400 font-normal text-sm tracking-wide">
                  {t("orDivider")}
                </span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 bg-transparent border border-zinc-700 hover:border-amber-400/50 text-white hover:bg-zinc-900/50 hover:text-amber-400 h-11 px-8 w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("continueWithGoogle")}
            </button>

            {/* Signup Link */}
            <div className="text-center pt-6 border-t border-zinc-800">
              <p className="text-zinc-400 font-normal text-sm tracking-wide">
                {t("noAccount")}{" "}
                <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300">
                  {t("signup")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
