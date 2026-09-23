'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Lock, Mail, User, Phone, Moon, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/packages';

  const { register, isLoading: isAuthLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const success = await register(name.trim(), email.trim(), password, phone.trim() || undefined);
    setIsSubmitting(false);

    if (success) {
      router.push(redirectUrl);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mx-auto shadow-sm">
          <Moon className="w-6 h-6 fill-amber-300/40 text-amber-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Pilgrim Account
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Register to hold package seats, freeze pricing, and manage multi-pilgrim group bookings.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pilgrim Registration</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Full Name*"
              placeholder="e.g. Mohammad Faishal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="email"
              label="Email Address*"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="tel"
              label="Phone Number"
              placeholder="+880 1700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              type="password"
              label="Password (min 6 chars)*"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md gap-2"
              isLoading={isSubmitting || isAuthLoading}
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-bold text-emerald-600 hover:text-emerald-700 ml-1 underline"
          >
            Sign in here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading registration form...</p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
