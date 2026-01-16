// @ts-ignore - No type definitions available
import store from 'app-store-scraper';
// @ts-ignore - No type definitions available
import googleTrends from 'google-trends-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types
interface Review {
  score: number;
  text: string;
  date: string;
}

interface ScrapedApp {
  app_store_id: string;
  name: string;
  description: string;
  icon_url: string;
  rating: number;
  keyword_tag: string;
  embedding: number[];
  reviews: Review[];
  last_scraped_at: Date;
}

interface TrendsData {
  keyword: string;
  avg_interest: number | null;
  recent_interest?: number;
  trend_direction: string;
  raw_timeline?: any[];
}

// Generate Embedding for App Description
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err: any) {
    console.error(`Embedding Error: ${err.message}`);
    return [];
  }
}

// Fetch Google Trends Data
export async function fetchTrends(keyword: string): Promise<TrendsData> {
  console.log(`Fetching Google Trends for "${keyword}"...`);
  
  try {
    const results = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)), // Last 12 months
      geo: 'US'
    });

    // Check if response is HTML (error page)
    if (typeof results === 'string' && results.trim().startsWith('<')) {
      console.log(`Trends API returned HTML (likely rate limited or error page)`);
      return { keyword, avg_interest: null, trend_direction: "UNKNOWN" };
    }

    const data = JSON.parse(results);
    const timeline = data.default.timelineData;
    
    // Get average and recent values
    const values = timeline.map((point: any) => point.value[0]);
    const avgInterest = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
    const recentInterest = values[values.length - 1];
    const oldInterest = values[0];
    
    // Calculate trend direction
    const trendChange = recentInterest - oldInterest;
    const trendDirection = trendChange > 5 ? "📈 GROWING" : trendChange < -5 ? "📉 DECLINING" : "➡️ STABLE";
    
    console.log(`Average Interest: ${avgInterest}/100`);
    console.log(`Recent vs 12mo ago: ${oldInterest} → ${recentInterest} (${trendDirection})`);
    
    return {
      keyword,
      avg_interest: avgInterest,
      recent_interest: recentInterest,
      trend_direction: trendDirection,
      raw_timeline: timeline.slice(-6) // Last 6 data points
    };

  } catch (err: any) {
    console.error(`Trends API Error: ${err.message}`);
    return { keyword, avg_interest: null, trend_direction: "UNKNOWN" };
  }
}

// Scrape Top Apps + Generate Embeddings
export async function scrapeApps(
  keyword: string, 
  maxApps: number = 5, 
  reviewsPerApp: number = 100,
  supabaseUrl: string,
  supabaseKey: string
): Promise<ScrapedApp[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`Searching for Top ${maxApps} apps in: "${keyword}"...`);

  const searchResults = await store.search({
    term: keyword,
    num: maxApps, 
    country: 'us'
  });

  console.log(`Found ${searchResults.length} apps.`);
  const scrapedApps: ScrapedApp[] = [];

  for (const app of searchResults) {
    console.log(`Processing: ${app.title}...`);

    try {
      // Fetch Reviews
      const reviews = await store.reviews({
        id: app.id,
        sort: store.sort.RECENT,
        page: 1
      });

      const recentReviews = reviews.slice(0, reviewsPerApp).map((r: any) => ({
        score: r.score,
        text: r.text,
        date: r.date
      }));
      
      console.log(`Got ${recentReviews.length} reviews.`);

      // Generate embedding for clustering
      console.log(`Generating embedding...`);
      const embeddingText = `${app.title}. ${app.description || ''}`;
      const embedding = await generateEmbedding(embeddingText);

      // Prepare payload
      const payload: ScrapedApp = {
        app_store_id: app.id,
        name: app.title,
        description: app.description,
        icon_url: app.icon,
        rating: app.score,
        keyword_tag: keyword.toLowerCase().trim(), // Normalize keyword for consistent storage
        embedding: embedding,
        reviews: recentReviews,
        last_scraped_at: new Date()
      };

      // Save to DB
      const { error } = await supabase
        .from('apps')
        .upsert(payload, { onConflict: 'app_store_id' });

      if (error) {
        console.error(`DB Error: ${error.message}`);
      } else {
        console.log(`Saved with embedding.`);
        scrapedApps.push(payload);
      }

      await new Promise(r => setTimeout(r, 1500)); // Rate limiting

    } catch (err: any) {
      console.error(`Failed: ${err.message}`);
    }
  }

  return scrapedApps;
}

// Main scraping pipeline
export async function runScrapingPipeline(
  keyword: string,
  maxApps: number = 5,
  reviewsPerApp: number = 100,
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`STARTING SCRAPER PIPELINE: "${keyword}"`);

  // Step 1: Trends
  const trends = await fetchTrends(keyword);
  
  // Step 2: Scrape + Generate Embeddings
  const apps = await scrapeApps(keyword, maxApps, reviewsPerApp, supabaseUrl, supabaseKey);

  // Step 3: Save metadata for the analysis phase
  await supabase.from('market_reports').upsert({
    keyword: keyword.toLowerCase().trim(), // Normalize keyword for consistent storage
    trends_data: trends,
    apps_scraped: apps.length,
    scraped_at: new Date()
  }, { onConflict: 'keyword' });

  console.log(`SCRAPING COMPLETE`);
  console.log(`Market Trend: ${trends.trend_direction}`);
  console.log(`Apps Scraped: ${apps.length}`);
  console.log(`Reviews per App: ${reviewsPerApp}`);
  console.log(`Total Reviews: ${apps.length * reviewsPerApp}`);
  console.log(`Embeddings Generated: ${apps.filter(a => a.embedding.length > 0).length}`);

  return {
    trends,
    apps,
    summary: {
      keyword,
      appsScraped: apps.length,
      totalReviews: apps.length * reviewsPerApp,
      trendDirection: trends.trend_direction
    }
  };
}
