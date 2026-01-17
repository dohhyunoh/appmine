import { createClient } from '@/utils/supabase/server'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const supabase = await createClient()

  // Fetch market analyses grouped by keyword
  const { data: analyses } = await supabase
    .from('market_analysis')
    .select('*')
    .order('created_at', { ascending: false })

  // Get unique keywords with their latest analysis
  const keywordMap = new Map()
  analyses?.forEach((analysis: any) => {
    if (!keywordMap.has(analysis.keyword)) {
      keywordMap.set(analysis.keyword, {
        keyword: analysis.keyword,
        analyses: [],
        created_at: analysis.created_at,
        total_apps: new Set(),
        total_niches: 0
      })
    }
    const entry = keywordMap.get(analysis.keyword)
    entry.analyses.push(analysis)
    analysis.apps?.forEach((app: string) => entry.total_apps.add(app))
    // Fix: Handle case where analysis data is wrapped in array
    const analysisData = Array.isArray(analysis.analysis) ? analysis.analysis[0] : analysis.analysis
    entry.total_niches += analysisData?.micro_niches?.length || 0
  })

  const reports = Array.from(keywordMap.values()).map(report => ({
    keyword: report.keyword,
    total_apps: report.total_apps.size,
    total_niches: report.total_niches,
    created_at: report.created_at,
    analyses: report.analyses
  }))

  // Fetch trend data for each keyword
  const { data: trendData } = await supabase
    .from('market_reports')
    .select('keyword, trends_data')

  const trendsMap = new Map()
  trendData?.forEach((t: any) => trendsMap.set(t.keyword, t.trends_data))

  // Convert trendsMap to plain object for client component
  const trendsData: Record<string, any> = {}
  trendsMap.forEach((value, key) => {
    trendsData[key] = value
  })

  return <ReportsClient reports={reports} trendsData={trendsData} />
}
