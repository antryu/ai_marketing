"use client"

import { Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="inline-flex items-center gap-1 bg-zinc-900/50 border border-zinc-700 rounded p-1">
      <button
        onClick={() => setLanguage("ko")}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 rounded
          ${language === "ko"
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
            : "text-zinc-400 hover:text-zinc-200"
          }
        `}
      >
        <Globe className="w-3.5 h-3.5" />
        한글
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 rounded
          ${language === "en"
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
            : "text-zinc-400 hover:text-zinc-200"
          }
        `}
      >
        <Globe className="w-3.5 h-3.5" />
        EN
      </button>
    </div>
  )
}
