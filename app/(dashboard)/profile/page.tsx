"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { User, Mail, Lock, Save } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function ProfilePage() {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setEmail(user.email || "")
    }
  }

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) {
      toast.error(language === "en" ? "Please enter a new email" : "새 이메일을 입력하세요")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email })

      if (error) throw error

      toast.success(
        language === "en"
          ? "Verification email sent! Please check your inbox."
          : "인증 이메일이 전송되었습니다! 받은편지함을 확인하세요."
      )
    } catch (error: any) {
      toast.error(error.message || (language === "en" ? "Failed to update email" : "이메일 변경 실패"))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(language === "en" ? "Please fill in all password fields" : "모든 비밀번호 필드를 입력하세요")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === "en" ? "Passwords do not match" : "비밀번호가 일치하지 않습니다")
      return
    }

    if (newPassword.length < 6) {
      toast.error(
        language === "en"
          ? "Password must be at least 6 characters"
          : "비밀번호는 최소 6자 이상이어야 합니다"
      )
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      toast.success(language === "en" ? "Password updated successfully!" : "비밀번호가 변경되었습니다!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || (language === "en" ? "Failed to update password" : "비밀번호 변경 실패"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white tracking-wide mb-2">
          {language === "en" ? "Profile Settings" : "프로필 설정"}
        </h1>
        <div className="w-20 h-px bg-gradient-to-r from-amber-400 to-transparent mb-4"></div>
        <p className="text-zinc-400 font-normal tracking-wide">
          {language === "en"
            ? "Manage your account settings and preferences"
            : "계정 설정 및 환경설정 관리"}
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-700">
          <User className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-normal text-white tracking-wide">
            {language === "en" ? "Account Information" : "계정 정보"}
          </h2>
        </div>

        {/* Email Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              {language === "en" ? "Email Address" : "이메일 주소"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleUpdateEmail}
                disabled={loading || email === user?.email}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
              >
                <Save className="w-4 h-4 mr-2" />
                {language === "en" ? "Update" : "변경"}
              </Button>
            </div>
            <p className="text-xs text-zinc-400">
              {language === "en"
                ? "You'll receive a verification email at the new address"
                : "새 이메일 주소로 인증 메일이 전송됩니다"}
            </p>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-700">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-normal text-white tracking-wide">
            {language === "en" ? "Change Password" : "비밀번호 변경"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {language === "en" ? "New Password" : "새 비밀번호"}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder={language === "en" ? "Enter new password" : "새 비밀번호 입력"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {language === "en" ? "Confirm Password" : "비밀번호 확인"}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder={language === "en" ? "Confirm new password" : "비밀번호 재입력"}
            />
          </div>

          <Button
            onClick={handleUpdatePassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
          >
            <Lock className="w-4 h-4 mr-2" />
            {loading
              ? (language === "en" ? "Updating..." : "변경 중...")
              : (language === "en" ? "Change Password" : "비밀번호 변경")}
          </Button>
        </div>
      </div>

      {/* User ID Info */}
      <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded">
        <p className="text-xs text-zinc-400">
          {language === "en" ? "User ID" : "사용자 ID"}: {user?.id || "Loading..."}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {language === "en" ? "Created" : "가입일"}:{" "}
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Loading..."}
        </p>
      </div>
    </div>
  )
}
