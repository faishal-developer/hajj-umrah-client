'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Booking } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  BookOpen,
  Compass,
  LogOut,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/profile');
      } else {
        const fetchBookings = async () => {
          try {
            setIsLoadingBookings(true);
            const res = await api.get<Booking[]>('/bookings/me');
            setBookings(res.data || []);
          } catch (err) {
            console.error('Failed to load user bookings summary:', err);
          } finally {
            setIsLoadingBookings(false);
          }
        };
        fetchBookings();
      }
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const pendingCount = bookings.filter((b) => ['HELD', 'PENDING_PAYMENT', 'PARTIALLY_PAID'].includes(b.status)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50 duration-200">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 border-2 border-white/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {user.name}
                </h1>
                <Badge variant={user.role === 'ADMIN' ? 'gold' : 'default'} className="uppercase text-[11px]">
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-emerald-200/80 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-400" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-xs text-emerald-300/70 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-white/20 bg-white/10 hover:bg-white/20 text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Bookings</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isLoadingBookings ? '...' : bookings.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Confirmed Packages</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isLoadingBookings ? '...' : confirmedCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Action Pending</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isLoadingBookings ? '...' : pendingCount}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Details & Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Account Information
            </CardTitle>
            <CardDescription>Your registered pilgrim profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Role Status</span>
              <Badge variant="default" className="text-xs">
                {user.role} - {user.status || 'ACTIVE'}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Member Since</span>
              <span className="text-slate-700 dark:text-slate-300">
                {user.createdAt ? formatDate(user.createdAt) : 'Active Member'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Security & Guarantees
            </CardTitle>
            <CardDescription>Your booking protection and peace of mind.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Payment Protection & Duplicate Prevention
                </p>
                <p>All reservations and payments are protected against accidental double charges.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Guaranteed Rate Protection
                </p>
                <p>When you reserve seats, your package rate is locked throughout the booking window.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">Ready for your spiritual journey?</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Manage your ongoing bookings or discover new available packages.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/bookings" className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="w-full">
              <BookOpen className="w-4 h-4 mr-1.5" />
              My Bookings
            </Button>
          </Link>
          <Link href="/packages" className="flex-1 sm:flex-initial">
            <Button variant="primary" size="sm" className="w-full">
              <Compass className="w-4 h-4 mr-1.5" />
              Explore Packages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
