'use client';

import Link from 'next/link';
import { Pickaxe, Home, FileText } from 'lucide-react';

export function Navigation() {

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/30 sticky top-0 z-50 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        {/* The Icon Graphic */}
        <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg">
          <Pickaxe className="w-6 h-6 text-yellow-300" />
        </div>
        
        {/* The Text */}
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">
          AppMine
        </h1>
      </Link>

      {/* Navigation Links */}
      <nav className="flex items-center gap-3 md:gap-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <Link 
          href="/reports" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Reports</span>
        </Link>

        <div className="hidden md:block text-xs text-muted-foreground border-l border-border pl-6">
          Powered by Gemini
        </div>
      </nav>
    </header>
  );
}
