'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import type { User } from '@/lib/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        router.replace('/');
        return;
      }
    } else {
      router.replace('/');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('user');
    router.replace('/');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
