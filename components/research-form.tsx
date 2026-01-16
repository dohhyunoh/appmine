'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeKeyword } from '@/lib/utils';

export function ResearchForm() {
  const [keyword, setKeyword] = useState('');
  const [maxApps, setMaxApps] = useState(5);
  const [reviewsPerApp, setReviewsPerApp] = useState(100);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // Reset progress when loading starts/stops
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    
    // "Zeno's Paradox" Progress Logic
    const interval = setInterval(() => {
      setProgress((prev) => {
        // 1. STALL at 95% so we never hit 100% until the API is actually done
        if (prev >= 95) return 95;
        
        // 2. Variable speed: Fast start, slow finish
        // 0-30%: Fast (simulates connection)
        // 30-70%: Medium (simulates processing)
        // 70-95%: Slow crawl (simulates finalization)
        const diff = prev < 30 ? Math.random() * 8 : prev < 70 ? Math.random() * 4 : 0.5;
        
        return Math.min(prev + diff, 95);
      });
    }, 800); // Tick every 800ms

    return () => clearInterval(interval);
  }, [loading]);

  // Derived status text based on progress percentage
  const getStatusText = (p: number) => {
    if (p < 30) return "Starting research pipeline...";
    if (p < 60) return "Scraping reviews & data...";
    if (p < 85) return "Analyzing patterns with AI...";
    return "Finalizing report...";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('Starting pipeline...');

    try {
      // Normalize keyword to lowercase for consistency
      const normalizedKeyword = normalizeKeyword(keyword);
      
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: normalizedKeyword, maxApps, reviewsPerApp })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to run pipeline');
      }

      // Complete the progress bar
      setProgress(100);
      setStatus('Pipeline completed successfully!');
      
      // Redirect to the report page after a short delay
      setTimeout(() => {
        router.push(`/reports/${encodeURIComponent(normalizedKeyword)}`);
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            New Market Research
          </h3>
          <p className="text-sm text-muted-foreground">
            Analyze a new market niche by scraping apps and reviews
          </p>
        </div>

        <div className="space-y-4">
          {/* Keyword Input */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-foreground mb-2">
              Market Keyword
            </label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Habit Tracker, Meditation, Budgeting"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Status Messages - Only show completion or errors */}
        {status && status.includes('completed') && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {status}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button / Progress Bar */}
        {loading ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Processing...</span>
              <span className="text-xs text-muted-foreground animate-pulse">
                {getStatusText(progress)}
              </span>
            </div>
            
            {/* Shadcn Progress Component */}
            <Progress value={progress} className="h-2.5 w-full" />
          </div>
        ) : (
          <Button
            type="submit"
            disabled={!keyword}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Start Research
          </Button>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          This will scrape App Store data, fetch reviews, generate embeddings, and analyze opportunities. 
          Process may take 1-2 minutes.
        </p>
      </form>
    </Card>
  );
}
