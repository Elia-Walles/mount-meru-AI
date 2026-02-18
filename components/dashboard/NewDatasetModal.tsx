'use client';

import { useState, useRef } from 'react';
import { apiService } from '@/lib/api-service';
import { useDepartments } from '@/hooks/useDepartments';
import type { Dataset } from '@/lib/api-service';

const ACCEPT = '.xlsx,.xls,.csv,.tsv';
const MAX_SIZE_MB = 10;

interface NewDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataset: Dataset) => void;
  userId: string;
}

export default function NewDatasetModal({ isOpen, onClose, onSuccess, userId }: NewDatasetModalProps) {
  const { departments, loading: departmentsLoading } = useDepartments();
  const [file, setFile] = useState<File | null>(null);
  const [department, setDepartment] = useState<string>('');
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB`);
      setFile(null);
      return;
    }
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'tsv'].includes(ext || '')) {
      setError('Use .xlsx, .xls, .csv, or .tsv');
      setFile(null);
      return;
    }
    setFile(f);
    if (!name.trim()) setName(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Select a file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const result = await apiService.uploadDataset(file, department, userId, name.trim() || undefined);
      if (result.success && result.dataset) {
        onSuccess(result.dataset);
        onClose();
        setFile(null);
        setName('');
        setDepartment(departments[0]?.id || '');
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setName('');
      setDepartment(departments[0]?.id || '');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">New Dataset</h2>
          <p className="text-sm text-slate-600 mt-1">Import hospital data (Excel, CSV, or TSV)</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            {file && (
              <p className="mt-2 text-xs text-slate-500">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Dataset name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Uses file name if empty"
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 border-2 border-slate-200 hover:bg-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
