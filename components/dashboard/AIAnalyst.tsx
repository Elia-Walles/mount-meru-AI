'use client';

import { useState, useEffect } from 'react';
import { Dataset, PatientRecord } from '@/lib/api-service';
import { apiService } from '@/lib/api-service';

interface AIAnalystProps {
  selectedDataset: Dataset | null;
  patientRecords: PatientRecord[];
  onQuery: (query: string) => Promise<{ success: boolean; message: string; results: any }>;
}

export default function AIAnalyst({ selectedDataset, patientRecords, onQuery }: AIAnalystProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ query: string; results: any; timestamp: Date }>>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load query suggestions when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      loadSuggestions();
    }
  }, [selectedDataset]);

  const loadSuggestions = async () => {
    if (selectedDataset) {
      try {
        const querySuggestions = await apiService.getQuerySuggestions(selectedDataset.id);
        setSuggestions(querySuggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedDataset) return;

    setLoading(true);
    setResults(null);

    try {
      const response = await onQuery(query);
      
      if (response.success) {
        setResults(response.results);
        setHistory(prev => [{ query, results: response.results, timestamp: new Date() }, ...prev.slice(0, 9)]);
        setQuery('');
        setShowSuggestions(false);
      } else {
        setResults({ error: response.message });
      }
    } catch (error) {
      setResults({ error: 'Analysis failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const exampleQueries = [
    "Analyze OPD attendance trends by month",
    "Calculate maternal mortality ratio",
    "Detect abnormal malaria increases",
    "Compare service utilization by department",
    "Forecast OPD attendance for next 6 months",
    "Analyze top 10 causes of admission",
    "Calculate bed occupancy rate",
    "Generate weekly disease surveillance report"
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-lg md:text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">AI Hospital Analyst</h2>
              <p className="text-xs md:text-sm text-slate-600">Powered by Advanced Analytics</p>
            </div>
          </div>
          {selectedDataset && (
            <div className="text-left md:text-right">
              <p className="text-xs text-slate-500">Current Dataset</p>
              <p className="text-sm font-semibold text-blue-700">{selectedDataset.name}</p>
              <p className="text-xs text-slate-600">{patientRecords.length} records</p>
            </div>
          )}
        </div>
      </div>

      {/* Query Input */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ask me anything about your hospital data...
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedDataset ? "e.g., 'Analyze OPD attendance trends by month' or 'Calculate maternal mortality ratio'" : "Please select a dataset first"}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm shadow-sm"
              rows={3}
              disabled={!selectedDataset || loading}
            />
          </div>
          <button
            type="submit"
            disabled={!selectedDataset || !query.trim() || loading}
            className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span className="hidden sm:inline">Analyze Data</span>
                <span className="sm:hidden">Analyze</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* AI-Powered Suggestions (only when we have suggestions from API) */}
      {selectedDataset && suggestions.length > 0 && (
        <div className="p-4 md:p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            AI-Powered Suggestions:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left text-xs md:text-sm text-slate-600 hover:text-slate-800 hover:bg-blue-50 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200 border border-slate-200 hover:border-blue-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {suggestions.length > 6 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs md:text-sm text-blue-600 font-medium hover:text-blue-800 mt-4 transition-colors"
            >
              {showSuggestions ? 'Hide Suggestions' : 'Show More Suggestions'}
            </button>
          )}
          {showSuggestions && suggestions.length > 6 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {suggestions.slice(6).map((suggestion, index) => (
                <button
                  key={index + 6}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-xs md:text-sm text-slate-600 hover:text-slate-800 hover:bg-blue-50 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200 border border-slate-200 hover:border-blue-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example Queries when no dataset or when suggestions are empty */}
      {(!selectedDataset || suggestions.length === 0) && (
        <div className="p-4 md:p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            {selectedDataset ? 'Example Queries:' : 'Example Queries (select a dataset to analyze):'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {exampleQueries.slice(0, 6).map((exampleQuery, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(exampleQuery)}
                disabled={!selectedDataset}
                className="text-left text-xs md:text-sm text-slate-600 hover:text-slate-800 hover:bg-green-50 px-2 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200 border border-slate-200 hover:border-green-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exampleQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {results && (
          <div className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Analysis Results:
            </h3>
            
            {results.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm">
                <div className="flex items-center">
                  <span className="mr-2">❌</span>
                  {results.error}
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {/* Interpretation (support both normalized and raw API shape) */}
                {(results.interpretation ?? (results as Record<string, unknown>).aiAnalysis) && (
                  <div className="bg-blue-50 rounded-xl p-4 md:p-6 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                      <span className="mr-2">🧠</span>
                      Interpretation:
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {(results.interpretation ?? (results as Record<string, unknown>).aiAnalysis) as string}
                    </p>
                  </div>
                )}
                
                {/* Data Results */}
                {(results.data ?? (results as Record<string, unknown>).statisticalResults ?? (results as Record<string, unknown>).metrics) && (
                  <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="mr-2">📈</span>
                      Data Results:
                    </h4>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-auto max-h-48 md:max-h-64 bg-slate-50 p-3 md:p-4 rounded-lg text-xs md:text-sm">
                      {typeof results.data === 'object' ? 
                        JSON.stringify(results.data, null, 2) : 
                        results.data}
                    </pre>
                  </div>
                )}

                {/* Insights (raw API) */}
                {Array.isArray((results as Record<string, unknown>).insights) && ((results as Record<string, unknown>).insights as string[]).length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 md:p-6 border border-green-200">
                    <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                      <span className="mr-2">💡</span>
                      Key Insights:
                    </h4>
                    <ul className="text-sm text-green-800 space-y-2">
                      {((results as Record<string, unknown>).insights as string[]).map((insight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4 md:p-6 border border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center">
                      <span className="mr-2">🎯</span>
                      Recommendations:
                    </h4>
                    <ul className="text-sm text-amber-800 space-y-2">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-amber-600 font-semibold mt-0.5">{index + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Type */}
                {results.analysisType && (
                  <div className="text-sm text-slate-600 bg-white px-3 md:px-4 py-2 rounded-lg border border-slate-200">
                    <span className="font-medium">Analysis Type:</span> {results.analysisType}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Query History */}
        {history.length > 0 && (
          <div className="p-4 md:p-6 border-t border-slate-200 bg-white">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <span className="mr-2">🕐</span>
              Recent Queries:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {history.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-3 md:p-4 border border-slate-200 hover:border-blue-300 transition-colors">
                  <p className="text-sm font-medium text-slate-800 mb-2">{item.query}</p>
                  <p className="text-xs text-slate-500">{item.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Info */}
      <div className="p-4 md:p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          AI Capabilities:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Descriptive statistics</span>
          </div>
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Trend analysis</span>
          </div>
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Epidemiological metrics</span>
          </div>
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Outbreak detection</span>
          </div>
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Forecasting</span>
          </div>
          <div className="flex items-center gap-2 p-2 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-slate-700">Statistical tests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
