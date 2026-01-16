# AppMine - Market Research Dashboard

A Next.js application for discovering micro-niche opportunities by analyzing App Store apps and reviews using AI.

## Features

- **Automated App Scraping**: Scrape top apps from the App Store by keyword
- **Review Analysis**: Collect and analyze user reviews to identify pain points
- **AI-Powered Insights**: Use Gemini AI to generate market analysis and micro-niche opportunities
- **Trend Tracking**: Integrate Google Trends data to understand market interest
- **Semantic Clustering**: Group similar apps using AI embeddings

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase
- **AI**: Google Gemini API
- **Scraping**: app-store-scraper, google-trends-api
- **UI**: Tailwind CSS, shadcn/ui, Lucide icons
- **Language**: TypeScript

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Supabase account and project
3. Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create a `.env` file):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the dashboard

## Usage

### From the Web UI

1. Enter a market keyword (e.g., "Habit Tracker", "Meditation", "Budgeting")
2. Optionally configure advanced settings (max apps, reviews per app)
3. Click "Start Research"
4. Wait 5-10 minutes for the pipeline to complete
5. View your detailed market analysis report

### API Endpoints
- `POST /api/pipeline` - Run full scraping + analysis pipeline
## Project Structure

```
appmine/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── pipeline/     # Full pipeline endpoint (scrape + analyze)
│   ├── reports/          # Report detail pages
│   └── page.tsx          # Dashboard home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── research-form.tsx # New research form
├── lib/                  # Utility libraries
│   ├── services/         # Core business logic
│   │   ├── scraper.ts   # Scraping logic
│   │   └── analyzer.ts  # Analysis logic
│   └── utils.ts         # Helper functions
└── utils/               # Additional utilities
    └── supabase/        # Supabase client
```

## Database Schema

The app uses the following Supabase tables:

- **apps**: Scraped app data with embeddings and reviews
- **market_reports**: Trend data and scraping metadata
- **market_analysis**: AI-generated analysis and micro-niches
