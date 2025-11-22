import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/MainLayout"

export const metadata: Metadata = {
  title: "대시보드 - AI 마케팅 자동화",
  description: "AI 기반 마케팅 자동화 플랫폼",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
