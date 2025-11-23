// This is a helper file showing how to add the analyzer to the main page
// Add this function after the resetForm function:

const handleAnalysisComplete = (analysis: any) => {
  setFormData({
    name: analysis.suggested_name || '',
    description: `AI 분석으로 생성된 페르소나`,
    writing_style: analysis.writing_style || 'professional',
    tone: analysis.tone || 'friendly',
    opening: 'question',
    body: 'mixed',
    closing: 'cta',
    expertise_areas: analysis.expertise_areas?.join(', ') || '',
    unique_perspective: analysis.unique_perspective || '',
    emoji_usage: analysis.emoji_usage || 'moderate',
    sentence_length: analysis.sentence_length || 'medium',
    paragraph_length: 'standard',
    technical_terms: analysis.technical_terms || false,
    use_analogies: analysis.use_analogies || false,
    use_data_statistics: analysis.use_data_statistics || false,
    signature_phrases: analysis.signature_phrases?.join(', ') || '',
    catchphrase: '',
  })
  setIsCreating(true)
  toast.success('분석 결과가 폼에 입력되었습니다. 확인 후 저장하세요!')
}

// Add this component before the form in the isCreating section:
{!editingId && (
  <div className="mb-6">
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
        <TabsTrigger value="manual" className="data-[state=active]:bg-zinc-700">
          직접 입력
        </TabsTrigger>
        <TabsTrigger value="analyze" className="data-[state=active]:bg-zinc-700">
          AI 분석
        </TabsTrigger>
      </TabsList>
      <TabsContent value="manual" className="mt-0">
        {/* Form goes here */}
      </TabsContent>
      <TabsContent value="analyze" className="mt-4">
        <WritingAnalyzer onAnalysisComplete={handleAnalysisComplete} />
      </TabsContent>
    </Tabs>
  </div>
)}
