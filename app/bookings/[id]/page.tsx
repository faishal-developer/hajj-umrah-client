'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Booking, Installment, Payment, Cancellation } from '@/types/api';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CountdownTimer } from '@/components/countdown-timer';
import { formatCurrency, formatDate, formatDateTime, generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Lock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelType, setCancelType] = useState<'FULL' | 'PILGRIM'>('FULL');
  const [cancelPilgrimId, setCancelPilgrimId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookingData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Booking>(`/bookings/${id}`);
      setBooking(res.data);

      // Load installments
      try {
        const instRes = await api.get<Installment[]>(`/bookings/${id}/installments`);
        setInstallments(instRes.data || []);
      } catch {
        // Fallback
      }

      // Load payments
      try {
        const payRes = await api.get<Payment[]>(`/payments/booking/${id}`);
        setPayments(payRes.data || []);
      } catch {
        // Fallback
      }
    } catch (err: any) {
      toast.error('Failed to load booking details', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/bookings/${id}`);
      } else {
        loadBookingData();
      }
    }
  }, [id, isAuthenticated, isAuthLoading]);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please specify a cancellation reason.');
      return;
    }

    try {
      setIsCancelling(true);
      const idempotencyKey = generateUUID();

      if (cancelType === 'FULL') {
        await api.post(
          `/bookings/${id}/cancel`,
          { reason: cancelReason },
          { idempotencyKey }
        );
        toast.success('Booking cancellation requested');
      } else if (cancelPilgrimId) {
        await api.post(
          `/bookings/${id}/pilgrims/${cancelPilgrimId}/cancel`,
          { reason: cancelReason },
          { idempotencyKey }
        );
        toast.success('Pilgrim cancellation requested');
      }

      setShowCancelModal(false);
      setCancelReason('');
      loadBookingData();
    } catch (err: any) {
      toast.error('Cancellation failed', { description: err.message });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading booking file #{id.slice(0, 8)}...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">Booking Not Found</h2>
        <p className="text-xs text-slate-500">This booking record may have expired or is inaccessible.</p>
        <Link href="/bookings">
          <Button variant="outline" size="sm">
            Back to My Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const isHeld = booking.status === 'HELD' || booking.status === 'PENDING_PAYMENT';
  const isConfirmed = booking.status === 'CONFIRMED';
  const canCancel = ['HELD', 'PENDING_PAYMENT', 'PARTIALLY_PAID', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Back Link */}
      <div className="space-y-4">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all bookings</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">ID: {booking.id}</span>
              <Badge
                variant={
                  booking.status === 'CONFIRMED'
                    ? 'success'
                    : isHeld
                    ? 'held'
                    : booking.status === 'CANCELLED'
                    ? 'secondary'
                    : 'warning'
                }
              >
                {booking.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {booking.package?.name || booking.tierNameSnapshot || 'Pilgrimage Journey'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isHeld && (
              <Link href={`/payments/checkout?bookingId=${booking.id}`}>
                <Button variant="gold" size="md" className="gap-2 font-bold shadow-md">
                  <CreditCard className="w-4 h-4" />
                  <span>Complete Payment</span>
                </Button>
              </Link>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelType('FULL');
                  setCancelPilgrimId(null);
                  setShowCancelModal(true);
                }}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
              >
                Request Cancellation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Seat Hold Notice if HELD */}
      {isHeld && booking.expiresAt && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-xl text-amber-800 dark:text-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Temporary Seat Hold Active
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Complete payment before the timer expires to convert your hold into a confirmed booking.
              </p>
            </div>
          </div>
          <CountdownTimer expiresAt={booking.expiresAt} />
        </div>
      )}

      {/* Price Freeze Snapshot Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Immutable Price Snapshot</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Selected Tier</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {booking.tierNameSnapshot}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Frozen Unit Price</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(booking.unitPriceSnapshot)}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Pilgrim Count</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {booking.pilgrims?.length || 1} Person(s)
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Total Booking Amount</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pilgrims List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Registered Pilgrims ({booking.pilgrims?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.pilgrims && booking.pilgrims.length > 0 ? (
            booking.pilgrims.map((pilgrim, idx) => (
              <div
                key={pilgrim.id || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {pilgrim.fullName}
                    </span>
                    <Badge variant={pilgrim.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {pilgrim.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500 flex flex-wrap gap-x-4">
                    <span>
                      Passport: <strong>{pilgrim.passportNumber}</strong>
                    </span>
                    {pilgrim.nationality && (
                      <span>
                        Nationality: <strong>{pilgrim.nationality}</strong>
                      </span>
                    )}
                    {pilgrim.dateOfBirth && (
                      <span>
                        DOB: <strong>{formatDate(pilgrim.dateOfBirth)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {canCancel && pilgrim.status === 'ACTIVE' && booking.pilgrims.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelType('PILGRIM');
                      setCancelPilgrimId(pilgrim.id);
                      setShowCancelModal(true);
                    }}
                    className="text-rose-500 hover:text-rose-700 text-xs"
                  >
                    Cancel Pilgrim
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No pilgrim records attached.</p>
          )}
        </CardContent>
      </Card>

      {/* Installments Schedule (if installment mode) */}
      {booking.paymentMode === 'INSTALLMENT' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Installment Payment Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {installments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Amount Due</th>
                      <th className="py-2.5 px-3">Amount Paid</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {installments.map((inst) => (
                      <tr key={inst.id}>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          Installment {inst.sequence}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {formatDate(inst.dueDate)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(inst.amountDue)}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                          {formatCurrency(inst.amountPaid)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              inst.status === 'PAID'
                                ? 'success'
                                : inst.status === 'OVERDUE'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {inst.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Installment schedule will be generated upon payment confirmation.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payment Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span>{p.provider}</span>
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Trx ID: {p.gatewayTransactionId || p.id} · {formatDateTime(p.createdAt)}
                    </span>
                  </div>
                  <div className="text-right font-extrabold text-sm text-slate-900 dark:text-white">
                    {formatCurrency(p.amount, p.currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No payment records received for this booking yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Modal Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {cancelType === 'FULL' ? 'Cancel Entire Booking' : 'Cancel Individual Pilgrim'}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {cancelType === 'FULL'
                ? 'This will release all held seats and initiate the formal cancellation workflow.'
                : 'This will remove the selected pilgrim and release 1 held seat.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Reason*
              </label>
              <textarea
                rows={3}
                placeholder="Please state the reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
                Go Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelSubmit}
                isLoading={isCancelling}
              >
                Submit Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
