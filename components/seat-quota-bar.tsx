'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface SeatQuotaBarProps {
  quota: number;
  confirmedSeats: number;
  heldSeats: number;
  showLabels?: boolean;
  className?: string;
}

export function SeatQuotaBar({
  quota,
  confirmedSeats,
  heldSeats,
  showLabels = true,
  className,
}: SeatQuotaBarProps) {
  const confirmed = Number(confirmedSeats) || 0;
  const held = Number(heldSeats) || 0;
  const total = Number(quota) || 1;
  const available = Math.max(0, total - (confirmed + held));

  const confirmedPct = Math.min(100, Math.round((confirmed / total) * 100));
  const heldPct = Math.min(100 - confirmedPct, Math.round((held / total) * 100));
  const availablePct = Math.max(0, 100 - (confirmedPct + heldPct));

  const isSoldOut = available <= 0;
  const isLimited = available > 0 && available <= 10;

  return (
    <div className={cn('space-y-2', className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {available} of {total} seats remaining
            </span>
          </div>
          {isSoldOut ? (
            <span className="font-semibold text-rose-600 dark:text-rose-400">Sold Out</span>
          ) : isLimited ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
              Only {available} left!
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Available</span>
          )}
        </div>
      )}

      {/* Segmented Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
        {confirmedPct > 0 && (
          <div
            style={{ width: `${confirmedPct}%` }}
            className="h-full bg-emerald-600 transition-all duration-300"
            title={`Confirmed: ${confirmed}`}
          />
        )}
        {heldPct > 0 && (
          <div
            style={{ width: `${heldPct}%` }}
            className="h-full bg-amber-400 transition-all duration-300"
            title={`Held: ${held}`}
          />
        )}
        {availablePct > 0 && (
          <div
            style={{ width: `${availablePct}%` }}
            className="h-full bg-slate-200 dark:bg-slate-700 transition-all duration-300"
            title={`Available: ${available}`}
          />
        )}
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> {confirmed}{' '}
            Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {held} Held
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />{' '}
            {available} Free
          </span>
        </div>
      )}
    </div>
  );
}
