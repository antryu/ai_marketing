"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Flag,
} from "lucide-react"

const navigation = [
  { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { name: "CONTENT", href: "/content", icon: FileText },
  { name: "CALENDAR", href: "/calendar", icon: Calendar },
  { name: "ANALYTICS", href: "/analytics", icon: BarChart3 },
  { name: "SETTINGS", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-72 bg-gradient-to-b from-gray-900 to-black border-r-2 border-[#E10600] flex flex-col relative">
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-[#E10600] to-transparent opacity-50"></div>

      <div className="p-6 border-b-2 border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-[#E10600] flex items-center justify-center border-2 border-white transform group-hover:scale-110 transition-transform">
            <Flag className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="font-black text-2xl text-white uppercase tracking-wider block">MARKETING</span>
            <span className="font-black text-xs text-[#E10600] uppercase tracking-widest">AI POWERED</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const activeClasses = isActive
            ? "bg-[#E10600] text-white border-white"
            : "text-gray-400 hover:text-white hover:bg-gray-800 border-transparent"
          const numberClasses = isActive 
            ? "bg-white text-[#E10600] border-white" 
            : "bg-black text-gray-600 border-gray-800 group-hover:border-[#E10600] group-hover:text-[#E10600]"
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-4 px-4 py-4 text-sm font-black uppercase tracking-wider transition-all border-l-4 ${activeClasses}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center font-black text-xs border-2 ${numberClasses}`}>
                {index + 1}
              </div>

              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>

              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t-2 border-gray-800 bg-black">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#E10600] animate-pulse"></div>
          <div className="text-xs text-gray-500 font-black uppercase tracking-wider">
            PHASE 1 MVP
          </div>
        </div>
      </div>
    </div>
  )
}
