"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Zap, ArrowRight, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (authError) throw authError

      if (authData?.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: fullName,
          })

        if (profileError) throw profileError

        toast.success("회원가입 성공! 이메일을 확인해주세요.")
        router.push("/login")
      }
    } catch (error: any) {
      toast.error(error.message || "회원가입에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
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
      toast.error(error.message || "Google 회원가입에 실패했습니다")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_50%)]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-light tracking-wide text-white">
              AI <span className="text-amber-400">Marketing</span>
            </span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          <div className="relative">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-light text-white tracking-wide mb-4">
                시작하기
              </h1>
              <div className="w-16 h-px bg-gradient-to-r from-amber-400 to-transparent mb-6"></div>
              <p className="text-zinc-300 font-normal tracking-wide">
                AI 마케팅 자동화를 시작하세요
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  이름
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="홍길동"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-zinc-400 font-normal">
                  최소 6자 이상
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base group"
                disabled={loading}
              >
                {loading ? "가입 중..." : (
                  <>
                    <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    시작하기
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full h-px bg-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-4 text-zinc-400 font-normal tracking-wide">또는</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleGoogleSignup}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </Button>

              {/* Login Link */}
              <div className="text-center pt-6 border-t border-zinc-800">
                <p className="text-zinc-400 font-normal text-sm tracking-wide">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300">
                    로그인
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Speed indicator */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-700 border border-zinc-700">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium tracking-wider text-zinc-200">빠른 가입 · 5분 소요</span>
          </div>
        </div>
      </div>
    </div>
  )
}
