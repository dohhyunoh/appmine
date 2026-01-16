import { NextRequest, NextResponse } from 'next/server';
import { runScrapingPipeline } from '@/lib/services/scraper';
import { runAnalysisPipeline } from '@/lib/services/analyzer';
import { normalizeKeyword } from '@/lib/utils';

export const maxDuration = 600; // 10 minutes for full pipeline

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, maxApps = 5, reviewsPerApp = 100 } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Normalize keyword to lowercase for consistency
    const normalizedKeyword = normalizeKeyword(keyword);

    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key missing' },
        { status: 500 }
      );
    }

    // Step 1: Scrape apps
    console.log(`Starting full pipeline for: ${normalizedKeyword}`);
    const scrapeResult = await runScrapingPipeline(
      normalizedKeyword,
      maxApps,
      reviewsPerApp,
      supabaseUrl,
      supabaseKey
    );

    // Step 2: Analyze apps
    const analysisResult = await runAnalysisPipeline(
      normalizedKeyword,
      supabaseUrl,
      supabaseKey
    );

    return NextResponse.json({
      success: true,
      data: {
        scraping: scrapeResult,
        analysis: analysisResult
      }
    });

  } catch (error: any) {
    console.error('Pipeline error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run pipeline' },
      { status: 500 }
    );
  }
}
