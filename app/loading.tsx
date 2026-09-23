import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-8 text-white">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-6 w-32 bg-emerald-800/60 rounded-full" />
          <Skeleton className="h-10 w-3/4 bg-emerald-800/60 rounded-xl" />
          <Skeleton className="h-4 w-full bg-emerald-800/40 rounded-lg" />
        </div>
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-sm"
          >
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Loading Hajj & Umrah services...</span>
      </div>
    </div>
  );
}
