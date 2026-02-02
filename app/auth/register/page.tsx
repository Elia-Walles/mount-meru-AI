'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'me_officer', label: 'M&E Officer' },
  { value: 'medical_recorder', label: 'Medical Recorder' },
  { value: 'hospital_management', label: 'Hospital Management' },
];

const DEPARTMENTS = ['OPD', 'IPD', 'Laboratory', 'Pharmacy', 'RCH', 'Theatre', 'Mortuary'];

const inputClass =
  'w-full h-12 px-4 text-base border-2 border-slate-200 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2';
const selectClass =
  'w-full h-12 px-4 text-base border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'data_analyst',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          department: formData.department || undefined,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Account created. Check your email to verify.');
        setTimeout(() => router.push('/'), 2500);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
        <div className="pt-8 px-6 pb-6 text-center border-b-2 border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Mount Meru AI" width={80} height={80} className="rounded-2xl object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mount Meru AI</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">Create account</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Full name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="you@hospital.org"
              />
            </div>
            <div>
              <label htmlFor="role" className={labelClass}>Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={selectClass}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="department" className={labelClass}>Department (optional)</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 text-base font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-md"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6">
            <Link
              href="/"
              className="flex items-center justify-center w-full h-12 text-base font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-600">
            Already have an account? <Link href="/" className="font-semibold text-slate-800 hover:text-slate-900 underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
