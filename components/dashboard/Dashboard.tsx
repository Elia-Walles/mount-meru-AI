'use client';

import { useState, useEffect } from 'react';
import { User, Dataset, PatientRecord, AnalyticsResult } from '@/lib/api-service';
import { apiService } from '@/lib/api-service';
import { AnalyticsEngine } from '@/lib/analytics-engine';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import AIAnalyst from './AIAnalyst';

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
  const [activeView, setActiveView] = useState<'home' | 'datasets' | 'analytics' | 'reports' | 'settings'>('home');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

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

  const handleAIQuery = async (query: string) => {
    if (!selectedDataset) {
      return {
        success: false,
        message: 'Please select a dataset first',
        results: null
      };
    }

    try {
      // Perform analytics via API
      const response = await apiService.performAnalytics(selectedDataset.id, query);
      
      return response;
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        <MainContent
          activeView={activeView}
          datasets={datasets}
          selectedDataset={selectedDataset}
          patientRecords={patientRecords}
          analyticsResults={analyticsResults}
          onDatasetSelect={handleDatasetSelect}
          user={user}
        />

        {/* AI Analyst Panel */}
        <AIAnalyst
          selectedDataset={selectedDataset}
          patientRecords={patientRecords}
          onQuery={handleAIQuery}
        />
      </div>
    </div>
  );
}
