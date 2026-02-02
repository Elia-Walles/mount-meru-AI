'use client';

import { useState } from 'react';
import { User, Dataset, PatientRecord, AnalyticsResult, Report } from '@/lib/api-service';

/** Human-readable labels for common analytics keys */
const RESULT_LABELS: Record<string, string> = {
  mean: 'Mean',
  stdDev: 'Standard Deviation',
  median: 'Median',
  count: 'Count',
  min: 'Minimum',
  max: 'Maximum',
  q1: 'Q1 (25th percentile)',
  q3: 'Q3 (75th percentile)',
  trend: 'Trend',
  percentChange: 'Percent Change',
  seasonalPattern: 'Seasonal Pattern',
  confidence: 'Confidence',
  incidence: 'Incidence (per 1,000)',
  prevalence: 'Prevalence',
  caseFatalityRate: 'Case Fatality Rate (%)',
  proportionalMorbidityRatio: 'Proportional Morbidity Ratio',
  recordCount: 'Records Analyzed',
  aiAnalysis: 'AI Analysis',
  statisticalResults: 'Statistical Results',
  forecast: 'Forecast',
  error: 'Error',
  message: 'Message',
};

function formatResultValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return Number.isInteger(val) ? String(val) : val.toFixed(2);
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.length ? `${val.length} item(s)` : '—';
  if (typeof val === 'object') return '[Details below]';
  return String(val);
}

function FormattedResults({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') {
    return <p className="text-slate-700">{formatResultValue(data)}</p>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-700">
        {data.map((item, i) => (
          <li key={i}>
            {typeof item === 'object' && item !== null && !Array.isArray(item)
              ? <FormattedResults data={item} />
              : formatResultValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== null && k !== 'error');
  if (keys.length === 0) {
    if (obj.error != null) {
      return <p className="text-amber-700 text-sm">{String(obj.error)}</p>;
    }
    return null;
  }

  const isNested = keys.some(k => typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date));
  if (isNested) {
    return (
      <div className="space-y-4">
        {keys.map((key) => {
          const val = obj[key];
          const label = RESULT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
            return (
              <div key={key} className="border-l-2 border-slate-200 pl-4">
                <h5 className="text-sm font-semibold text-slate-700 mb-2">{label}</h5>
                <FormattedResults data={val} />
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between gap-4 py-1">
              <span className="text-slate-600">{label}</span>
              <span className="font-medium text-slate-900">{formatResultValue(val)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {keys.map((key) => {
        const val = obj[key];
        const label = RESULT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        return (
          <div key={key} className="flex justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0">
            <dt className="text-slate-600 text-sm">{label}</dt>
            <dd className="font-medium text-slate-900 text-sm text-right">{formatResultValue(val)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

interface MainContentProps {
  activeView: 'home' | 'datasets' | 'analytics' | 'reports' | 'settings' | 'trash';
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  patientRecords: PatientRecord[];
  analyticsResults: AnalyticsResult[];
  onDatasetSelect: (dataset: Dataset) => void;
  user: User;
  departmentFilter?: string;
  onDepartmentFilterChange?: (dept: string) => void;
  onOpenNewDataset?: () => void;
  onDatasetCreated?: (dataset: Dataset) => void;
  trashDatasets?: Dataset[];
  onRestore?: (id: string) => Promise<void>;
  onTrashRefresh?: () => void;
  onMoveToTrash?: (id: string) => Promise<void>;
  reports?: Report[];
  onGenerateReport?: (params: { title: string; type: string; format?: string }) => Promise<Report | null>;
  onReportsRefresh?: () => void;
}

export default function MainContent({
  activeView,
  datasets,
  selectedDataset,
  patientRecords,
  analyticsResults,
  onDatasetSelect,
  user,
  departmentFilter = '',
  onDepartmentFilterChange,
  onOpenNewDataset,
  trashDatasets = [],
  onRestore,
  onTrashRefresh,
  onMoveToTrash,
  reports = [],
  onGenerateReport,
  onReportsRefresh
}: MainContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('monthly');

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !departmentFilter || dataset.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const renderHomeView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Hospital Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}. Here's your hospital data overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Datasets</p>
                <p className="text-2xl font-bold text-slate-900">{datasets.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-slate-900">{patientRecords.length.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analyses Run</p>
                <p className="text-2xl font-bold text-slate-900">{analyticsResults.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-slate-900">7</p>
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
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Datasets</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {datasets.slice(0, 5).map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{dataset.name}</p>
                      <p className="text-xs text-slate-500">{dataset.rowCount} records • {dataset.department}</p>
                    </div>
                    <button
                      onClick={() => onDatasetSelect(dataset)}
                      className="text-xs text-slate-700 font-semibold hover:text-slate-900"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Analyses</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{result.query}</p>
                      <p className="text-xs text-slate-500">{result.analysisType} • {result.generatedAt.toLocaleDateString()}</p>
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
            <h1 className="text-2xl font-bold text-slate-900">My Datasets</h1>
            <p className="text-gray-600 mt-1">Manage and analyze your hospital datasets</p>
          </div>
          <button type="button" onClick={onOpenNewDataset} className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-semibold shadow-md">
            + New Dataset
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-slate-200 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentFilterChange?.(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
            >
              <option value="">All Departments</option>
              <option value="opd">OPD</option>
              <option value="ipd">IPD</option>
              <option value="laboratory">Laboratory</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="rch">RCH</option>
              <option value="theatre">Theatre</option>
              <option value="mortuary">Mortuary</option>
            </select>
          </div>
        </div>

        {/* Dataset Grid */}
        {filteredDatasets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {datasets.length === 0 ? 'No datasets yet' : 'No datasets match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {datasets.length === 0
                ? 'Create a new dataset or import hospital data to get started.'
                : 'Try changing the search or department filter.'}
            </p>
            <button
              type="button"
              onClick={() => onDepartmentFilterChange?.('')}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`bg-white rounded-xl shadow-md border-2 border-slate-200 p-6 cursor-pointer transition-all hover:shadow-md ${
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
              
              <h3 className="font-semibold text-slate-900 mb-2">{dataset.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{dataset.description}</p>
              
              <div className="space-y-2 text-sm text-slate-500">
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
              
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>{dataset.uploadedAt.toLocaleDateString()}</span>
                  <span className="ml-2">• {dataset.columns.length} columns</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveToTrash?.(dataset.id); }}
                  className="text-xs font-medium text-slate-500 hover:text-red-600"
                  title="Move to Trash"
                >
                  Trash
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics Results</h1>
        
        {analyticsResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No analyses yet</h3>
            <p className="text-gray-600">Start by asking the AI Analyst to analyze your data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {analyticsResults.map((result) => (
              <div key={result.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 leading-snug">{result.query}</h3>
                      <p className="text-sm text-slate-500 mt-1.5">
                        {result.generatedAt instanceof Date
                          ? result.generatedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                          : new Date(String(result.generatedAt)).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg capitalize">
                        {String(result.analysisType).replace(/_/g, ' ')}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                
                <div className="bg-slate-50/80 rounded-xl p-5 mb-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3">Key metrics & results</h4>
                  <FormattedResults data={result.results} />
                </div>
                
                {result.interpretation && (
                  <div className="bg-blue-50/60 rounded-xl p-5 mb-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">Interpretation</h4>
                    <p className="text-sm text-slate-800 leading-relaxed">{result.interpretation}</p>
                  </div>
                )}
                
                {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                  <div className="bg-amber-50/80 rounded-xl p-5 border border-amber-100">
                    <h4 className="font-semibold text-amber-900 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex gap-2 text-sm text-amber-900">
                          <span className="text-amber-600 font-medium">{index + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTrashView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Trash</h1>
        <p className="text-gray-600 mb-6">Restore or permanently remove datasets.</p>
        {trashDatasets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Trash is empty</h3>
            <p className="text-gray-600">Deleted datasets will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trashDatasets.map((dataset) => (
              <div key={dataset.id} className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{dataset.name}</h3>
                  <p className="text-sm text-slate-500">{dataset.rowCount} records • {dataset.department}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onRestore?.(dataset.id)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const handleGenerateReport = async () => {
    if (!onGenerateReport) return;
    const title = reportTitle.trim() || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`;
    setReportGenerating(true);
    try {
      await onGenerateReport({ title, type: reportType, format: 'pdf' });
      setReportTitle('');
      onReportsRefresh?.();
    } finally {
      setReportGenerating(false);
    }
  };

  const renderReportsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Report title (optional)"
              className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </select>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportGenerating}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 disabled:opacity-50"
            >
              {reportGenerating ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        </div>
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
            <p className="text-gray-600 mb-4">Generate a report to summarize your analytics for the selected period.</p>
            <button type="button" onClick={handleGenerateReport} disabled={reportGenerating} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 disabled:opacity-50">
              {reportGenerating ? 'Generating…' : 'Generate first report'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{report.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {report.type} • {report.generatedAt.toLocaleString()} • {report.format.toUpperCase()}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">{report.content?.summary}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">Export {report.format.toUpperCase()} (coming soon)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
        <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-slate-500">Name</dt>
              <dd className="text-slate-900 font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Role</dt>
              <dd className="text-slate-900 capitalize">{user.role.replace(/_/g, ' ')}</dd>
            </div>
            {user.department && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Department</dt>
                <dd className="text-slate-900 capitalize">{user.department}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Preferences</h2>
          <p className="text-sm text-slate-600">Notification and display preferences will be available in a future update.</p>
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
    case 'trash':
      return renderTrashView();
    case 'reports':
      return renderReportsView();
    case 'settings':
      return renderSettingsView();
    default:
      return renderHomeView();
  }
}
