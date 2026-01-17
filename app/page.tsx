'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeKeyword } from '@/lib/utils';

function ResearchForm() {
  const [keyword, setKeyword] = useState('');
  const maxApps = 5;
  const reviewsPerApp = 100;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const diff = prev < 30 ? Math.random() * 8 : prev < 70 ? Math.random() * 4 : 0.5;
        return Math.min(prev + diff, 95);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [loading]);

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

      setProgress(100);
      setStatus('Pipeline completed successfully!');
      
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

        {loading ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Processing...</span>
              <span className="text-xs text-muted-foreground animate-pulse">
                {getStatusText(progress)}
              </span>
            </div>
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

        <p className="text-xs text-muted-foreground">
          This will scrape App Store data, fetch reviews, generate embeddings, and analyze opportunities. 
          Process may take 1-2 minutes.
        </p>
      </form>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Market Research
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover opportunities and market insights
          </p>
        </div>

        <ResearchForm />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Access existing reports from the navigation menu above
          </p>
        </div>
      </div>
    </div>
  )
}