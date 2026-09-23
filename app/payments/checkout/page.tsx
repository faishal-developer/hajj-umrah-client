'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Booking, PaymentProvider, PaymentInitiateResponse } from '@/types/api';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency, formatDate, generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Globe,
  Building,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('BKASH');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await api.get<Booking>(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err: any) {
        const title = err.friendly?.title || 'Unable to Load Booking';
        const desc = err.friendly?.description || err.message || 'Please check your connection and try again.';
        toast.error(title, { description: desc });
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/payments/checkout?bookingId=${bookingId}`);
      } else {
        loadBooking();
      }
    }
  }, [bookingId, isAuthenticated, isAuthLoading, router]);

  const payableAmount =
    booking?.paymentMode === 'INSTALLMENT'
      ? Math.round(Number(booking.totalAmount) * 0.4) // 40% initial deposit
      : Number(booking?.totalAmount || 0);

  const handleSimulatePayment = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);
      const idempotencyKey = generateUUID();

      // Step 1: Initiate payment session
      const initiateRes = await api.post<PaymentInitiateResponse>(
        '/payments/initiate',
        {
          bookingId: booking.id,
          amount: payableAmount,
          provider: selectedProvider,
        },
        { idempotencyKey }
      );

      const trxId = initiateRes.data?.gatewayTransactionId || `TRX-${Date.now()}`;

      // Step 2: Trigger Simulated Gateway Webhook to verify payment on backend
      const webhookProviderSlug = selectedProvider.toLowerCase();
      try {
        await api.post(
          `/payments/webhook/${webhookProviderSlug}`,
          {
            event_id: `evt_${Date.now()}`,
            transaction_id: trxId,
            status: 'SUCCESS',
            amount: payableAmount,
            booking_id: booking.id,
          },
          { requiresAuth: false }
        );
      } catch {
        // Continue
      }

      toast.success('Payment Completed Successfully!', {
        description: `Your ${selectedProvider} payment of ${formatCurrency(payableAmount)} has been verified. Your journey is confirmed.`,
      });

      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      const errorTitle = err.friendly?.title || 'Payment Could Not Be Completed';
      const errorDesc =
        err.friendly?.description ||
        err.message ||
        'Your payment could not be processed. No funds were deducted. Please try again.';
      toast.error(errorTitle, {
        description: errorDesc,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-500">Connecting to secure payment gateway...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold">Booking Not Found</h2>
        <p className="text-xs text-slate-500">Invalid booking reference or payment session expired.</p>
        <Link href="/bookings">
          <Button variant="primary" size="sm">
            View My Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const providers: {
    id: PaymentProvider;
    name: string;
    type: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'BKASH',
      name: 'bKash Online',
      type: 'Mobile Wallet',
      description: 'Instant direct checkout via bKash payment gateway',
      icon: Smartphone,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    },
    {
      id: 'NAGAD',
      name: 'Nagad Pay',
      type: 'Digital Financial Service',
      description: 'Fast mobile payment authorization via Nagad',
      icon: Smartphone,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    },
    {
      id: 'SSLCOMMERZ',
      name: 'SSLCOMMERZ Gateway',
      type: 'Debit / Credit Card',
      description: 'VISA, Mastercard, AMEX and Internet Banking cards',
      icon: Globe,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'STRIPE',
      name: 'Stripe International',
      type: 'Global Card Processing',
      description: 'International card payment with dual currency support',
      icon: CreditCard,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to booking details</span>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure Checkout Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Payment Authorization
        </h1>
        <p className="text-xs text-slate-500">
          Booking #{booking.id.slice(0, 8)} · {booking.package?.name || booking.tierNameSnapshot}
        </p>
      </div>

      <Card className="border-emerald-500/30 shadow-xl overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />

        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payment Summary</CardTitle>
            <Badge variant="gold">
              {booking.paymentMode === 'INSTALLMENT' ? 'Installment Deposit' : 'Full Payment'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount Due Big Banner */}
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                Amount to Pay Now
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {booking.paymentMode === 'INSTALLMENT'
                  ? 'Initial 40% deposit (remaining balance scheduled)'
                  : 'Total full package balance'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(payableAmount)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Select Gateway Provider
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedProvider === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${p.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                      </div>
                      {isSelected && <Badge variant="default" className="text-[10px]">Selected</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demonstration Sandbox Environment</span>
            </div>
            <p className="text-[11px] text-slate-500">
              This is a secure testing environment. Your booking confirmation and payment will be
              processed safely without charging real bank accounts or credit cards.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link href={`/bookings/${booking.id}`} className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              Cancel
            </Button>
          </Link>

          <Button
            variant="gold"
            size="lg"
            onClick={handleSimulatePayment}
            isLoading={isProcessing}
            className="w-full sm:w-auto gap-2 font-bold shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Test Payment & Confirm ({formatCurrency(payableAmount)})</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-20 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading checkout session...</p>
        </div>
      }
    >
      <PaymentCheckoutContent />
    </Suspense>
  );
}
