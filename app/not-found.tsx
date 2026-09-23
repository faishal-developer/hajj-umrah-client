import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Home, PackageSearch } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Hajj & Umrah Platform',
  description: 'The requested page or package could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60 shadow-inner">
          <Compass className="w-10 h-10 animate-[spin_12s_linear_infinite]" />
        </div>

        <div className="space-y-2 relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            404 Error
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-sm mx-auto">
            The page you are looking for might have been moved, renamed, or is currently unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 relative z-10">
          <Link href="/packages" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <PackageSearch className="w-4 h-4 mr-2" />
              Browse Packages
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
