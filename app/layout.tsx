import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Pickaxe } from 'lucide-react';

export const metadata: Metadata = {
  title: "Market Research | AppMine",
  description: "Sub-niche analysis and opportunity discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <div className="flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/30">
            <Link href="/" className="flex items-center gap-2">
              {/* The Icon Graphic */}
              <div className="relative flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-lg">
                <Pickaxe className="w-8 h-8 text-yellow-300" />
              </div>
              
              {/* The Text */}
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
                AppMine
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                Powered by Gemini
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
