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
    <div className="w-96 bg-white border-l-2 border-slate-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b-2 border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Hospital Analyst</h2>
            <p className="text-xs text-slate-500">Powered by Llama 3.1</p>
          </div>
        </div>
      </div>

      {/* Dataset Info */}
      {selectedDataset && (
        <div className="p-4 bg-slate-50 border-b-2 border-slate-100">
          <div className="text-sm">
            <p className="font-medium text-slate-900">Current Dataset:</p>
            <p className="text-blue-700">{selectedDataset.name}</p>
            <p className="text-slate-700 text-xs">{patientRecords.length} records</p>
          </div>
        </div>
      )}

      {/* Query Input */}
      <div className="p-4 border-b-2 border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedDataset ? "Ask me anything about your hospital data..." : "Please select a dataset first"}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-none text-sm"
              rows={3}
              disabled={!selectedDataset || loading}
            />
          </div>
          <button
            type="submit"
            disabled={!selectedDataset || !query.trim() || loading}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {/* AI-Powered Suggestions (only when we have suggestions from API) */}
      {selectedDataset && suggestions.length > 0 && (
        <div className="p-4 border-b-2 border-slate-100">
          <h3 className="text-sm font-medium text-slate-700 mb-2">AI-Powered Suggestions:</h3>
          <div className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left text-xs text-gray-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {suggestions.length > 3 && (
            <>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs text-slate-700 font-semibold hover:text-slate-900 mt-2"
              >
                {showSuggestions ? 'Hide Suggestions' : 'Show More Suggestions'}
              </button>
              {showSuggestions && (
                <div className="mt-2 space-y-1">
                  {suggestions.slice(3).map((suggestion, index) => (
                    <button
                      key={index + 3}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left text-xs text-gray-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Example Queries when no dataset or when suggestions are empty */}
      {(!selectedDataset || suggestions.length === 0) && (
        <div className="p-4 border-b-2 border-slate-100">
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            {selectedDataset ? 'Example Queries:' : 'Example Queries (select a dataset to analyze):'}
          </h3>
          <div className="space-y-1">
            {exampleQueries.slice(0, 5).map((exampleQuery, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(exampleQuery)}
                disabled={!selectedDataset}
                className="w-full text-left text-xs text-gray-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exampleQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {results && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Analysis Results:</h3>
            
            {results.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {results.error}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Interpretation (support both normalized and raw API shape) */}
                {(results.interpretation ?? (results as Record<string, unknown>).aiAnalysis) && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-blue-700 mb-2">Interpretation:</h4>
                    <p className="text-xs text-slate-700">
                      {(results.interpretation ?? (results as Record<string, unknown>).aiAnalysis) as string}
                    </p>
                  </div>
                )}
                {/* Data Results */}
                {(results.data ?? (results as Record<string, unknown>).statisticalResults ?? (results as Record<string, unknown>).metrics) && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-slate-700 mb-2">Data:</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                      {typeof results.data === 'object' ? 
                        JSON.stringify(results.data, null, 2) : 
                        results.data}
                    </pre>
                  </div>
                )}

                {/* Interpretation */}
                {results.interpretation && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-blue-700 mb-2">Interpretation:</h4>
                    <p className="text-xs text-slate-700">{results.interpretation}</p>
                  </div>
                )}

                {/* Insights (raw API) */}
                {Array.isArray((results as Record<string, unknown>).insights) && ((results as Record<string, unknown>).insights as string[]).length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-slate-700 mb-2">Insights:</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {((results as Record<string, unknown>).insights as string[]).map((insight: string, idx: number) => (
                        <li key={idx}>• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-yellow-700 mb-2">Recommendations:</h4>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analysis Type */}
                {results.analysisType && (
                  <div className="text-xs text-slate-500">
                    Analysis Type: <span className="font-medium">{results.analysisType}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Query History */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Recent Queries:</h3>
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs font-medium text-slate-700">{item.query}</p>
                  <p className="text-xs text-slate-500">{item.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <h3 className="text-xs font-medium text-slate-700 mb-2">AI Capabilities:</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <div>• Descriptive statistics</div>
          <div>• Trend analysis</div>
          <div>• Epidemiological metrics</div>
          <div>• Outbreak detection</div>
          <div>• Forecasting</div>
          <div>• Statistical tests</div>
        </div>
      </div>
    </div>
  );
}
