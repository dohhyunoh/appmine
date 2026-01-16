import { createClient } from '@/utils/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp as TrendIcon, 
  Star, 
  Users,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import {normalizeKeyword } from "@/lib/utils"

interface MicroNiche {
  niche_name: string
  target_user: string
  core_problem: string
  frequency: number
  severity: string
  user_quotes: string[]
  opportunity_score: number
  solution: string
  why_this_is_different: string
}

interface AnalysisGroup {
  keyword: string
  apps: string[]
  analysis: {
    sub_category_summary: {
      approach_name: string
      apps_analyzed: number
      total_reviews: number
      what_this_approach_does_well: string
      core_limitation: string
    }
    micro_niches: MicroNiche[]
    feature_gaps: any[]
  }
  review_count: number
  created_at: string
}

export default async function ReportPage({ params }: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await params
  const decodedKeyword = decodeURIComponent(keyword)
  const normalizedKeyword = normalizeKeyword(decodedKeyword) // Normalize for consistent querying
  const supabase = await createClient()
  
  // Fetch all analysis groups for this keyword
  const { data: analysisGroups } = await supabase
    .from('market_analysis')
    .select('*')
    .eq('keyword', normalizedKeyword)
    .order('created_at', { ascending: false })

  // Fetch trends data
  const { data: trendsData } = await supabase
    .from('market_reports')
    .select('trends_data')
    .eq('keyword', normalizedKeyword)
    .single()

  if (!analysisGroups || analysisGroups.length === 0) {
    return <div className="p-8 text-muted-foreground">Report not found</div>
  }

  const trends = trendsData?.trends_data || {}
  const allApps = new Set<string>()
  analysisGroups.forEach((g: AnalysisGroup) => g.apps?.forEach((app: string) => allApps.add(app)))
  const totalReviews = analysisGroups.reduce((sum: number, g: AnalysisGroup) => sum + (g.review_count || 0), 0)

  return (
    <main className="container mx-auto min-h-screen py-10 px-4 md:px-6 max-w-6xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-10">
        <div className="flex items-baseline gap-3 mb-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{normalizedKeyword}</h1>
         
        </div>
        
        {/* Simplified Metrics Bar */}
        <div className="flex flex-wrap gap-8 text-sm border-y border-border py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{trends.recent_interest || 0}/100 Interest</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{totalReviews} Reviews Analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{analysisGroups.length} Sub-niches Identified</span>
          </div>
        </div>
      </div>

      {/* Sub-niches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisGroups.map((group: AnalysisGroup, groupIdx: number) => {
          const analysisData = Array.isArray(group.analysis) ? group.analysis[0] : group.analysis
          const summary = analysisData?.sub_category_summary
          const microNiches = analysisData?.micro_niches || []

          return (
            <Link 
              key={groupIdx} 
              href={`/reports/${encodeURIComponent(normalizedKeyword)}/${groupIdx}`}
              className="group"
            >
              <div className="h-full p-6 border border-border bg-card rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer">
                {/* Number Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-lg font-bold">
                    {groupIdx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {summary?.approach_name}
                    </h3>
                  </div>
                </div>

                {/* Apps Analyzed */}
                <div className="text-xs text-muted-foreground mb-3">
                  Analyzed: {group.apps?.slice(0, 2).join(', ')}{group.apps?.length > 2 ? '...' : ''}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 text-sm border-t border-border pt-3">
                  <div>
                    <span className="text-muted-foreground">Opportunities:</span>
                    <span className="ml-1 font-semibold text-foreground">{microNiches.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reviews:</span>
                    <span className="ml-1 font-semibold text-foreground">{group.review_count || 0}</span>
                  </div>
                </div>

                {/* View Details Arrow */}
                <div className="mt-4 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View details →
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

