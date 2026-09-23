'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from '@/types/api';
import { api } from '@/lib/api-client';
import { PackageCard } from '@/components/package-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Moon,
  Loader2,
} from 'lucide-react';

export default function HomePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  useEffect(() => {
    async function loadPackages() {
      try {
        setIsLoading(true);
        const res = await api.get<Package[]>('/packages', { requiresAuth: false });
        setPackages(res.data || []);
      } catch (error) {
        console.error('Failed to load packages:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPackages();
  }, []);

  const filteredPackages =
    selectedType === 'ALL'
      ? packages
      : packages.filter((pkg) => pkg.type === selectedType);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-14 lg:p-20 shadow-2xl border border-emerald-900/40">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>2026–2027 Official Hajj & Umrah Pilgrimage Season</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Embark on Your Blessed Journey with Total Peace of Mind.
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 font-normal leading-relaxed">
            Transparent pricing with guaranteed price freezes, concurrency-safe seat reservations,
            and automated installment payment schedules designed for discerning pilgrims.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/packages">
              <Button variant="gold" size="lg" className="gap-2 font-bold shadow-lg">
                <Compass className="w-5 h-5" />
                <span>Browse All Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Create Pilgrim Account
              </Button>
            </Link>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Immutable Price Freezes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dual-Control Security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Seat Overselling</span>
            </div>
          </div>
        </div>
      </section>

      {/* Package Filter & Catalog Showcase */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Moon className="w-3.5 h-3.5" />
              <span>Published Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Featured Pilgrimage Packages
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select an upcoming journey with verified flight schedules, hotel tiers, and seat quotas.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {['ALL', 'HAJJ', 'RAMADAN_UMRAH', 'OFF_SEASON_UMRAH', 'ZIYARAH'].map((tab) => {
              const labels: Record<string, string> = {
                ALL: 'All Packages',
                HAJJ: 'Hajj',
                RAMADAN_UMRAH: 'Ramadan Umrah',
                OFF_SEASON_UMRAH: 'Off-Season',
                ZIYARAH: 'Ziyarah',
              };
              const isSelected = selectedType === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedType(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[tab] || tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse flex flex-col p-6 space-y-4"
              >
                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-20 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md mt-auto" />
              </div>
            ))}
          </div>
        ) : filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
            <Compass className="w-12 h-12 mx-auto text-slate-400" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No packages found in this category
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check back soon or switch categories to explore other available journeys.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setSelectedType('ALL')}>
              Reset Filters
            </Button>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="gold">Simple & Transparent</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            How Your Booking Journey Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A frictionless 4-step process backed by strict database guarantees and automated
            installment tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Choose Package & Tier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Explore packages and select Economy, Standard, or VIP tier matching your budget and
              comfort preference.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Add Group Pilgrims
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add individual or group pilgrims with passport and date-of-birth details in one single
              booking.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Instant Seat Hold & Price Lock
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Seats are temporarily held for 30–60 minutes. Your unit price is permanently frozen in
              time.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Pay in Full or Installments
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete checkout online or follow your installment schedule with automated oldest-due
              allocations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
