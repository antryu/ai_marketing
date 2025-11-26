import { MainLayout } from "@/components/layout/MainLayout"
import { BrandProvider } from "@/contexts/BrandContext"

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BrandProvider>
      <MainLayout>{children}</MainLayout>
    </BrandProvider>
  )
}
