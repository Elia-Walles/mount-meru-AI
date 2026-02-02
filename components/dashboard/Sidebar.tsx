'use client';

import Image from 'next/image';
import { User } from '@/lib/api-service';

interface SidebarProps {
  user: User;
  activeView: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash';
  onViewChange: (view: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash') => void;
  onLogout: () => void;
  departmentFilter?: string;
  onDepartmentSelect?: (departmentId: string) => void;
  datasetCountByDepartment?: Record<string, number>;
  onAddFolder?: () => void;
}

export default function Sidebar({ user, activeView, onViewChange, onLogout, departmentFilter = '', onDepartmentSelect, datasetCountByDepartment = {}, onAddFolder }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'datasets', label: 'My Datasets', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const departmentFolders = [
    { id: 'opd', label: 'OPD', icon: '🏥' },
    { id: 'ipd', label: 'IPD', icon: '🛏️' },
    { id: 'laboratory', label: 'Laboratory', icon: '🔬' },
    { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { id: 'rch', label: 'RCH', icon: '👶' },
    { id: 'theatre', label: 'Theatre', icon: '🏨' },
    { id: 'mortuary', label: 'Mortuary', icon: '⚰️' },
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

  return (
    <div className="w-64 bg-white border-r-2 border-slate-200 flex flex-col shadow-sm">
      <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="Mount Meru AI" width={48} height={48} className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Mount Meru AI</h1>
            <p className="text-xs font-medium text-slate-600">Hospital Analytics</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-slate-700">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as typeof activeView)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeView === item.id
                ? 'bg-slate-100 text-slate-800 border-2 border-slate-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-2 border-transparent'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</h3>
          <button type="button" onClick={onAddFolder} className="text-xs font-medium text-slate-600 hover:text-slate-800">Add Folder</button>
        </div>
        <div className="space-y-1">
          {departmentFolders.map((folder) => {
            const count = datasetCountByDepartment[folder.id] ?? 0;
            const isActive = departmentFilter === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onDepartmentSelect?.(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-100 text-slate-800 border-2 border-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{folder.icon}</span>
                  <span>{folder.label}</span>
                </div>
                <span className="text-xs text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onViewChange('trash')}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeView === 'trash' ? 'bg-slate-100 text-slate-800 border-2 border-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>🗑️</span>
          <span>Trash</span>
        </button>
      </div>

      <div className="p-4 border-t-2 border-slate-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
