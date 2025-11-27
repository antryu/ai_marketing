'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserPlus, Mail, Calendar, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: 'active' | 'unsubscribed'
  subscribed_at: string
  created_at: string
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
    setLastUpdate(new Date())
  }, [])

  // 구독자 목록 불러오기
  useEffect(() => {
    fetchSubscribers()
  }, [])

  // Supabase 실시간 구독 설정
  useEffect(() => {
    const supabase = createClient()

    // 실시간 변경사항 구독
    const channel = supabase
      .channel('subscribers-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'subscribers'
        },
        (payload) => {
          console.log('실시간 변경 감지:', payload)
          setLastUpdate(new Date())

          if (payload.eventType === 'INSERT') {
            // 새 구독자 추가
            setSubscribers(prev => [payload.new as Subscriber, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // 구독자 정보 수정
            setSubscribers(prev =>
              prev.map(s => s.id === payload.new.id ? payload.new as Subscriber : s)
            )
          } else if (payload.eventType === 'DELETE') {
            // 구독자 삭제
            setSubscribers(prev => prev.filter(s => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchSubscribers() {
    try {
      setLoading(true)
      const response = await fetch('/api/subscribers')
      const data = await response.json()

      if (response.ok) {
        setSubscribers(data.subscribers || [])
      } else {
        console.error('Failed to fetch subscribers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setLoading(false)
    }
  }

  // 구독자 추가
  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault()

    if (!newEmail.trim()) {
      alert('이메일을 입력하세요')
      return
    }

    try {
      setAdding(true)
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribers([data.subscriber, ...subscribers])
        setNewEmail('')
        setNewName('')
        setIsAddDialogOpen(false)
      } else {
        alert(data.error || '구독자 추가 실패')
      }
    } catch (error) {
      console.error('Error adding subscriber:', error)
      alert('구독자 추가 중 오류 발생')
    } finally {
      setAdding(false)
    }
  }

  // 구독자 삭제
  async function handleDeleteSubscriber(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/subscribers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSubscribers(subscribers.filter(s => s.id !== id))
      } else {
        const data = await response.json()
        alert(data.error || '삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error)
      alert('삭제 중 오류 발생')
    }
  }

  // 검색 필터링
  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 통계
  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">구독자 관리</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-zinc-400">이메일 구독자를 관리하세요</p>
            {mounted && lastUpdate && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>실시간 업데이트 중</span>
                <span className="text-zinc-600">·</span>
                <span>마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              구독자 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 구독자 추가</DialogTitle>
              <DialogDescription>구독자 정보를 입력하세요</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름 (선택)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? '추가 중...' : '추가'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 구독자</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>활성 구독자</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>구독 취소</CardDescription>
            <CardTitle className="text-3xl text-zinc-500">{stats.unsubscribed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <Input
          placeholder="이메일 또는 이름 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* 구독자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>구독자 목록</CardTitle>
          <CardDescription>
            {filteredSubscribers.length}명의 구독자
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-zinc-400">로딩 중...</div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              {searchQuery ? '검색 결과가 없습니다' : '구독자가 없습니다'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{subscriber.email}</p>
                        <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                          {subscriber.status === 'active' ? '활성' : '구독취소'}
                        </Badge>
                      </div>
                      {subscriber.name && (
                        <p className="text-sm text-zinc-400">{subscriber.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(subscriber.subscribed_at).toLocaleDateString('ko-KR')} 가입
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubscriber(subscriber.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
