// Shared domain types for Mount Meru AI Hospital Analytics Platform
// Used by real database and API layer

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'data_analyst' | 'clinician' | 'me_officer' | 'medical_recorder' | 'hospital_management';
  department?: string;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  department: string;
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
  results: unknown;
  interpretation: string;
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'heatmap' | 'trend';
  title: string;
  dataSource: string;
  config: unknown;
  position: { x: number; y: number; width: number; height: number };
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

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: { start: Date; end: Date };
  content: {
    summary: string;
    tables: unknown[];
    charts: unknown[];
    interpretation: string;
  };
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'word' | 'excel';
}
