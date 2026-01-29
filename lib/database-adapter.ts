import { User, Dataset, PatientRecord, AnalyticsResult, Dashboard, Report } from './mock-database';
import { mockDB } from './mock-database';

// Try to import real database, but fall back to mock if not available
let realDB: any = null;
try {
  realDB = require('./real-database').realDB;
  console.log('✅ Real database module loaded successfully');
} catch (error) {
  console.log('Real database not available, using mock database');
}

// Database adapter that can switch between mock and real database
export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private useRealDatabase: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    // Check if we should use real database
    // Force real database for production setup
    this.useRealDatabase = process.env.NODE_ENV === 'production' || process.env.USE_REAL_DB === 'true' || true; // Force true for now
    console.log('🔧 Database mode:', this.useRealDatabase ? 'REAL DATABASE' : 'MOCK DATABASE');
    console.log('🔧 USE_REAL_DB:', process.env.USE_REAL_DB);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 FORCED REAL DATABASE FOR PRODUCTION SETUP');
  }

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  // Initialize the appropriate database
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.useRealDatabase && realDB) {
      console.log('🔧 Initializing real database (TiDB Cloud)...');
      try {
        const connected = await realDB.testConnection();
        if (connected) {
          await realDB.initialize();
          console.log('✅ Real database initialized successfully');
        } else {
          console.warn('⚠️ Real database connection failed, falling back to mock database');
          this.useRealDatabase = false;
        }
      } catch (error) {
        console.error('❌ Real database initialization failed:', error);
        console.warn('⚠️ Falling back to mock database');
        this.useRealDatabase = false;
      }
    } else {
      console.log('🔧 Using mock database');
    }

    this.isInitialized = true;
  }

  // Get current database type
  getDatabaseType(): 'mock' | 'real' {
    return this.useRealDatabase ? 'real' : 'mock';
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return this.useRealDatabase && realDB ? realDB.getUsers() : mockDB.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.useRealDatabase && realDB ? realDB.getUserById(id) : mockDB.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.useRealDatabase && realDB ? realDB.getUserByEmail(email) : mockDB.getUserByEmail(email);
  }

  async createUser(userData: Omit<User, 'id' | 'lastLogin'>): Promise<User> {
    return this.useRealDatabase && realDB ? realDB.createUser(userData) : mockDB.createUser(userData);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.useRealDatabase && realDB ? realDB.updateUser(id, updates) : mockDB.updateUser(id, updates);
  }

  // Dataset Management
  async getDatasets(userId?: string): Promise<Dataset[]> {
    return this.useRealDatabase && realDB ? realDB.getDatasets(userId) : mockDB.getDatasets(userId);
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    return this.useRealDatabase && realDB ? realDB.getDatasetById(id) : mockDB.getDatasetById(id);
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset> {
    return this.useRealDatabase && realDB ? realDB.createDataset(datasetData) : mockDB.createDataset(datasetData);
  }

  // Patient Records
  async getPatientRecords(datasetId: string): Promise<PatientRecord[]> {
    return this.useRealDatabase && realDB ? realDB.getPatientRecords(datasetId) : mockDB.getPatientRecords(datasetId);
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    return this.useRealDatabase && realDB ? realDB.addPatientRecords(records) : mockDB.addPatientRecords(records);
  }

  // Analytics
  async saveAnalyticsResult(result: Omit<AnalyticsResult, 'id' | 'generatedAt'>): Promise<AnalyticsResult> {
    return this.useRealDatabase && realDB ? realDB.saveAnalyticsResult(result) : mockDB.saveAnalyticsResult(result);
  }

  async getAnalyticsResults(datasetId?: string): Promise<AnalyticsResult[]> {
    return this.useRealDatabase && realDB ? realDB.getAnalyticsResults(datasetId) : mockDB.getAnalyticsResults(datasetId);
  }

  // Dashboards
  async getDashboards(userId?: string): Promise<Dashboard[]> {
    return this.useRealDatabase && realDB ? realDB.getDashboards(userId) : mockDB.getDashboards(userId);
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    return this.useRealDatabase && realDB ? realDB.createDashboard(dashboardData) : mockDB.createDashboard(dashboardData);
  }

  // Reports
  async getReports(userId?: string): Promise<Report[]> {
    return this.useRealDatabase && realDB ? realDB.getReports(userId) : mockDB.getReports(userId);
  }

  async saveReport(reportData: Omit<Report, 'id' | 'generatedAt'>): Promise<Report> {
    return this.useRealDatabase && realDB ? realDB.saveReport(reportData) : mockDB.saveReport(reportData);
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (this.useRealDatabase && realDB) {
      return realDB.testConnection();
    }
    return true; // Mock database is always available
  }

  // Force switch to real database
  async switchToRealDatabase(): Promise<void> {
    if (!this.useRealDatabase && realDB) {
      this.useRealDatabase = true;
      this.isInitialized = false;
      await this.initialize();
    }
  }

  // Force switch to mock database
  switchToMockDatabase(): void {
    this.useRealDatabase = false;
    this.isInitialized = true;
    console.log('🔧 Switched to mock database');
  }
}

// Export singleton instance
export const dbAdapter = DatabaseAdapter.getInstance();
