'use client';

import { useState } from 'react';
import { User, Dataset, PatientRecord, AnalyticsResult } from '@/lib/api-service';

interface MainContentProps {
  activeView: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings';
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  patientRecords: PatientRecord[];
  analyticsResults: AnalyticsResult[];
  onDatasetSelect: (dataset: Dataset) => void;
  user: User;
}

export default function MainContent({
  activeView,
  datasets,
  selectedDataset,
  patientRecords,
  analyticsResults,
  onDatasetSelect,
  user
}: MainContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderHomeView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hospital Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}. Here's your hospital data overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Datasets</p>
                <p className="text-2xl font-bold text-gray-900">{datasets.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{patientRecords.length.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analyses Run</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsResults.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Datasets */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Datasets</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {datasets.slice(0, 5).map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{dataset.name}</p>
                      <p className="text-xs text-gray-500">{dataset.rowCount} records • {dataset.department}</p>
                    </div>
                    <button
                      onClick={() => onDatasetSelect(dataset)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{result.query}</p>
                      <p className="text-xs text-gray-500">{result.analysisType} • {result.generatedAt.toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatasetsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Datasets</h1>
            <p className="text-gray-600 mt-1">Manage and analyze your hospital datasets</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + New Dataset
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Departments</option>
              <option value="opd">OPD</option>
              <option value="ipd">IPD</option>
              <option value="laboratory">Laboratory</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="rch">RCH</option>
            </select>
          </div>
        </div>

        {/* Dataset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`bg-white rounded-lg shadow border border-gray-200 p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedDataset?.id === dataset.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onDatasetSelect(dataset)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  dataset.isProcessed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataset.isProcessed ? 'Processed' : 'Processing'}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{dataset.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{dataset.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="font-medium">{dataset.department.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="font-medium">{dataset.rowCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{dataset.fileType}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{dataset.uploadedAt.toLocaleDateString()}</span>
                  <span>{dataset.columns.length} columns</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Results</h1>
        
        {analyticsResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-gray-600">Start by asking the AI Analyst to analyze your data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {analyticsResults.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.query}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {result.analysisType} • {result.generatedAt.toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Completed
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(result.results, null, 2)}
                  </pre>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Interpretation:</h4>
                  <p className="text-sm text-blue-800">{result.interpretation}</p>
                </div>
                
                {result.recommendations.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Recommendations:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reports coming soon</h3>
          <p className="text-gray-600">Automated report generation will be available soon</p>
        </div>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings coming soon</h3>
          <p className="text-gray-600">User settings and preferences will be available soon</p>
        </div>
      </div>
    </div>
  );

  switch (activeView) {
    case 'home':
      return renderHomeView();
    case 'datasets':
      return renderDatasetsView();
    case 'analytics':
      return renderAnalyticsView();
    case 'reports':
      return renderReportsView();
    case 'settings':
      return renderSettingsView();
    default:
      return renderHomeView();
  }
}
