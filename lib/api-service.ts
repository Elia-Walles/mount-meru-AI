// Client-side API service for database operations
// This replaces direct database imports with API calls

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'data_analyst' | 'clinician' | 'me_officer' | 'medical_recorder' | 'hospital_management';
  department?: string;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  department: 'opd' | 'ipd' | 'laboratory' | 'pharmacy' | 'rch' | 'theatre' | 'mortuary';
  fileType: 'excel' | 'csv' | 'tsv' | 'pdf' | 'image' | 'bulk';
  uploadedBy: string;
  uploadedAt: Date;
  rowCount: number;
  columns: string[];
  isProcessed: boolean;
  tags: string[];
}

export interface PatientRecord {
  id: string;
  datasetId: string;
  patientId: string;
  age: number;
  sex: 'male' | 'female';
  department: string;
  diagnosis: string;
  icd10Code?: string;
  serviceProvided: string;
  visitDate: Date;
  outcome: string;
  referralStatus: string;
  waitingTime?: number;
  lengthOfStay?: number;
}

export interface AnalyticsResult {
  id: string;
  datasetId: string;
  analysisType: 'descriptive' | 'trend' | 'epidemiological' | 'statistical' | 'surveillance' | 'forecasting';
  query: string;
  results: any;
  interpretation: string;
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

class ApiService {
  private baseUrl = '/api';

  // Authentication
  async login(email: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  // Datasets
  async getDatasets(userId?: string): Promise<Dataset[]> {
    try {
      const url = userId ? `${this.baseUrl}/datasets?userId=${userId}` : `${this.baseUrl}/datasets`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.datasets.map((dataset: any) => ({
          ...dataset,
          uploadedAt: new Date(dataset.uploadedAt),
          columns: dataset.columns || [],
          tags: dataset.tags || []
        }));
      }
      return [];
    } catch (error) {
      console.error('Get datasets API error:', error);
      return [];
    }
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          ...data.dataset,
          uploadedAt: new Date(data.dataset.uploadedAt),
          columns: data.dataset.columns || [],
          tags: data.dataset.tags || []
        };
      }
      return null;
    } catch (error) {
      console.error('Get dataset API error:', error);
      return null;
    }
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetData),
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          ...data.dataset,
          uploadedAt: new Date(data.dataset.uploadedAt),
          columns: data.dataset.columns || [],
          tags: data.dataset.tags || []
        };
      }
      return null;
    } catch (error) {
      console.error('Create dataset API error:', error);
      return null;
    }
  }

  // Patient Records
  async getPatientRecords(datasetId: string): Promise<PatientRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/records`);
      const data = await response.json();
      
      if (data.success) {
        return data.records.map((record: any) => ({
          ...record,
          visitDate: new Date(record.visitDate)
        }));
      }
      return [];
    } catch (error) {
      console.error('Get patient records API error:', error);
      return [];
    }
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    try {
      const datasetId = records[0]?.datasetId;
      if (!datasetId) return [];

      const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(records),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.records.map((record: any) => ({
          ...record,
          visitDate: new Date(record.visitDate)
        }));
      }
      return [];
    } catch (error) {
      console.error('Add patient records API error:', error);
      return [];
    }
  }

  // Analytics
  async getAnalyticsResults(datasetId?: string): Promise<AnalyticsResult[]> {
    try {
      const url = datasetId ? `${this.baseUrl}/analytics?datasetId=${datasetId}` : `${this.baseUrl}/analytics`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.results.map((result: any) => ({
          ...result,
          generatedAt: new Date(result.generatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Get analytics results API error:', error);
      return [];
    }
  }

  async performAnalytics(datasetId: string, query: string): Promise<{ success: boolean; message: string; results: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasetId, query }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Perform analytics API error:', error);
      return { success: false, message: 'Network error occurred', results: null };
    }
  }

  // Initialize database (server-side only)
  async initializeDatabase(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/init`, {
        method: 'POST',
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Initialize database API error:', error);
      return false;
    }
  }

  // Query suggestions and validation
  async getQuerySuggestions(datasetId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasetId }),
      });

      const data = await response.json();
      return data.success ? data.suggestions : [];
    } catch (error) {
      console.error('Get query suggestions API error:', error);
      return [
        'Analyze overall trends',
        'Calculate key performance indicators',
        'Identify seasonal patterns',
        'Compare department performance',
        'Generate summary statistics'
      ];
    }
  }

  async validateQuery(query: string): Promise<{ isValid: boolean; suggestions?: string[]; clarification?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/suggestions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      return data.success ? data.validation : { isValid: true };
    } catch (error) {
      console.error('Validate query API error:', error);
      return { isValid: true };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
