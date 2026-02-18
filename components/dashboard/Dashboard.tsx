'use client';

import { useState, useEffect } from 'react';
import { User, Dataset, PatientRecord, AnalyticsResult, Report } from '@/lib/api-service';
import { apiService } from '@/lib/api-service';
import { AnalyticsEngine } from '@/lib/analytics-engine';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import AIAnalyst from './AIAnalyst';
import NewDatasetModal from './NewDatasetModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [analyticsResults, setAnalyticsResults] = useState<AnalyticsResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash' | 'ai-analyst'>('home');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [trashDatasets, setTrashDatasets] = useState<Dataset[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (activeView === 'trash') {
      apiService.getTrashDatasets(user.id).then(setTrashDatasets);
    }
  }, [activeView, user.id]);

  useEffect(() => {
    if (activeView === 'reports') {
      apiService.getReports(user.id).then(setReports);
    }
  }, [activeView, user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's datasets
      const userDatasets = await apiService.getDatasets(user.id);
      setDatasets(userDatasets);
      
      // Load analytics results
      const results = await apiService.getAnalyticsResults();
      setAnalyticsResults(results);
      
      // Select first dataset if available
      if (userDatasets.length > 0) {
        setSelectedDataset(userDatasets[0]);
        const records = await apiService.getPatientRecords(userDatasets[0].id);
        setPatientRecords(records);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    try {
      const records = await apiService.getPatientRecords(dataset.id);
      setPatientRecords(records);
    } catch (error) {
      console.error('Error loading patient records:', error);
    }
  };

  const handleDatasetCreated = async (dataset: Dataset) => {
    setDatasets(prev => [dataset, ...prev]);
    setSelectedDataset(dataset);
    setActiveView('datasets');
    try {
      const records = await apiService.getPatientRecords(dataset.id);
      setPatientRecords(records);
    } catch (error) {
      console.error('Error loading patient records:', error);
    }
  };

  const handleAIQuery = async (query: string) => {
    if (!selectedDataset) {
      return {
        success: false,
        message: 'Please select a dataset first',
        results: null
      };
    }

    try {
      const response = await apiService.performAnalytics(selectedDataset.id, query, user.id);
      if (!response.success || !response.results) return response;

      // Refresh analytics list so the new result appears on the Analytics tab
      const freshResults = await apiService.getAnalyticsResults();
      setAnalyticsResults(freshResults);

      // Normalize API response so AIAnalyst always receives { data, interpretation, recommendations, analysisType }
      const r = response.results as Record<string, unknown>;
      const normalized = {
        data: r.statisticalResults ?? r.metrics ?? r.data,
        interpretation: (r.aiAnalysis ?? r.interpretation) as string | undefined,
        recommendations: (Array.isArray(r.recommendations) ? r.recommendations : []) as string[],
        analysisType: r.analysisType as string | undefined,
        insights: Array.isArray(r.insights) ? r.insights : []
      };
      return { ...response, results: normalized };
    } catch (error) {
      return {
        success: false,
        message: 'Analysis failed. Please try again.',
        results: null
      };
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-800 mx-auto" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleMobileNavigate = () => {
    setIsSidebarCollapsed(true);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="hidden md:flex">
        <Sidebar 
          user={user}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={onLogout}
          departmentFilter={departmentFilter}
          onDepartmentSelect={(deptId) => {
            setDepartmentFilter(deptId);
            setActiveView('datasets');
            handleMobileNavigate();
          }}
          datasetCountByDepartment={datasets.reduce((acc, d) => {
            acc[d.department] = (acc[d.department] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)}
          onAddFolder={() => {
            setShowNewDatasetModal(true);
            handleMobileNavigate();
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onMobileNavigate={handleMobileNavigate}
        />
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-3 bg-white rounded-lg shadow-lg border border-slate-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsSidebarCollapsed(true)}
          />
          <div className="relative flex flex-col w-64 h-full bg-white">
            <Sidebar 
              user={user}
              activeView={activeView}
              onViewChange={setActiveView}
              onLogout={onLogout}
              departmentFilter={departmentFilter}
              onDepartmentSelect={(deptId) => {
                setDepartmentFilter(deptId);
                setActiveView('datasets');
                handleMobileNavigate();
              }}
              datasetCountByDepartment={datasets.reduce((acc, d) => {
                acc[d.department] = (acc[d.department] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              onAddFolder={() => {
                setShowNewDatasetModal(true);
                handleMobileNavigate();
              }}
              isCollapsed={false}
              onToggleCollapse={() => setIsSidebarCollapsed(true)}
              onMobileNavigate={handleMobileNavigate}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-0 overflow-hidden">
        {activeView === 'ai-analyst' ? (
          <div className="h-full overflow-y-auto">
            <AIAnalyst
              selectedDataset={selectedDataset}
              patientRecords={patientRecords}
              onQuery={handleAIQuery}
            />
          </div>
        ) : (
          <div className="h-full">
            <MainContent
              activeView={activeView}
              datasets={datasets}
              selectedDataset={selectedDataset}
              patientRecords={patientRecords}
              analyticsResults={analyticsResults}
              onDatasetSelect={handleDatasetSelect}
              user={user}
              departmentFilter={departmentFilter}
              onDepartmentFilterChange={setDepartmentFilter}
              onOpenNewDataset={() => setShowNewDatasetModal(true)}
              onDatasetCreated={handleDatasetCreated}
              trashDatasets={trashDatasets}
              onRestore={async (id) => {
                await apiService.restoreDataset(id, user.id);
                setTrashDatasets(prev => prev.filter(d => d.id !== id));
                loadDashboardData();
              }}
              onTrashRefresh={() => apiService.getTrashDatasets(user.id).then(setTrashDatasets)}
              reports={reports}
              onGenerateReport={async (params) => {
                const report = await apiService.generateReport({ ...params, generatedBy: user.id });
                if (report) {
                  setReports(prev => [report, ...prev]);
                  return report;
                }
                return null;
              }}
              onReportsRefresh={() => apiService.getReports(user.id).then(setReports)}
              onMoveToTrash={async (id) => {
                await apiService.softDeleteDataset(id, user.id);
                if (selectedDataset?.id === id) {
                  setSelectedDataset(null);
                  setPatientRecords([]);
                }
                loadDashboardData();
              }}
            />
          </div>
        )}
      </div>

      <NewDatasetModal
        isOpen={showNewDatasetModal}
        onClose={() => setShowNewDatasetModal(false)}
        onSuccess={handleDatasetCreated}
        userId={user.id}
      />
    </div>
  );
}
