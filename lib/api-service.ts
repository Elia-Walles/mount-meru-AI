// Client-side API service for database operations
import type { User, Dataset, PatientRecord, AnalyticsResult, Report, Department } from './types';

export type { User, Dataset, PatientRecord, AnalyticsResult, Report, Department };

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

  async uploadDataset(file: File, department: string, uploadedBy: string, name?: string): Promise<{ success: boolean; dataset?: Dataset; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', department);
      formData.append('uploadedBy', uploadedBy);
      if (name) formData.append('name', name);

      const response = await fetch(`${this.baseUrl}/datasets/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.dataset) {
        return {
          success: true,
          dataset: {
            ...data.dataset,
            uploadedAt: new Date(data.dataset.uploadedAt),
            columns: data.dataset.columns || [],
            tags: data.dataset.tags || []
          }
        };
      }
      return { success: false, message: data.message || 'Upload failed' };
    } catch (error) {
      console.error('Upload dataset API error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  async getTrashDatasets(userId?: string): Promise<Dataset[]> {
    try {
      const url = userId ? `${this.baseUrl}/datasets/trash?userId=${userId}` : `${this.baseUrl}/datasets/trash`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        return (data.datasets || []).map((d: any) => ({
          ...d,
          uploadedAt: new Date(d.uploadedAt),
          columns: d.columns || [],
          tags: d.tags || []
        }));
      }
      return [];
    } catch (error) {
      console.error('Get trash API error:', error);
      return [];
    }
  }

  async softDeleteDataset(id: string, userId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets/${id}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Soft delete API error:', error);
      return false;
    }
  }

  async restoreDataset(id: string, userId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Restore API error:', error);
      return false;
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

  async performAnalytics(datasetId: string, query: string, generatedBy?: string): Promise<{ success: boolean; message: string; results: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasetId, query, generatedBy }),
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

  // Reports
  async getReports(userId?: string): Promise<Report[]> {
    try {
      const url = userId ? `${this.baseUrl}/reports?userId=${userId}` : `${this.baseUrl}/reports`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.reports) {
        return data.reports.map((r: any) => ({
          ...r,
          period: { start: new Date(r.period?.start || r.periodStart), end: new Date(r.period?.end || r.periodEnd) },
          generatedAt: new Date(r.generatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Get reports API error:', error);
      return [];
    }
  }

  async generateReport(params: { title: string; type: string; generatedBy: string; format?: string }): Promise<Report | null> {
    try {
      const response = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (data.success && data.report) {
        const r = data.report;
        return {
          ...r,
          period: { start: new Date(r.period?.start), end: new Date(r.period?.end) },
          generatedAt: new Date(r.generatedAt),
          content: r.content || {},
        };
      }
      return null;
    } catch (error) {
      console.error('Generate report API error:', error);
      return null;
    }
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await fetch(`${this.baseUrl}/departments`);
      const data = await response.json();
      
      if (data.success) {
        return data.departments.map((dept: any) => ({
          ...dept,
          createdAt: new Date(dept.createdAt),
          updatedAt: new Date(dept.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Get departments API error:', error);
      return [];
    }
  }

  async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department | null> {
    try {
      const response = await fetch(`${this.baseUrl}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      });

      const data = await response.json();
      
      if (data.success && data.department) {
        const dept = data.department;
        return {
          ...dept,
          createdAt: new Date(dept.createdAt),
          updatedAt: new Date(dept.updatedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Create department API error:', error);
      return null;
    }
  }

  async updateDepartment(id: string, updates: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Update department API error:', error);
      return false;
    }
  }

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/departments/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Delete department API error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
