import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, RefreshCw, Moon, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Guaranteed Rate Protection
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your booked rate is locked indefinitely. Future package price changes will never
                affect your confirmed reservation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Guaranteed Seat Reservation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Our real-time reservation system guarantees that once you hold a seat, it is reserved
                exclusively for you during checkout.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Flexible Payment Options
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Convenient payment plans with transparent schedules, automated reminders, and clear
                refund policies.
              </p>
            </div>
          </div>
        </div>

        {/* Brand & Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Hajj & Umrah Pilgrimage Portal
            </span>
            <span className="text-slate-400">· Trusted Pilgrim Services</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/packages" className="hover:text-emerald-600 transition-colors">
              Packages
            </Link>
            <Link href="/bookings" className="hover:text-emerald-600 transition-colors">
              My Bookings
            </Link>
            <span className="text-slate-400">Official Pilgrim Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
