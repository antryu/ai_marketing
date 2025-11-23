'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface WritingAnalyzerProps {
  onAnalysisComplete: (analysis: any) => void
}

export function WritingAnalyzer({ onAnalysisComplete }: WritingAnalyzerProps) {
  const [sampleText, setSampleText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiModel, setAiModel] = useState('claude')

  const handleAnalyze = async () => {
    if (!sampleText.trim() || sampleText.trim().length < 50) {
      toast.error('최소 50자 이상의 글을 입력해주세요')
      return
    }

    setAnalyzing(true)

    try {
      const response = await fetch('/api/writer-persona/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          aiModel: aiModel === 'claude' ? null : aiModel
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '분석 실패')
      }

      toast.success('글 분석이 완료되었습니다!')
      onAnalysisComplete(data.analysis)

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || '분석 중 오류가 발생했습니다')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI 글 분석
        </CardTitle>
        <CardDescription className="text-zinc-400">
          SNS나 다른 곳에서 작성한 글을 입력하면 AI가 당신의 글쓰기 스타일을 분석합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-300">작성한 글 샘플 (최소 50자)</Label>
          <Textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder={`예시:
오늘 우리 팀은 새로운 AI 기능을 출시했습니다! 🚀

이번 업데이트로 콘텐츠 생성이 3배 빨라졌고, 정확도도 크게 향상되었습니다. 특히 마케팅 콘텐츠를 작성하시는 분들께 큰 도움이 될 것 같습니다.

개발 과정에서 가장 어려웠던 점은 사용자 경험을 해치지 않으면서도 성능을 최적화하는 것이었습니다. 결과적으로 만족스러운 수준에 도달했다고 생각합니다.

피드백은 언제든 환영합니다! 💬`}
            rows={10}
            className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
          />
          <p className="text-xs text-zinc-500">
            {sampleText.length}자 / 최소 50자
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">AI 모델</Label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">🟣 Claude (Anthropic)</SelectItem>
              <SelectItem value="qwen2.5:7b">⭐ Qwen 2.5 7B</SelectItem>
              <SelectItem value="phi3:3.8b">⚡ Phi3 3.8B</SelectItem>
              <SelectItem value="llama3.2:3b">🦙 Llama 3.2 3B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing || sampleText.trim().length < 50}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {analyzing ? (
            <>분석 중...</>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI로 글 분석하기
            </>
          )}
        </Button>

        <div className="p-3 bg-amber-900/10 border border-amber-400/30 rounded">
          <p className="text-xs text-amber-200">
            💡 <strong>Tip:</strong> 블로그, SNS, 이메일 등 평소 작성한 글을 붙여넣으면 AI가 자동으로 당신만의 글쓰기 페르소나를 생성합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
