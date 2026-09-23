'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Package, PackageType } from '@/types/api';
import { api } from '@/lib/api-client';
import { PackageCard } from '@/components/package-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Compass, Filter, RefreshCw, Calendar, Tag } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1000000);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Package[]>('/packages', { requiresAuth: false });
      setPackages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Type filter
      if (selectedType !== 'ALL' && pkg.type !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = pkg.name.toLowerCase().includes(q);
        const matchDesc = pkg.description?.toLowerCase().includes(q);
        const matchTier = pkg.tiers?.some((t) => t.name.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTier) return false;
      }
      // Price filter
      const minPrice =
        pkg.tiers && pkg.tiers.length > 0
          ? Math.min(...pkg.tiers.map((t) => Number(t.price)))
          : 0;
      if (minPrice > maxPriceFilter) {
        return false;
      }
      return true;
    });
  }, [packages, selectedType, searchQuery, maxPriceFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Package Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Explore Hajj & Umrah Packages
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Browse verified spiritual journeys with real-time seat availability, transparent tier
          options, and guaranteed rate protection for all reservations.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by package name, holy city, or amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
            />
          </div>

          {/* Type Selector */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="ALL">All Package Types</option>
              <option value="HAJJ">Hajj</option>
              <option value="RAMADAN_UMRAH">Ramadan Umrah</option>
              <option value="OFF_SEASON_UMRAH">Off-Season Umrah</option>
              <option value="ZIYARAH">Ziyarah Tour</option>
            </select>
          </div>

          {/* Refresh / Reset Button */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setMaxPriceFilter(1000000);
              }}
              className="w-full text-xs"
            >
              Reset Filters
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchPackages}
              title="Reload catalog"
              isLoading={isLoading}
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Quick Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold mr-1">Quick Select:</span>
          {[
            { id: 'ALL', label: 'All Packages' },
            { id: 'HAJJ', label: 'Hajj 2027' },
            { id: 'RAMADAN_UMRAH', label: 'Ramadan Umrah' },
            { id: 'OFF_SEASON_UMRAH', label: 'Off-Season' },
            { id: 'ZIYARAH', label: 'Ziyarah' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedType(pill.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedType === pill.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <span className="ml-auto text-slate-600 dark:text-slate-400 text-xs font-medium">
            Showing <strong>{filteredPackages.length}</strong> available packages
          </span>
        </div>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-6 space-y-4"
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
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
          <Compass className="w-12 h-12 mx-auto text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No packages match your search
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or resetting filters to view all published packages.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('ALL');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
