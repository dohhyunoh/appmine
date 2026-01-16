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

      {analysisGroups.map((group: AnalysisGroup, groupIdx: number) => {
        // Fix: Handle case where analysis is wrapped in array
        const analysisData = Array.isArray(group.analysis) ? group.analysis[0] : group.analysis
        const summary = analysisData?.sub_category_summary
        const microNiches = analysisData?.micro_niches || []

        return (
          <section key={groupIdx} className="mb-20">
            
            {/* 1. APPROACH HEADER & SUMMARY */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-lg font-bold">
                  {groupIdx + 1}
                </span>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">
                    {summary?.approach_name}
                  </h2>
                  <div className="text-sm text-muted-foreground mt-1">
                    Analyzed: {group.apps?.join(', ')}
                  </div>
                </div>
              </div>

              {/* The Summary Card (Re-added but cleaner) */}
              {summary && (
                <div className="ml-0 md:ml-14 grid md:grid-cols-2 gap-0 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                  
                  {/* Left: What Works (The Good) */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-border bg-blue-50/20 dark:bg-blue-900/10">
                    <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      The Winning Formula
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {summary.what_this_approach_does_well}
                    </p>
                  </div>

                  {/* Right: The Limitation (The Bad) */}
                  <div className="p-6 bg-red-50/10 dark:bg-red-900/5">
                    <div className="flex items-center gap-2 mb-3 text-red-500 dark:text-red-400 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      The Core Limitation
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {summary.core_limitation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. MICRO-NICHE OPPORTUNITIES (The Wedge) */}
            <div className="ml-0 md:ml-14 space-y-8">
              
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                <Target className="w-4 h-4" />
                Identified Gaps (Micro-Niches)
              </div>

              {microNiches.map((niche: MicroNiche, i: number) => (
                <div key={i} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300">
                  
                  {/* Niche Header */}
                  <div className="p-5 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        {niche.niche_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Target: <span className="text-foreground font-medium">{niche.target_user}</span>
                      </p>
                    </div>
                  </div>

                  {/* The Split: Problem vs Solution */}
                  <div className="grid md:grid-cols-2">
                    
                    <div className="p-6 border-b md:border-b-0 md:border-r border-border">
                      <h4 className="text-sm font-semibold text-red-500 dark:text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> User Frustration
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {niche.core_problem}
                      </p>
                    </div>

                    <div className="p-6 bg-green-50/30 dark:bg-green-900/5">
                      <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> MVP Wedge
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {niche.solution}
                      </p>
                    </div>

                  </div>

                  {/* Footer: Why it wins */}
                  <div className="p-3 bg-muted/50 text-xs text-center border-t border-border text-muted-foreground">
                    <span className="font-bold">Strategy:</span> {niche.why_this_is_different}
                  </div>

                </div>
              ))}
            </div>

            {groupIdx < analysisGroups.length - 1 && <Separator className="my-16" />}
          </section>
        )
      })}
    </main>
  )
}

