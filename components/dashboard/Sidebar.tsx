'use client';

import Image from 'next/image';
import { useState } from 'react';
import { User } from '@/lib/api-service';
import { useDepartments } from '@/hooks/useDepartments';
import DepartmentManagementModal from './DepartmentManagementModal';

interface SidebarProps {
  user: User;
  activeView: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash' | 'ai-analyst';
  onViewChange: (view: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash' | 'ai-analyst') => void;
  onLogout: () => void;
  departmentFilter?: string;
  onDepartmentSelect?: (departmentId: string) => void;
  datasetCountByDepartment?: Record<string, number>;
  onAddFolder?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMobileNavigate?: () => void; // New prop for mobile navigation
}

export default function Sidebar({ user, activeView, onViewChange, onLogout, departmentFilter = '', onDepartmentSelect, datasetCountByDepartment = {}, onAddFolder, isCollapsed = false, onToggleCollapse, onMobileNavigate }: SidebarProps) {
  const { departments, loading: departmentsLoading, deleteDepartment } = useDepartments();
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'datasets', label: 'My Datasets', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'ai-analyst', label: 'AI Analyst', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator': return 'bg-slate-200 text-slate-800';
      case 'data_analyst': return 'bg-slate-200 text-slate-800';
      case 'clinician': return 'bg-slate-200 text-slate-800';
      case 'me_officer': return 'bg-slate-200 text-slate-800';
      case 'medical_recorder': return 'bg-slate-200 text-slate-800';
      case 'hospital_management': return 'bg-slate-200 text-slate-800';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleNavigation = (view: typeof activeView) => {
    onViewChange(view);
    // Close mobile sidebar after navigation
    onMobileNavigate?.();
  };

  const handleDeleteDepartment = async (departmentId: string, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${departmentName}" department? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(departmentId);
      await deleteDepartment(departmentId);
      
      // If the deleted department was selected, clear the filter
      if (departmentFilter === departmentId) {
        onDepartmentSelect?.('');
      }
    } catch (error) {
      console.error('Failed to delete department:', error);
      alert('Failed to delete department. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r-2 border-slate-200 flex flex-col h-screen shadow-sm transition-all duration-300 ease-in-out`}>
      {/* Header with Toggle Button */}
      <div className="p-4 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src="/logo.png" alt="Mount Meru AI" width={48} height={48} className="object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Mount Meru AI</h1>
                <p className="text-xs font-medium text-slate-600">Hospital Analytics</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md border border-slate-200"
          >
            <svg 
              className="w-5 h-5 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-700">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'Unknown User'}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${getRoleColor(user.role)}`}>
                  {formatRole(user.role)}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id as typeof activeView)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeView === item.id
                  ? 'bg-slate-100 text-slate-800 border-2 border-slate-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-2 border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</h3>
              <button 
                type="button" 
                onClick={() => setShowDepartmentManagement(true)} 
                className="text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Manage
              </button>
            </div>
            <div className="space-y-1">
              {departments.map((folder) => {
                const count = datasetCountByDepartment[folder.id] ?? 0;
                const isActive = departmentFilter === folder.id;
                const isDeleting = deletingId === folder.id;
                
                return (
                  <div key={folder.id} className="flex items-center group">
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(folder.id, folder.name);
                      }}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded mr-1"
                      title={`Delete ${folder.name}`}
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Department button */}
                    <button
                      onClick={() => {
                        onDepartmentSelect?.(folder.id);
                        handleNavigation('datasets');
                      }}
                      className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? 'bg-slate-100 text-slate-800 border-2 border-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>{folder.name}</span>
                      <span className="text-xs text-slate-400">{count}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Section */}
      <div className="flex-shrink-0 border-t-2 border-slate-200">
        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleNavigation('trash')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeView === 'trash' ? 'bg-slate-100 text-slate-800 border-2 border-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Trash' : undefined}
          >
            <span>🗑️</span>
            {!isCollapsed && <span>Trash</span>}
          </button>
        </div>

        <div className="p-4 border-t-2 border-slate-200">
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
    
    <DepartmentManagementModal
      isOpen={showDepartmentManagement}
      onClose={() => setShowDepartmentManagement(false)}
    />
    </>
  );
}
