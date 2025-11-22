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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
