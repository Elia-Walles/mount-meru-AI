// Mock Database Simulation for Mount Meru AI Hospital Analytics Platform
// This simulates database operations without requiring actual database setup

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'data_analyst' | 'clinician' | 'me_officer' | 'medical_recorder' | 'hospital_management';
  department?: string;
  isActive: boolean;
  lastLogin: Date;
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
  patientId: string; // de-identified
  age: number;
  sex: 'male' | 'female';
  department: string;
  diagnosis: string;
  icd10Code?: string;
  serviceProvided: string;
  visitDate: Date;
  outcome: string;
  referralStatus: string;
  waitingTime?: number; // minutes
  lengthOfStay?: number; // days for IPD
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

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: 'management' | 'department' | 'weekly_review' | 'monthly_review' | 'quarterly_review' | 'annual';
  widgets: DashboardWidget[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'heatmap' | 'trend';
  title: string;
  dataSource: string;
  config: any;
  position: { x: number; y: number; width: number; height: number };
}

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: { start: Date; end: Date };
  content: {
    summary: string;
    tables: any[];
    charts: any[];
    interpretation: string;
  };
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'word' | 'excel';
}

// Mock Database Class
class MockDatabase {
  private users: User[] = [];
  private datasets: Dataset[] = [];
  private patientRecords: PatientRecord[] = [];
  private analyticsResults: AnalyticsResult[] = [];
  private dashboards: Dashboard[] = [];
  private reports: Report[] = [];

  constructor() {
    this.initializeMockData();
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'lastLogin'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      lastLogin: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  // Dataset Management
  async getDatasets(userId?: string): Promise<Dataset[]> {
    if (userId) {
      return this.datasets.filter(dataset => dataset.uploadedBy === userId);
    }
    return [...this.datasets];
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    return this.datasets.find(dataset => dataset.id === id) || null;
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset> {
    const dataset: Dataset = {
      ...datasetData,
      id: this.generateId(),
      uploadedAt: new Date()
    };
    this.datasets.push(dataset);
    return dataset;
  }

  // Patient Records
  async getPatientRecords(datasetId: string): Promise<PatientRecord[]> {
    return this.patientRecords.filter(record => record.datasetId === datasetId);
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    const newRecords = records.map(record => ({
      ...record,
      id: this.generateId()
    }));
    this.patientRecords.push(...newRecords);
    return newRecords;
  }

  // Analytics
  async saveAnalyticsResult(result: Omit<AnalyticsResult, 'id' | 'generatedAt'>): Promise<AnalyticsResult> {
    const analyticsResult: AnalyticsResult = {
      ...result,
      id: this.generateId(),
      generatedAt: new Date()
    };
    this.analyticsResults.push(analyticsResult);
    return analyticsResult;
  }

  async getAnalyticsResults(datasetId?: string): Promise<AnalyticsResult[]> {
    if (datasetId) {
      return this.analyticsResults.filter(result => result.datasetId === datasetId);
    }
    return [...this.analyticsResults];
  }

  // Dashboards
  async getDashboards(userId?: string): Promise<Dashboard[]> {
    if (userId) {
      return this.dashboards.filter(dashboard => dashboard.createdBy === userId || dashboard.isPublic);
    }
    return [...this.dashboards];
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    const dashboard: Dashboard = {
      ...dashboardData,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.dashboards.push(dashboard);
    return dashboard;
  }

  // Reports
  async getReports(userId?: string): Promise<Report[]> {
    if (userId) {
      return this.reports.filter(report => report.generatedBy === userId);
    }
    return [...this.reports];
  }

  async saveReport(reportData: Omit<Report, 'id' | 'generatedAt'>): Promise<Report> {
    const report: Report = {
      ...reportData,
      id: this.generateId(),
      generatedAt: new Date()
    };
    this.reports.push(report);
    return report;
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private initializeMockData(): void {
    // Initialize mock users
    this.users = [
      {
        id: 'admin-001',
        email: 'admin@mountmeru.ai',
        name: 'System Administrator',
        role: 'administrator',
        isActive: true,
        lastLogin: new Date()
      },
      {
        id: 'analyst-001',
        email: 'analyst@mountmeru.ai',
        name: 'Data Analyst',
        role: 'data_analyst',
        department: 'opd',
        isActive: true,
        lastLogin: new Date()
      },
      {
        id: 'clinician-001',
        email: 'doctor@mountmeru.ai',
        name: 'Dr. Sarah Mwangi',
        role: 'clinician',
        department: 'ipd',
        isActive: true,
        lastLogin: new Date()
      }
    ];

    // Initialize sample datasets
    this.datasets = [
      {
        id: 'dataset-001',
        name: 'OPD_Visits_2022_2026',
        description: 'Outpatient department visits from 2022 to 2026',
        department: 'opd',
        fileType: 'excel',
        uploadedBy: 'analyst-001',
        uploadedAt: new Date('2024-01-15'),
        rowCount: 15420,
        columns: ['patientId', 'age', 'sex', 'visitDate', 'diagnosis', 'serviceProvided', 'outcome'],
        isProcessed: true,
        tags: ['opd', 'visits', '2022-2026']
      },
      {
        id: 'dataset-002',
        name: 'IPD_Admissions_2023',
        description: 'Inpatient department admissions for 2023',
        department: 'ipd',
        fileType: 'csv',
        uploadedBy: 'clinician-001',
        uploadedAt: new Date('2024-02-01'),
        rowCount: 3240,
        columns: ['patientId', 'age', 'sex', 'admissionDate', 'diagnosis', 'lengthOfStay', 'outcome'],
        isProcessed: true,
        tags: ['ipd', 'admissions', '2023']
      }
    ];
  }
}

// Export singleton instance
export const mockDB = new MockDatabase();
