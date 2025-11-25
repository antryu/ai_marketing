declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string
    geo?: string
    hl?: string
    startTime?: Date
  }

  interface RelatedQueriesOptions {
    keyword: string
    geo?: string
    hl?: string
  }

  const googleTrends: {
    relatedQueries: (options: RelatedQueriesOptions) => Promise<string>
    interestOverTime: (options: TrendsOptions) => Promise<string>
  }

  export default googleTrends
}
