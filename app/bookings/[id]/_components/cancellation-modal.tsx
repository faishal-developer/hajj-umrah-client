'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface CancellationModalProps {
  isOpen: boolean;
  cancelType: 'FULL' | 'PILGRIM';
  cancelReason: string;
  isCancelling: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CancellationModal({
  isOpen,
  cancelType,
  cancelReason,
  isCancelling,
  onReasonChange,
  onClose,
  onSubmit,
}: CancellationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {cancelType === 'FULL' ? 'Request Booking Cancellation' : 'Cancel Pilgrim Reservation'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {cancelType === 'FULL'
            ? 'This will submit a cancellation request for your entire booking reservation.'
            : 'This will remove the selected pilgrim from this reservation.'}
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Reason for Cancellation*
          </label>
          <textarea
            rows={3}
            placeholder="Please share the reason for your cancellation request..."
            value={cancelReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Keep Reservation
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onSubmit}
            isLoading={isCancelling}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>
  );
}
