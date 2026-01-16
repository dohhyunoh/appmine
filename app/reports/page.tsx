import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

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

  const reports = Array.from(keywordMap.values())

  // Fetch trend data for each keyword
  const { data: trendData } = await supabase
    .from('market_reports')
    .select('keyword, trends_data')

  const trendsMap = new Map()
  trendData?.forEach((t: any) => trendsMap.set(t.keyword, t.trends_data))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Reports
        </h1>
        <p className="text-muted-foreground text-lg">
          View all market research reports
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports?.map((report) => {
          const trends = trendsMap.get(report.keyword)
          const trendIcon = trends?.trend_direction?.includes('GROWING') 
            ? <TrendingUp className="w-5 h-5 text-green-500" />
            : trends?.trend_direction?.includes('DECLINING')
            ? <TrendingDown className="w-5 h-5 text-red-500" />
            : <Minus className="w-5 h-5 text-gray-500" />

          return (
            <Link key={report.keyword} href={`/reports/${encodeURIComponent(report.keyword)}`}>
              <Card className="p-6 border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {report.keyword}
                    </h3>
                  </div>
                  {trendIcon}
                </div>

                {/* Trend Data */}
                {trends && (
                  <div className="mb-4 p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Search Interest</span>
                      <span className="font-semibold text-foreground">
                        {trends.recent_interest}/100
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {trends.trend_direction}
                    </div>
                  </div>
                )}

                {/* Opportunities count */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {report.total_niches} Opportunities
                  </Badge>
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground mt-4">
                  Last updated: {new Date(report.created_at).toLocaleDateString()}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {(!reports || reports.length === 0) && (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground text-lg mb-4">No market reports yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first market research report to get started
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Create New Report
          </Link>
        </div>
      )}
    </div>
  )
}
