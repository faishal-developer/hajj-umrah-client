'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types/api';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CountdownTimer } from '@/components/countdown-timer';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BookOpen,
  Calendar,
  Users,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Plus,
  Compass,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Booking[]>('/bookings/me');
      setBookings(res.data || []);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/bookings');
      } else {
        fetchBookings();
      }
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const statusBadges: Record<
    string,
    { label: string; variant: 'default' | 'held' | 'success' | 'warning' | 'danger' | 'secondary' }
  > = {
    HELD: { label: 'Seats Reserved (Awaiting Payment)', variant: 'held' },
    PENDING_PAYMENT: { label: 'Awaiting Payment', variant: 'warning' },
    PARTIALLY_PAID: { label: 'Partially Paid', variant: 'warning' },
    CONFIRMED: { label: 'Confirmed', variant: 'success' },
    DEFAULTED: { label: 'Payment Overdue', variant: 'danger' },
    EXPIRED: { label: 'Reservation Expired', variant: 'danger' },
    CANCELLED: { label: 'Cancelled', variant: 'secondary' },
    COMPLETED: { label: 'Completed', variant: 'default' },
  };

  if (isAuthLoading || (isLoading && bookings.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-500">Retrieving your pilgrim reservations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pilgrim Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Bookings & Journeys
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage held seats, review payment installments, and track booking statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchBookings} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Link href="/packages">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Book New Package
            </Button>
          </Link>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((bkg) => {
            const badge = statusBadges[bkg.status] || { label: bkg.status, variant: 'secondary' };
            const isHeld = bkg.status === 'HELD' || bkg.status === 'PENDING_PAYMENT';

            return (
              <Card
                key={bkg.id}
                className="hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Row: Ref & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                        #{bkg.id.slice(0, 4)}
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          ID: {bkg.id}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {bkg.package?.name || bkg.tierNameSnapshot || 'Pilgrimage Package'}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isHeld && bkg.expiresAt && <CountdownTimer expiresAt={bkg.expiresAt} />}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>

                  {/* Middle Row: Pilgrims, Tier, Price */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block font-medium">Package Tier</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {bkg.tierNameSnapshot || 'Standard'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block font-medium">Pilgrim Group</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {bkg.pilgrims?.length || 1} Person(s)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block font-medium">Payment Mode</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {bkg.paymentMode === 'FULL' ? 'Full Payment' : 'Installment Plan'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block font-medium">Total Amount</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatCurrency(bkg.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Reserved on {formatDate(bkg.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {isHeld && (
                      <Link href={`/payments/checkout?bookingId=${bkg.id}`}>
                        <Button variant="gold" size="sm" className="gap-1.5 font-bold shadow-sm">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Complete Payment</span>
                        </Button>
                      </Link>
                    )}

                    <Link href={`/bookings/${bkg.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Bookings Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t reserved any pilgrimage packages yet. Explore our verified catalog to begin
              your journey.
            </p>
          </div>
          <Link href="/packages">
            <Button variant="primary" size="sm" className="gap-2">
              <Compass className="w-4 h-4" />
              Explore Packages
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
