import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "인증 - AI 마케팅 자동화",
  description: "로그인 또는 회원가입하여 시작하세요",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-8 md:p-12 lg:p-16 relative overflow-hidden">
      {/* Subtle grid pattern - Buffer style */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05),transparent_50%)]"></div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
