'use client';

import { useState } from 'react';
import { useDepartments } from '@/hooks/useDepartments';

interface DepartmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepartmentManagementModal({ isOpen, onClose }: DepartmentManagementModalProps) {
  const { departments, loading, createDepartment, deleteDepartment } = useDepartments();
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;

    try {
      setAdding(true);
      await createDepartment({
        name: newDepartmentName.trim(),
        description: newDepartmentDescription.trim() || undefined,
        isActive: true,
        sortOrder: departments.length + 1
      });
      
      setNewDepartmentName('');
      setNewDepartmentDescription('');
    } catch (error) {
      console.error('Failed to add department:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteDepartment(id);
    } catch (error) {
      console.error('Failed to delete department:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Manage Departments</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Add New Department Form */}
          <div className="mb-8 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Department</h3>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="e.g., Radiology"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newDepartmentDescription}
                  onChange={(e) => setNewDepartmentDescription(e.target.value)}
                  placeholder="Brief description of the department's function..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={adding || !newDepartmentName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {adding ? 'Adding...' : 'Add Department'}
              </button>
            </form>
          </div>

          {/* Existing Departments */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Existing Departments</h3>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading departments...</div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No departments found</div>
            ) : (
              <div className="space-y-2">
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{department.name}</h4>
                      {department.description && (
                        <p className="text-sm text-slate-600 mt-1">{department.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDepartment(department.id)}
                      disabled={deletingId === department.id}
                      className="ml-4 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === department.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
