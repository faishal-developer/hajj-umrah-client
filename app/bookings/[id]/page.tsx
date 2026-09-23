'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Booking, Installment, Payment } from '@/types/api';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { CancellationModal } from './_components/cancellation-modal';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelType, setCancelType] = useState<'FULL' | 'PILGRIM'>('FULL');
  const [cancelPilgrimId, setCancelPilgrimId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookingData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await api.get<Booking>(`/bookings/${id}`);
      const bookingData = res.data;
      setBooking(bookingData);

      // 1. Load installments (from dedicated endpoint or nested booking.installments)
      try {
        const instRes = await api.get<Installment[] | { data: Installment[] }>(
          `/bookings/${id}/installments`
        );
        const fetchedInsts = Array.isArray(instRes.data)
          ? instRes.data
          : Array.isArray((instRes.data as any)?.data)
          ? (instRes.data as any).data
          : [];

        if (fetchedInsts.length > 0) {
          setInstallments(fetchedInsts);
        } else if (
          Array.isArray(bookingData?.installments) &&
          bookingData.installments.length > 0
        ) {
          setInstallments(bookingData.installments);
        } else {
          setInstallments([]);
        }
      } catch {
        if (Array.isArray(bookingData?.installments)) {
          setInstallments(bookingData.installments);
        }
      }

      // 2. Load payments (check user payments filtered by bookingId or nested booking.payments)
      try {
        const payRes = await api.get<Payment[] | { data: Payment[] }>('/payments/me');
        const allPayments = Array.isArray(payRes.data)
          ? payRes.data
          : Array.isArray((payRes.data as any)?.data)
          ? (payRes.data as any).data
          : [];

        const bookingPayments = allPayments.filter(
          (p: any) => p.bookingId === id || p.booking_id === id
        );

        if (bookingPayments.length > 0) {
          setPayments(bookingPayments);
        } else if (Array.isArray((bookingData as any)?.payments)) {
          setPayments((bookingData as any).payments);
        } else {
          setPayments([]);
        }
      } catch {
        if (Array.isArray((bookingData as any)?.payments)) {
          setPayments((bookingData as any).payments);
        }
      }
    } catch (err: any) {
      const title = err.friendly?.title || 'Unable to Load Booking';
      const desc =
        err.friendly?.description || err.message || 'Please check your connection and try again.';
      toast.error(title, { description: desc });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
  }, [id, isAuthenticated, isAuthLoading, router]);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error('Reason Required', {
        description: 'Please provide a brief reason for the cancellation request.',
      });
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
        toast.success('Cancellation Request Submitted', {
          description: 'Your booking cancellation request has been received and is being processed.',
        });
      } else if (cancelPilgrimId) {
        await api.post(
          `/bookings/${id}/pilgrims/${cancelPilgrimId}/cancel`,
          { reason: cancelReason },
          { idempotencyKey }
        );
        toast.success('Pilgrim Cancellation Submitted', {
          description: 'The pilgrim cancellation request has been received.',
        });
      }

      setShowCancelModal(false);
      setCancelReason('');
      loadBookingData(true);
    } catch (err: any) {
      const errorTitle = err.friendly?.title || 'Cancellation Request Failed';
      const errorDesc =
        err.friendly?.description ||
        err.message ||
        'We could not submit your cancellation request. Please try again.';
      toast.error(errorTitle, { description: errorDesc });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-500">Retrieving booking #{id.slice(0, 8)}...</p>
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
  const canCancel = ['HELD', 'PENDING_PAYMENT', 'PARTIALLY_PAID', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Back Link */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all bookings</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadBookingData(true)}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-slate-500 hover:text-emerald-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

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

      {/* Guaranteed Price Protection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed Price Protection</span>
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
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Guaranteed Unit Rate</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(Number(booking.unitPriceSnapshot) || 0)}
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
                {formatCurrency(Number(booking.totalAmount) || 0)}
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
                    {installments.map((inst, index) => {
                      const seq =
                        inst.sequence ??
                        (inst as any).installmentNumber ??
                        (inst as any).sequenceNumber ??
                        index + 1;
                      const due = Number(
                        inst.amountDue ?? (inst as any).amount_due ?? (inst as any).amount ?? 0
                      );
                      const paid = Number(
                        inst.amountPaid ?? (inst as any).amount_paid ?? (inst as any).paidAmount ?? 0
                      );
                      const status = inst.status ?? (inst as any).paymentStatus ?? 'PENDING';
                      const dueDate = inst.dueDate ?? (inst as any).due_date;

                      return (
                        <tr key={inst.id || `inst-${index}`}>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            Installment {seq}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {formatDate(dueDate)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {formatCurrency(due)}
                          </td>
                          <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                            {formatCurrency(paid)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                status === 'PAID'
                                  ? 'success'
                                  : status === 'OVERDUE'
                                  ? 'danger'
                                  : status === 'PARTIAL'
                                  ? 'warning'
                                  : 'warning'
                              }
                            >
                              {status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
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
                      Trx ID: {p.gatewayTransactionId || (p as any).gateway_transaction_id || p.id} · {formatDateTime(p.createdAt || (p as any).created_at)}
                    </span>
                  </div>
                  <div className="text-right font-extrabold text-sm text-slate-900 dark:text-white">
                    {formatCurrency(Number(p.amount) || 0, p.currency || 'BDT')}
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
      <CancellationModal
        isOpen={showCancelModal}
        cancelType={cancelType}
        cancelReason={cancelReason}
        isCancelling={isCancelling}
        onReasonChange={setCancelReason}
        onClose={() => setShowCancelModal(false)}
        onSubmit={handleCancelSubmit}
      />
    </div>
  );
}
