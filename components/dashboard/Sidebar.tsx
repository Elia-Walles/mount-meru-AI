'use client';

import { User } from '@/lib/api-service';

interface SidebarProps {
  user: User;
  activeView: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings';
  onViewChange: (view: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings') => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeView, onViewChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'datasets', label: 'My Datasets', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const departmentFolders = [
    { id: 'opd', label: 'OPD', icon: '🏥', count: 15 },
    { id: 'ipd', label: 'IPD', icon: '🛏️', count: 8 },
    { id: 'laboratory', label: 'Laboratory', icon: '🔬', count: 12 },
    { id: 'pharmacy', label: 'Pharmacy', icon: '💊', count: 6 },
    { id: 'rch', label: 'RCH', icon: '👶', count: 10 },
    { id: 'theatre', label: 'Theatre', icon: '🏨', count: 4 },
    { id: 'mortuary', label: 'Mortuary', icon: '⚰️', count: 2 },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator': return 'bg-purple-100 text-purple-800';
      case 'data_analyst': return 'bg-blue-100 text-blue-800';
      case 'clinician': return 'bg-green-100 text-green-800';
      case 'me_officer': return 'bg-yellow-100 text-yellow-800';
      case 'medical_recorder': return 'bg-gray-100 text-gray-800';
      case 'hospital_management': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mount Meru AI</h1>
            <p className="text-xs text-gray-500">Hospital Analytics</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Department Folders */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Departments</h3>
          <button className="text-xs text-blue-600 hover:text-blue-700">Add Folder</button>
        </div>
        <div className="space-y-1">
          {departmentFolders.map((folder) => (
            <button
              key={folder.id}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <div className="flex items-center space-x-2">
                <span>{folder.icon}</span>
                <span>{folder.label}</span>
              </div>
              <span className="text-xs text-gray-400">{folder.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trash */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          <span>🗑️</span>
          <span>Trash</span>
        </button>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
