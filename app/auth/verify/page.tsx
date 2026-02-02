'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage(result.message ?? 'Email verified. You can sign in now.');
        } else {
          setStatus('error');
          setMessage(result.message ?? 'Invalid or expired link.');
        }
      } catch {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
        <div className="pt-8 px-6 pb-6 text-center border-b-2 border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Mount Meru AI" width={80} height={80} className="rounded-2xl object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mount Meru AI</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">Email verification</p>
        </div>

        <div className="p-6">
          {status === 'loading' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-800 mx-auto" />
              <p className="mt-4 text-sm font-medium text-slate-600">Verifying your email…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border-2 border-emerald-200">
                {message}
              </div>
              <Link
                href="/"
                className="flex items-center justify-center w-full h-12 text-base font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 shadow-md transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border-2 border-red-200">
                {message}
              </div>
              <Link
                href="/"
                className="flex items-center justify-center w-full h-12 text-base font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-800" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
