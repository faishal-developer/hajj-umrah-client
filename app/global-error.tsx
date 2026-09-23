'use client';

import * as React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Critical Global Layout Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 text-rose-400 mx-auto flex items-center justify-center border border-rose-900 shadow-inner">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Critical System Error
            </h1>
            <p className="text-sm text-slate-400">
              The application encountered a critical error. Please reload the page to restore the session.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all shadow-md active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
