"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations, TranslationKey } from "@/lib/translations"

export default function CalendarPage() {
  const { language } = useLanguage()
  const t = (key: TranslationKey) => translations[key][language]

  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScheduledPosts()
  }, [currentDate])

  const loadScheduledPosts = async () => {
    const supabase = createClient()

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data } = await (supabase as any)
      .from("published_posts")
      .select(`
        *,
        content:contents(topic, platform)
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", startOfMonth.toISOString())
      .lte("scheduled_at", endOfMonth.toISOString())
      .order("scheduled_at")

    setScheduledPosts(data || [])
    setLoading(false)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getPostsForDate = (date: Date | null) => {
    if (!date) return []

    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at)
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getPlatformColor = (platform: string) => {
    const colors: any = {
      thread: "bg-purple-900/30 border-purple-700 text-purple-400",
      linkedin: "bg-blue-900/30 border-blue-700 text-blue-400",
      instagram: "bg-pink-900/30 border-pink-700 text-pink-400",
      twitter: "bg-sky-900/30 border-sky-700 text-sky-400",
    }
    return colors[platform] || "bg-zinc-700 border-zinc-600 text-zinc-400"
  }

  const days = getDaysInMonth()
  const monthName = currentDate.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", { month: "long", year: "numeric" })

  const weekDays = useMemo(() => [
    t("sunday"),
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday")
  ], [language])

  return (
    <div className="p-12">
      <div className="max-w-7xl mx-auto">

        {/* Calendar */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-10">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-white tracking-wide">{monthName}</h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 flex items-center justify-center transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400 hover:text-amber-400" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 text-zinc-300 hover:text-white text-sm font-normal transition-all duration-300"
              >
                {t("today")}
              </button>
              <button
                onClick={nextMonth}
                className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 flex items-center justify-center transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5 text-zinc-400 hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week Day Headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-zinc-400 font-medium text-sm tracking-wide"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((date, index) => {
              const postsForDay = getPostsForDate(date)
              const isToday = date &&
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear()

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border transition-all duration-300 p-2 ${
                    date
                      ? isToday
                        ? "border-amber-400 bg-amber-900/10"
                        : "border-zinc-700 hover:border-zinc-600"
                      : "border-transparent bg-zinc-900/50"
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-normal mb-2 ${
                        isToday ? "text-amber-400" : "text-zinc-400"
                      }`}>
                        {date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {postsForDay.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs p-1 border ${getPlatformColor(post.content?.platform)} cursor-pointer hover:scale-105 transition-transform duration-300`}
                            title={post.content?.topic}
                          >
                            <div className="truncate">
                              {post.content?.topic || t("noTitle")}
                            </div>
                          </div>
                        ))}
                        {postsForDay.length > 3 && (
                          <div className="text-xs text-zinc-500 font-normal">
                            +{postsForDay.length - 3} {t("moreItems")}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-zinc-700">
            <p className="text-sm text-zinc-400 font-normal mb-3">{t("platformLegend")}</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-900/30 border border-purple-700"></div>
                <span className="text-xs text-zinc-400 font-normal">Thread</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-900/30 border border-blue-700"></div>
                <span className="text-xs text-zinc-400 font-normal">LinkedIn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-900/30 border border-pink-700"></div>
                <span className="text-xs text-zinc-400 font-normal">Instagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-900/30 border border-sky-700"></div>
                <span className="text-xs text-zinc-400 font-normal">Twitter/X</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
