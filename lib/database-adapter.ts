// Production database adapter - uses real database only
import type { User, Dataset, PatientRecord, AnalyticsResult, Dashboard, Report } from './types';
import { realDB } from './real-database';

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    const connected = await realDB.testConnection();
    if (!connected) {
      throw new Error('Database connection failed. Check DATABASE_* environment variables.');
    }
    await realDB.initialize();
    this.isInitialized = true;
    console.log('✅ Database connected and initialized');
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return realDB.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return realDB.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return realDB.getUserByEmail(email);
  }

  async getPasswordHashByEmail(email: string): Promise<string | null> {
    return realDB.getPasswordHashByEmail(email);
  }

  async createUser(
    userData: Omit<User, 'id' | 'lastLogin'> & { passwordHash?: string }
  ): Promise<User> {
    return realDB.createUser(userData);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return realDB.updateUser(id, updates);
  }

  // Dataset Management
  async getDatasets(userId?: string): Promise<Dataset[]> {
    return realDB.getDatasets(userId);
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    return realDB.getDatasetById(id);
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset> {
    return realDB.createDataset(datasetData);
  }

  async softDeleteDataset(id: string, userId?: string): Promise<boolean> {
    return realDB.softDeleteDataset(id, userId);
  }

  async restoreDataset(id: string, userId?: string): Promise<boolean> {
    return realDB.restoreDataset(id, userId);
  }

  async getTrashDatasets(userId?: string): Promise<Dataset[]> {
    return realDB.getTrashDatasets(userId);
  }

  // Patient Records
  async getPatientRecords(datasetId: string): Promise<PatientRecord[]> {
    return realDB.getPatientRecords(datasetId);
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    return realDB.addPatientRecords(records);
  }

  // Analytics
  async saveAnalyticsResult(result: Omit<AnalyticsResult, 'id' | 'generatedAt'>): Promise<AnalyticsResult> {
    return realDB.saveAnalyticsResult(result);
  }

  async getAnalyticsResults(datasetId?: string): Promise<AnalyticsResult[]> {
    return realDB.getAnalyticsResults(datasetId);
  }

  // Dashboards
  async getDashboards(userId?: string): Promise<Dashboard[]> {
    return realDB.getDashboards(userId);
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    return realDB.createDashboard(dashboardData);
  }

  // Reports
  async getReports(userId?: string): Promise<Report[]> {
    return realDB.getReports(userId);
  }

  async saveReport(reportData: Omit<Report, 'id' | 'generatedAt'>): Promise<Report> {
    return realDB.saveReport(reportData);
  }

  async testConnection(): Promise<boolean> {
    return realDB.testConnection();
  }

  async createVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
    return realDB.createVerificationToken(email, token, expiresAt);
  }

  async getEmailByVerificationToken(token: string): Promise<string | null> {
    return realDB.getEmailByVerificationToken(token);
  }

  async deleteVerificationToken(token: string): Promise<void> {
    return realDB.deleteVerificationToken(token);
  }

  async createResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    return realDB.createResetToken(email, token, expiresAt);
  }

  async getEmailByResetToken(token: string): Promise<string | null> {
    return realDB.getEmailByResetToken(token);
  }

  async deleteResetToken(token: string): Promise<void> {
    return realDB.deleteResetToken(token);
  }

  async updateUserPassword(email: string, passwordHash: string): Promise<void> {
    return realDB.updateUserPassword(email, passwordHash);
  }
}

export const dbAdapter = DatabaseAdapter.getInstance();
