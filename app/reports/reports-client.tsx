'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Search, X } from "lucide-react";

interface Report {
  keyword: string;
  total_apps: number;
  total_niches: number;
  created_at: string;
  analyses: any[];
}

interface ReportsClientProps {
  reports: Report[];
  trendsData: Record<string, any>;
}

export function ReportsClient({ reports, trendsData }: ReportsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter reports based on search query (case-insensitive)
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    return reports.filter(report => 
      report.keyword.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery, reports]);

  // Get suggestions (show matching reports when typing)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    return reports
      .filter(report => report.keyword.toLowerCase().includes(normalizedQuery))
      .slice(0, 5); // Limit to 5 suggestions
  }, [searchQuery, reports]);

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

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

      {/* Search Bar */}
      {reports && reports.length > 0 && (
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Search reports..."
              className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((report) => (
                <Link
                  key={report.keyword}
                  href={`/reports/${encodeURIComponent(report.keyword)}`}
                  className="block px-4 py-3 hover:bg-accent transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{report.keyword}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.total_niches} opportunities
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Search Results Count */}
          {searchQuery && (
            <div className="mt-3 text-sm text-muted-foreground">
              Found {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </div>
          )}
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports?.map((report) => {
          const trends = trendsData[report.keyword];
          const trendIcon = trends?.trend_direction?.includes('GROWING') 
            ? <TrendingUp className="w-5 h-5 text-green-500" />
            : trends?.trend_direction?.includes('DECLINING')
            ? <TrendingDown className="w-5 h-5 text-red-500" />
            : <Minus className="w-5 h-5 text-gray-500" />;

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
                      <span className="text-muted-foreground">Google Trends Score</span>
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
          );
        })}
      </div>

      {/* No Results State */}
      {searchQuery && filteredReports.length === 0 && (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground text-lg mb-2">No reports found for "{searchQuery}"</p>
          <button
            onClick={clearSearch}
            className="text-primary hover:underline text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && (!reports || reports.length === 0) && (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground text-lg mb-4">No market reports yet</p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Create New Report
          </Link>
        </div>
      )}
    </div>
  );
}
