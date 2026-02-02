'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const inputClass =
  'w-full h-12 px-4 text-base border-2 border-slate-200 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(result.message || 'If an account exists, a reset link was sent to your email.');
      } else {
        setError(result.message || 'Request failed');
      }
    } catch {
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(result.message || 'Password reset. You can sign in now.');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError(result.message || 'Reset failed');
      }
    } catch {
      setError('Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isTokenFlow = !!token;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
        <div className="pt-8 px-6 pb-6 text-center border-b-2 border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Mount Meru AI" width={80} height={80} className="rounded-2xl object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mount Meru AI</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {isTokenFlow ? 'Set new password' : 'Reset password'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border-2 border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border-2 border-emerald-200">
              {success}
            </div>
          )}

          {isTokenFlow ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className={labelClass}>New password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 shadow-md transition-colors"
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@hospital.org"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 shadow-md transition-colors"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-6">
            <Link
              href="/"
              className="flex items-center justify-center w-full h-12 text-base font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-600">
            No account? <Link href="/auth/register" className="font-semibold text-slate-800 hover:text-slate-900 underline underline-offset-2">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-800" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
