import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
interface App {
  id: string;
  name: string;
  description: string;
  rating: number;
  embedding: number[];
  reviews: Review[];
}

interface Review {
  score: number;
  text: string;
  date: string;
}

interface MicroNiche {
  niche_name: string;
  target_user: string;
  core_problem: string;
  solution: string;
  why_this_is_different: string;
  frequency?: number;
  opportunity_score?: number;
}

interface SubCategorySummary {
  approach_name: string;
  apps_analyzed: number;
  total_reviews: number;
  what_this_approach_does_well: string;
  core_limitation: string;
}

interface Analysis {
  sub_category_summary: SubCategorySummary;
  micro_niches: MicroNiche[];
}

// Helper Functions
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

// Group apps by similarity (finds sub-categories within the same niche)
function groupAppsBySimilarity(apps: App[]): App[][] {
  if (apps.length <= 2) {
    console.log(`Only ${apps.length} apps - analyzing together`);
    return [apps];
  }
  
  const SIMILARITY_THRESHOLD = 0.7;
  
  const groups: App[][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < apps.length; i++) {
    if (used.has(i)) continue;
    
    const group = [apps[i]];
    used.add(i);
    
    // Find apps with similar approach to this one
    for (let j = i + 1; j < apps.length; j++) {
      if (used.has(j)) continue;
      
      const similarity = cosineSimilarity(apps[i].embedding, apps[j].embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        group.push(apps[j]);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  // Log similarity matrix for debugging
  console.log(`Similarity Matrix:`);
  for (let i = 0; i < Math.min(apps.length, 5); i++) {
    for (let j = i + 1; j < Math.min(apps.length, 5); j++) {
      const sim = cosineSimilarity(apps[i].embedding, apps[j].embedding);
      console.log(`${apps[i].name} ↔ ${apps[j].name}: ${sim.toFixed(3)}`);
    }
  }
  
  console.log(`Found ${groups.length} distinct sub-categories`);
  groups.forEach((g, idx) => {
    console.log(`Group ${idx + 1}: ${g.map(a => a.name).join(', ')}`);
  });
  
  return groups;
}

// Review Formatting
function formatReviewsForAI(apps: App[]): string {
  let output = '';
  
  for (const app of apps) {
    const reviews = app.reviews || [];
    output += `\n=== ${app.name} (${app.rating}★ avg, ${reviews.length} reviews) ===\n`;
    
    // Prioritize negative and mixed reviews (most insightful)
    const negative = reviews.filter((r: any) => r.score <= 3);
    const mixed = reviews.filter((r: any) => r.score === 4);
    const positive = reviews.filter((r: any) => r.score === 5);

    if (negative.length > 0) {
      output += `\n[NEGATIVE/CRITICAL (1-3★)] - ${negative.length} reviews:\n`;
      negative.forEach((r: any) => output += `[${r.score}★] ${r.text}\n\n`);
    }

    if (mixed.length > 0) {
      output += `\n[MIXED FEEDBACK (4★)] - ${mixed.length} reviews:\n`;
      mixed.slice(0, 30).forEach((r: any) => output += `[${r.score}★] ${r.text}\n\n`);
    }

    if (positive.length > 0) {
      output += `\n[POSITIVE (5★)] - Sample of ${positive.length} reviews:\n`;
      positive.slice(0, 20).forEach((r: any) => output += `[${r.score}★] ${r.text}\n\n`);
    }
  }

  return output;
}

// AI Analysis
async function analyzeApps(apps: App[], keyword: string, groupIndex: number): Promise<Analysis | null> {
  const groupName = apps.length > 1 ? `Group ${groupIndex + 1}` : 'All Apps';
  console.log(`Analyzing ${groupName}:`);
  console.log(`Apps: ${apps.map(a => a.name).join(', ')}`);
  
  const totalReviews = apps.reduce((sum, a) => sum + (a.reviews?.length || 0), 0);
  console.log(`Reviews: ${totalReviews}`);
  
  const reviewText = formatReviewsForAI(apps);
  
  // Determine group theme from app names/descriptions
  const appSummary = apps.map(a => `${a.name}: ${a.description?.slice(0, 150)}`).join('\n');
  
  const prompt = `You are analyzing a SUB-CATEGORY of apps within the "${keyword}" market.

These ${apps.length} apps were grouped together because they have a SIMILAR APPROACH (e.g., all gamified, or all minimalist).

APPS IN THIS SUB-CATEGORY:
${appSummary}

TOTAL REVIEWS: ${totalReviews} recent reviews

${reviewText}

TASK: Find SPECIFIC micro-niche opportunities that THESE SPECIFIC TYPES of apps are missing.

Since these apps share a similar approach, find:

1. **What this approach does well** (what users love about it)
2. **What limitations this approach has** (what users complain about)
3. **Which user types struggle with this approach** (e.g., "ADHD users struggle with streak-based gamification")
4. **What tweaks would make this approach perfect** (small changes, not complete redesigns)

For each micro-niche:
- Target users who WANT this type of app but find it frustrating
- Suggest a VARIANT of this approach that fixes the issue

OUTPUT JSON:
{
  "sub_category_summary": {
    "approach_name": "What's the common approach? (e.g., 'Gamified with social features' or 'Minimalist streak trackers')",
    "apps_analyzed": ${apps.length},
    "total_reviews": ${totalReviews},
    "what_this_approach_does_well": "What users consistently praise",
    "core_limitation": "The main weakness of this approach"
  },
  "micro_niches": [
    {
      "niche_name": "Very specific (e.g., 'Gamified habit tracking WITHOUT streak anxiety')",
      "target_user": "Who wants this approach but is frustrated?",
      "core_problem": "What about THIS approach frustrates them?",
      "solution": "Feature 1",
      "why_this_is_different": "How is this different from the existing apps in this group?"
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0
      }
    });
    
    const result = await model.generateContent(prompt);
    let analysis = JSON.parse(result.response.text());
    
    // Fix: AI sometimes wraps response in array - unwrap it
    if (Array.isArray(analysis)) {
      analysis = analysis[0];
    }

    console.log(`Saved. Found ${analysis.micro_niches?.length || 0} micro-niches`);

    return analysis;

  } catch (err: any) {
    console.error(`Analysis Error: ${err.message}`);
    return null;
  }
}

// Main Analysis Pipeline
export async function runAnalysisPipeline(
  keyword: string,
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`ANALYZING: ${keyword}`);

  // Normalize keyword to lowercase for consistent querying
  const normalizedKeyword = keyword.toLowerCase().trim();

  // Clear previous analysis for this keyword
  console.log(`Clearing old reports for "${normalizedKeyword}"...`);
  const { error: deleteError } = await supabase
    .from('market_analysis')
    .delete()
    .eq('keyword', normalizedKeyword);
    
  if (deleteError) {
    console.error("Error clearing old data:", deleteError.message);
  } else {
    console.log("Old data cleared.");
  }

  // Fetch apps
  const { data: apps, error } = await supabase
    .from('apps')
    .select('*')
    .eq('keyword_tag', normalizedKeyword)
    .order('rating', { ascending: false });

  if (error || !apps || apps.length === 0) {
    throw new Error("No apps found. Run scraper first!");
  }

  console.log(`Loaded ${apps.length} apps`);

  // Parse string embeddings to arrays
  const validApps = apps.map((app: any) => {
    if (typeof app.embedding === 'string') {
      return { ...app, embedding: JSON.parse(app.embedding) };
    }
    return app;
  }).filter((a: any) => 
    a.embedding && Array.isArray(a.embedding) && a.embedding.length > 0
  );

  if (validApps.length === 0) {
    throw new Error("No apps with embeddings. Check scraper!");
  }

  console.log(`${validApps.length} apps ready for analysis`);

  // Group apps by similarity
  console.log(`Grouping apps by approach...`);
  const groups = groupAppsBySimilarity(validApps);

  // Analyze each group
  const allAnalyses = [];

  for (let i = 0; i < groups.length; i++) {
    const analysis = await analyzeApps(groups[i], keyword, i);
    if (analysis) {
      // Save to database
      await supabase.from('market_analysis').insert({
        keyword: normalizedKeyword,
        apps: groups[i].map(a => a.name),
        analysis: analysis,
        review_count: groups[i].reduce((sum, a) => sum + (a.reviews?.length || 0), 0),
        created_at: new Date()
      });
      
      allAnalyses.push(analysis);
    }
  }

  console.log(`ANALYSIS COMPLETE`);

  return {
    keyword,
    groupsAnalyzed: groups.length,
    analyses: allAnalyses,
    totalApps: validApps.length
  };
}
