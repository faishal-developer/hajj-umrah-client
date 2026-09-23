'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, PackageTier } from '@/types/api';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatQuotaBar } from '@/components/seat-quota-bar';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plane,
  Building,
  CreditCard,
  Users,
  ChevronRight,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [packageData, setPackageData] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPackage() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get<Package>(`/packages/${id}`, { requiresAuth: false });
        setPackageData(res.data);
        if (res.data?.tiers && res.data.tiers.length > 0) {
          setSelectedTierId(res.data.tiers[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load package details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPackage();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto py-8">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Package Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested package could not be located.'}</p>
        <Link href="/packages">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Packages
          </Button>
        </Link>
      </div>
    );
  }

  const { name, type, description, departureDate, bookingStartDate, bookingEndDate, tiers = [] } =
    packageData;

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];

  const typeBadgeVariant: Record<string, 'gold' | 'default' | 'secondary' | 'warning'> = {
    HAJJ: 'gold',
    RAMADAN_UMRAH: 'default',
    OFF_SEASON_UMRAH: 'secondary',
    ZIYARAH: 'warning',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Back Link */}
      <div>
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all packages</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={typeBadgeVariant[type] || 'default'}>{type.replace('_', ' ')}</Badge>
          <Badge variant="outline">Verified Journey</Badge>
          <Badge variant="success">Price Freeze Protected</Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {name}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {description ||
            'Complete pilgrimage package including round-trip flights, 5-star hotel accommodations near the Holy Mosques, transport, and dedicated group guides.'}
        </p>

        {/* Schedule Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-[11px] text-slate-500 block">Departure Date</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatDate(departureDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="text-[11px] text-slate-500 block">Booking Closing</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatDate(bookingEndDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Building className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <span className="text-[11px] text-slate-500 block">Accommodations</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Makkah & Madinah Hotels
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tiers & Booking CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tiers Selection & Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Pricing Tier</h2>
            <p className="text-xs text-slate-500">
              Choose your preferred tier. Each tier features dedicated seat quota and frozen price
              snapshots.
            </p>
          </div>

          <div className="space-y-4">
            {tiers.map((tier) => {
              const isSelected = selectedTierId === tier.id;
              const quota = Number(tier.quota) || 0;
              const confirmed = Number(tier.confirmedSeats) || 0;
              const held = Number(tier.heldSeats) || 0;
              const available = Math.max(0, quota - (confirmed + held));
              const isSoldOut = available <= 0;

              return (
                <div
                  key={tier.id}
                  onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                      : isSoldOut
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {tier.name}
                        </h3>
                        {isSelected && (
                          <Badge variant="default" className="text-[10px]">
                            Selected
                          </Badge>
                        )}
                        {isSoldOut && (
                          <Badge variant="danger" className="text-[10px]">
                            Sold Out
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {tier.name === 'VIP'
                          ? '5-Star Front Row Haram view hotel, VIP air-conditioned private coach.'
                          : tier.name === 'Standard'
                          ? '4-Star hotel walking distance to Haram, shared comfortable transport.'
                          : 'Comfortable economy accommodation with shuttle assistance to Haram.'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Per Pilgrim
                      </span>
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(tier.price)}
                      </span>
                    </div>
                  </div>

                  {/* Seat Occupancy Meter */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <SeatQuotaBar quota={quota} confirmedSeats={confirmed} heldSeats={held} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Package Inclusions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Package Inclusions & Guarantees
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Round-Trip Airline Tickets & Visa Processing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Holy City Hotel Accommodations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Full Ground AC Transport in Makkah/Madinah</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ziyarah Historical Site Guided Tours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Summary Box (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <Card className="border-emerald-500/30 shadow-lg overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-600 to-amber-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Package:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                    {name}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Selected Tier:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {selectedTier ? selectedTier.name : 'None selected'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Unit Price:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedTier ? formatCurrency(selectedTier.price) : '0 BDT'}
                  </span>
                </div>
              </div>

              {/* Price Freeze Alert */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Price Freeze Guarantee</span>
                </div>
                <p>
                  Upon initiating booking, your selected unit price is locked. You can add multiple
                  pilgrims on the next step.
                </p>
              </div>

              {selectedTier && (
                <Link
                  href={`/bookings/create?packageId=${packageData.id}&tierId=${selectedTier.id}`}
                  className="block w-full"
                >
                  <Button variant="gold" size="lg" className="w-full gap-2 shadow-md">
                    <span>Book This Package</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
