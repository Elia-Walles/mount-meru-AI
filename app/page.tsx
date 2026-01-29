'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api-service';
import LoginScreen from '@/components/auth/LoginScreen';
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize database via API
    const initializeData = async () => {
      try {
        // Initialize database (this will create schema and seed only for mock database)
        await apiService.initializeDatabase();
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Mount Meru AI Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
