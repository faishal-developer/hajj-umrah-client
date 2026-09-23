import React from 'react';
import Link from 'next/link';
import { Package } from '@/types/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeatQuotaBar } from '@/components/seat-quota-bar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, ArrowRight, Sparkles, MapPin, Tag } from 'lucide-react';

interface PackageCardProps {
  packageData: Package;
}

export function PackageCard({ packageData }: PackageCardProps) {
  const { id, name, type, description, departureDate, bookingEndDate, tiers = [] } = packageData;

  const minPrice =
    tiers.length > 0
      ? Math.min(...tiers.map((t) => Number(t.price)))
      : 0;

  const totalQuota = tiers.reduce((acc, t) => acc + Number(t.quota || 0), 0);
  const totalConfirmed = tiers.reduce((acc, t) => acc + Number(t.confirmedSeats || 0), 0);
  const totalHeld = tiers.reduce((acc, t) => acc + Number(t.heldSeats || 0), 0);
  const totalAvailable = Math.max(0, totalQuota - (totalConfirmed + totalHeld));

  const typeLabels: Record<string, { label: string; variant: 'default' | 'gold' | 'secondary' | 'warning' }> = {
    HAJJ: { label: 'Hajj Pilgrimage', variant: 'gold' },
    RAMADAN_UMRAH: { label: 'Ramadan Umrah', variant: 'default' },
    OFF_SEASON_UMRAH: { label: 'Off-Season Umrah', variant: 'secondary' },
    ZIYARAH: { label: 'Ziyarah Tour', variant: 'warning' },
  };

  const currentType = typeLabels[type] || { label: type, variant: 'default' };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 group overflow-hidden">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant={currentType.variant}>{currentType.label}</Badge>
          {totalAvailable <= 0 ? (
            <Badge variant="danger">Sold Out</Badge>
          ) : totalAvailable <= 10 ? (
            <Badge variant="warning">Limited Seats</Badge>
          ) : (
            <Badge variant="success">Booking Open</Badge>
          )}
        </div>

        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          {name}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
          {description || 'Comprehensive pilgrimage package with premium accommodations and guided support.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 pb-4">
        {/* Departure & Booking Dates */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Departure</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(departureDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Closing Date</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(bookingEndDate)}</span>
            </div>
          </div>
        </div>

        {/* Tiers Preview */}
        <div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Available Tiers ({tiers.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
              >
                <Tag className="w-3 h-3 text-slate-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{tier.name}:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(tier.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seat Occupancy Meter */}
        {totalQuota > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <SeatQuotaBar
              quota={totalQuota}
              confirmedSeats={totalConfirmed}
              heldSeats={totalHeld}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-auto flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 p-4">
        <div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block">Starting from</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">
            {minPrice > 0 ? formatCurrency(minPrice) : 'N/A'}
          </span>
        </div>

        <Link href={`/packages/${id}`}>
          <Button variant="primary" size="sm" className="gap-1.5">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
