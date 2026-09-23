'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, PackageTier, Booking, PaymentMode } from '@/types/api';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Trash2,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface PilgrimInput {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth?: string;
  passportExpiry?: string;
}

function BookingCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

  const packageIdParam = searchParams.get('packageId');
  const tierIdParam = searchParams.get('tierId');

  const [packageData, setPackageData] = useState<Package | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>(tierIdParam || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('FULL');
  const [pilgrims, setPilgrims] = useState<PilgrimInput[]>([
    {
      fullName: '',
      passportNumber: '',
      nationality: 'Bangladesh',
      dateOfBirth: '',
      passportExpiry: '',
    },
  ]);

  const [isLoadingPackage, setIsLoadingPackage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill first pilgrim name if user logged in
  useEffect(() => {
    if (user && pilgrims.length === 1 && !pilgrims[0].fullName) {
      setPilgrims([
        {
          fullName: user.name || '',
          passportNumber: '',
          nationality: 'Bangladesh',
          dateOfBirth: '',
          passportExpiry: '',
        },
      ]);
    }
  }, [user]);

  // Load package
  useEffect(() => {
    async function loadPackage() {
      if (!packageIdParam) {
        setIsLoadingPackage(false);
        return;
      }
      try {
        setIsLoadingPackage(true);
        const res = await api.get<Package>(`/packages/${packageIdParam}`, { requiresAuth: false });
        setPackageData(res.data);
        if (res.data?.tiers && res.data.tiers.length > 0) {
          if (!tierIdParam || !res.data.tiers.some((t) => t.id === tierIdParam)) {
            setSelectedTierId(res.data.tiers[0].id);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load package data', { description: err.message });
      } finally {
        setIsLoadingPackage(false);
      }
    }
    loadPackage();
  }, [packageIdParam, tierIdParam]);

  const selectedTier = packageData?.tiers?.find((t) => t.id === selectedTierId);
  const unitPrice = selectedTier ? Number(selectedTier.price) : 0;
  const totalPrice = unitPrice * pilgrims.length;

  const handleAddPilgrim = () => {
    if (pilgrims.length >= 10) {
      toast.warning('Maximum 10 pilgrims per booking transaction.');
      return;
    }
    setPilgrims([
      ...pilgrims,
      {
        fullName: '',
        passportNumber: '',
        nationality: 'Bangladesh',
        dateOfBirth: '',
        passportExpiry: '',
      },
    ]);
  };

  const handleRemovePilgrim = (index: number) => {
    if (pilgrims.length <= 1) {
      toast.error('At least one pilgrim is required.');
      return;
    }
    setPilgrims(pilgrims.filter((_, i) => i !== index));
  };

  const handlePilgrimChange = (index: number, field: keyof PilgrimInput, value: string) => {
    const updated = [...pilgrims];
    updated[index] = { ...updated[index], [field]: value };
    setPilgrims(updated);
    // Clear error for field
    if (errors[`${index}-${field}`]) {
      const newErr = { ...errors };
      delete newErr[`${index}-${field}`];
      setErrors(newErr);
    }
  };

  const validatePilgrims = (): boolean => {
    const newErrors: Record<string, string> = {};
    pilgrims.forEach((p, i) => {
      if (!p.fullName.trim()) {
        newErrors[`${i}-fullName`] = 'Full name as per passport is required';
      }
      if (!p.passportNumber.trim()) {
        newErrors[`${i}-passportNumber`] = 'Passport number is required';
      } else if (p.passportNumber.length < 5) {
        newErrors[`${i}-passportNumber`] = 'Invalid passport format';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedTier) {
        toast.error('Please select a package tier.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validatePilgrims()) {
        toast.error('Please fix the pilgrim details errors before proceeding.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleSubmitBooking = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to confirm your booking', {
        description: 'You will be redirected to the login page.',
      });
      router.push(`/login?redirect=/bookings/create?packageId=${packageIdParam}&tierId=${selectedTierId}`);
      return;
    }

    if (!packageData || !selectedTier) {
      toast.error('Invalid package or tier selection');
      return;
    }

    try {
      setIsSubmitting(true);
      const idempotencyKey = generateUUID();

      const payload = {
        packageId: packageData.id,
        tierId: selectedTier.id,
        paymentMode,
        pilgrims: pilgrims.map((p) => ({
          fullName: p.fullName.trim(),
          passportNumber: p.passportNumber.trim(),
          nationality: p.nationality || 'Bangladesh',
          dateOfBirth: p.dateOfBirth || undefined,
          passportExpiry: p.passportExpiry || undefined,
        })),
      };

      const res = await api.post<Booking>('/bookings', payload, {
        idempotencyKey,
      });

      toast.success('Seats held successfully!', {
        description: `Booking #${res.data.id.slice(0, 8)} created. Complete payment to confirm.`,
      });

      router.push(`/bookings/${res.data.id}`);
    } catch (err: any) {
      if (err.statusCode === 409) {
        toast.error('Seat Unavailable', {
          description: err.message || 'Selected seats have been filled by another user. Please choose another tier.',
        });
      } else {
        toast.error('Booking failed', {
          description: err.message || 'Could not complete booking reservation.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPackage || isAuthLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-500">Preparing booking gateway...</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold">No Package Selected</h2>
        <p className="text-xs text-slate-500">Please choose a package from the catalog to begin.</p>
        <Link href="/packages">
          <Button variant="primary" size="sm">
            Browse Packages
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Header Indicator */}
      <div className="space-y-4">
        <Link
          href={`/packages/${packageData.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to package details</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Step {currentStep} of 4
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {currentStep === 1 && 'Confirm Package & Tier'}
              {currentStep === 2 && 'Enter Pilgrim Details'}
              {currentStep === 3 && 'Choose Payment Plan'}
              {currentStep === 4 && 'Review & Reserve Seats'}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-8 bg-emerald-600'
                    : step < currentStep
                    ? 'w-3 bg-emerald-400'
                    : 'w-3 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Confirm Tier */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Your Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{packageData.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Departure: <strong>{formatDate(packageData.departureDate)}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {packageData.tiers.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">{tier.name}</span>
                        {isSelected && <Badge variant="default">Selected</Badge>}
                      </div>
                      <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(tier.price)}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">Per Pilgrim</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Link href={`/packages/${packageData.id}`}>
                <Button variant="outline" size="md">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" size="md" onClick={handleNextStep} className="gap-2">
                <span>Continue to Pilgrims</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 2: Enter Pilgrim Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pilgrim Information</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Enter accurate passport details matching official travel documents.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddPilgrim} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pilgrim</span>
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {pilgrims.map((pilgrim, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Pilgrim #{idx + 1} {idx === 0 && '(Lead Pilgrim)'}
                    </span>
                    {pilgrims.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePilgrim(idx)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name (as in Passport)*"
                      placeholder="e.g. Mohammad Faishal"
                      value={pilgrim.fullName}
                      onChange={(e) => handlePilgrimChange(idx, 'fullName', e.target.value)}
                      error={errors[`${idx}-fullName`]}
                    />

                    <Input
                      label="Passport Number*"
                      placeholder="e.g. A01234567"
                      value={pilgrim.passportNumber}
                      onChange={(e) =>
                        handlePilgrimChange(idx, 'passportNumber', e.target.value.toUpperCase())
                      }
                      error={errors[`${idx}-passportNumber`]}
                    />

                    <Input
                      label="Nationality"
                      placeholder="e.g. Bangladesh"
                      value={pilgrim.nationality}
                      onChange={(e) => handlePilgrimChange(idx, 'nationality', e.target.value)}
                    />

                    <Input
                      type="date"
                      label="Date of Birth"
                      value={pilgrim.dateOfBirth}
                      onChange={(e) => handlePilgrimChange(idx, 'dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={handleNextStep} className="gap-2">
                <span>Continue to Payment Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 3: Payment Plan Choice */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Payment Option</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Payment */}
                <div
                  onClick={() => setPaymentMode('FULL')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMode === 'FULL'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">Full One-Time Payment</span>
                    {paymentMode === 'FULL' && <Badge variant="default">Selected</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Pay the entire balance now to immediately confirm all pilgrim seats.
                  </p>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalPrice)}
                  </div>
                </div>

                {/* Installment Plan */}
                <div
                  onClick={() => setPaymentMode('INSTALLMENT')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMode === 'INSTALLMENT'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">Flexible Installment Plan</span>
                    {paymentMode === 'INSTALLMENT' && <Badge variant="default">Selected</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Pay an initial deposit today, with the remaining balance split across scheduled
                    due dates.
                  </p>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Deposit: {formatCurrency(Math.round(totalPrice * 0.4))} (40%)
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={handleNextStep} className="gap-2">
                <span>Review Reservation</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 4: Final Review & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card className="border-emerald-500/30 shadow-lg">
            <CardHeader>
              <CardTitle>Review & Confirm Seat Hold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="text-slate-500 block">Package:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{packageData.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tier & Pricing:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {selectedTier?.name} ({formatCurrency(unitPrice)} / person)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Pilgrims:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {pilgrims.length} {pilgrims.length === 1 ? 'Person' : 'People'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Mode:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {paymentMode === 'FULL' ? 'Full Payment' : 'Installment Plan'}
                  </span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                    Total Frozen Price Snapshot
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Guaranteed rate for {pilgrims.length} pilgrim(s)
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalPrice)}
                </div>
              </div>

              {/* Guarantee Notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  Upon clicking confirm, your seats will be immediately held via transactional row-locking.
                  You will have 30–60 minutes to complete checkout before the hold expires.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button
                variant="gold"
                size="lg"
                onClick={handleSubmitBooking}
                isLoading={isSubmitting}
                className="gap-2 shadow-lg font-bold"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Hold Seats</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function BookingCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading booking wizard...</p>
        </div>
      }
    >
      <BookingCreationContent />
    </Suspense>
  );
}
