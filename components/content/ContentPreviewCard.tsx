"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Zap,
  Minimize2,
  Maximize2,
  MessageSquare,
  Save,
  Edit,
  Check,
  Wand2,
  RefreshCw
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { RefineAction, ContentStatus } from "@/types/mirra-content.types"

interface ContentPreviewCardProps {
  content: string
  brandName?: string
  brandLogo?: string
  status: ContentStatus
  onRefine: (action: RefineAction) => void
  onSave?: () => void
  onContentChange?: (newContent: string) => void
  loading?: boolean
}

export function ContentPreviewCard({
  content,
  brandName = "브랜드",
  brandLogo,
  status,
  onRefine,
  onSave,
  onContentChange,
  loading = false
}: ContentPreviewCardProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const formatDate = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    switch (status) {
      case "idea":
        return "bg-yellow-500"
      case "draft":
        return "bg-blue-500"
      case "refined":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case "idea":
        return "아이디어"
      case "draft":
        return "초안"
      case "refined":
        return "정제됨"
      default:
        return ""
    }
  }

  const handleSaveEdit = () => {
    if (onContentChange) {
      onContentChange(editedContent)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      {/* Status Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {["idea", "draft", "refined"].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    status === s
                      ? getStatusColor()
                      : ["idea", "draft"].indexOf(status) > idx
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                />
                {idx < 2 && (
                  <div
                    className={`w-8 h-0.5 ${
                      ["idea", "draft"].indexOf(status) > idx
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium">{getStatusLabel()}</span>
        </div>
      </div>

      {/* SNS Card Preview */}
      <Card className="overflow-hidden max-w-md mx-auto border-2 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                {brandLogo ? (
                  <img src={brandLogo} alt={brandName} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {brandName[0]}
                  </div>
                )}
              </Avatar>
              <div>
                <div className="font-semibold text-sm">{brandName}</div>
                <div className="text-xs text-gray-500">{formatDate()}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] font-sans text-sm"
                placeholder="콘텐츠를 입력하세요..."
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  적용
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4">{children}</h2>,
                  p: ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setLiked(!liked)}
              >
                <Heart
                  className={`h-6 w-6 ${
                    liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
              >
                <MessageCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
              >
                <Share2 className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => setSaved(!saved)}
            >
              <Bookmark
                className={`h-6 w-6 ${
                  saved ? "fill-black dark:fill-white" : "text-gray-700 dark:text-gray-300"
                }`}
              />
            </Button>
          </div>

          <div className="mt-2 text-sm">
            <span className="font-semibold">{Math.floor(Math.random() * 100) + 50}명</span>
            <span className="text-gray-600 dark:text-gray-400">이 좋아합니다</span>
          </div>
        </div>
      </Card>

      {/* Edit and Save Actions - 빠른생성 페이지와 동일한 디자인 */}
      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-medium text-zinc-300">
              콘텐츠 개선하기
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                개선 중...
              </div>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:border-zinc-600 transition-colors"
            >
              <Edit className="h-3 w-3" />
              {isEditing ? "편집 취소" : "직접 수정"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onRefine("refine")}
            disabled={loading || isEditing}
            className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300 font-medium">AI 정제</p>
              <p className="text-xs text-zinc-500 truncate">문장을 더 매끄럽게</p>
            </div>
          </button>

          <button
            onClick={() => onRefine("add_hook")}
            disabled={loading || isEditing}
            className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300 font-medium">훅 강화</p>
              <p className="text-xs text-zinc-500 truncate">시작을 더 강렬하게</p>
            </div>
          </button>

          <button
            onClick={() => onRefine("shorten")}
            disabled={loading || isEditing}
            className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minimize2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300 font-medium">줄이기</p>
              <p className="text-xs text-zinc-500 truncate">30% 더 짧게</p>
            </div>
          </button>

          <button
            onClick={() => onRefine("expand")}
            disabled={loading || isEditing}
            className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Maximize2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300 font-medium">늘리기</p>
              <p className="text-xs text-zinc-500 truncate">30% 더 길게</p>
            </div>
          </button>

          <button
            onClick={() => onRefine("adjust_tone")}
            disabled={loading || isEditing}
            className="flex items-center gap-2 p-3 rounded border border-zinc-700 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-zinc-300 font-medium">톤 조정</p>
              <p className="text-xs text-zinc-500 truncate">더 진솔하고 공감 가는 톤으로</p>
            </div>
          </button>
        </div>

        {onSave && (
          <Button
            onClick={onSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium transition-all duration-300 border border-green-500 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/50"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? "저장 중..." : "저장하고 목록으로"}
          </Button>
        )}
      </div>
    </div>
  )
}
