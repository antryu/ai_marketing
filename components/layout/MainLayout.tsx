"use client"

import { ReactNode, useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

      {/* Ambient gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.03),transparent_50%)] pointer-events-none"></div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - absolute on mobile, static on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - full width on mobile, with margin for sidebar on desktop */}
      <div className="min-h-screen flex flex-col lg:ml-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-6 md:p-10 lg:p-12 xl:p-16">
          {children}
        </main>
      </div>
    </div>
  )
}
