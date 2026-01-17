import { createClient } from '@/utils/supabase/server'
import { Card } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Users
} from "lucide-react"
import Link from "next/link"
import { normalizeKeyword } from "@/lib/utils"

interface MicroNiche {
  niche_name: string
  target_user: string
  core_problem: string
  example_review?: string
  frequency?: string
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
    }
    micro_niches: MicroNiche[]
  }
  review_count: number
  created_at: string
}

export default async function SubNicheDetailPage({ 
  params 
}: { 
  params: Promise<{ keyword: string; subnicheId: string }> 
}) {
  const { keyword, subnicheId } = await params
  const decodedKeyword = decodeURIComponent(keyword)
  const normalizedKeyword = normalizeKeyword(decodedKeyword)
  const groupIndex = parseInt(subnicheId)
  const supabase = await createClient()
  
  // Fetch all analysis groups for this keyword
  const { data: analysisGroups } = await supabase
    .from('market_analysis')
    .select('*')
    .eq('keyword', normalizedKeyword)
    .order('created_at', { ascending: false })

  if (!analysisGroups || analysisGroups.length === 0 || !analysisGroups[groupIndex]) {
    return <div className="p-8 text-muted-foreground">Sub-niche not found</div>
  }

  const group = analysisGroups[groupIndex]
  const analysisData = Array.isArray(group.analysis) ? group.analysis[0] : group.analysis
  const summary = analysisData?.sub_category_summary
  const microNiches = analysisData?.micro_niches || []

  // Fetch app details (names and icons)
  const { data: appDetails } = await supabase
    .from('apps')
    .select('name, icon_url, app_store_id')
    .in('name', group.apps || [])

  return (
    <main className="container mx-auto min-h-screen py-10 px-4 md:px-6 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/reports/${encodeURIComponent(normalizedKeyword)}`} className="hover:text-foreground transition-colors">
          {normalizedKeyword}
        </Link>
        <span>/</span>
        <span className="text-foreground">{summary?.approach_name}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xl font-bold">
            {groupIndex + 1}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {summary?.approach_name}
            </h1>
          </div>
        </div>

        {/* Apps Grid with Icons */}
        {appDetails && appDetails.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Apps Analyzed</h3>
            <div className="flex flex-wrap gap-4">
              {appDetails.map((app: any) => (
                <div key={app.app_store_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                  <img 
                    src={app.icon_url} 
                    alt={app.name}
                    className="w-12 h-12 rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {app.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-6 text-sm border-y border-border py-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{group.review_count || 0} Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{microNiches.length} Opportunities Found</span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="mb-12 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          {/* What Works (The Good) */}
          <div className="p-6 bg-blue-50/20 dark:bg-blue-900/10">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Why these apps are winning
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary.what_this_approach_does_well}
            </p>
          </div>
        </div>
      )}

      {/* Opportunities Section */}
      <div className="space-y-8">
        <div className="text-sm font-medium text-muted-foreground tracking-wider">
          {microNiches.length} Opportunities 
        </div>

        {microNiches.map((niche: MicroNiche, i: number) => (
          <Card key={i} className="overflow-hidden border-border hover:shadow-lg transition-shadow">
            {/* Niche Header */}
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {niche.niche_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Target:</span> {niche.target_user}
              </p>
            </div>

            {/* Problem vs Solution Grid */}
            <div className="grid md:grid-cols-2">
              {/* User Frustration */}
              {niche.example_review && (
                <div className="p-6 border-b md:border-b-0 md:border-r border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-red-500 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> User Frustration
                    </h4>
                    {niche.frequency && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        niche.frequency === 'high' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : niche.frequency === 'medium'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {niche.frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    {niche.core_problem}
                  </p>
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-red-500">
                    <p className="text-xs text-muted-foreground italic">
                      "{niche.example_review}"
                    </p>
                  </div>
                </div>
              )}

              {/* MVP Wedge */}
              <div className={`p-6 bg-green-50/30 dark:bg-green-900/5 ${!niche.example_review ? 'md:col-span-2' : ''}`}>
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Solution
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {niche.solution}
                </p>
              </div>
            </div>

            {/* Strategy Footer */}
            <div className="p-4 bg-muted/50 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Why it wins:</span> {niche.why_this_is_different}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-12">
        <Link 
          href={`/reports/${encodeURIComponent(normalizedKeyword)}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to all sub-niches
        </Link>
      </div>
    </main>
  )
}
