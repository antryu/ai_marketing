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
  Scissors,
  Maximize2,
  Volume2,
  Save,
  Edit,
  Check
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
        <div className="p-4">
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
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

      {/* Edit and Save Actions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ✨ 콘텐츠 개선하기
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>{isEditing ? "편집 취소" : "직접 수정"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefine("refine")}
            disabled={loading || isEditing}
            className="flex items-center justify-start space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI 정제하기</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefine("add_hook")}
            disabled={loading || isEditing}
            className="flex items-center justify-start space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>훅 강화</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefine("shorten")}
            disabled={loading || isEditing}
            className="flex items-center justify-start space-x-2"
          >
            <Scissors className="h-4 w-4" />
            <span>줄이기</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefine("expand")}
            disabled={loading || isEditing}
            className="flex items-center justify-start space-x-2"
          >
            <Maximize2 className="h-4 w-4" />
            <span>늘리기</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefine("adjust_tone")}
            disabled={loading || isEditing}
            className="flex items-center justify-start space-x-2 col-span-2"
          >
            <Volume2 className="h-4 w-4" />
            <span>톤 조정</span>
          </Button>
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
