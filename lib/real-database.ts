import { db, initializeDatabase, seedDatabase } from './database';
import { User, Dataset, PatientRecord, AnalyticsResult, Dashboard, Report, DashboardWidget } from './mock-database';

// Real Database Implementation using TiDB Cloud
export class RealDatabase {
  private static instance: RealDatabase;

  private constructor() {}

  public static getInstance(): RealDatabase {
    if (!RealDatabase.instance) {
      RealDatabase.instance = new RealDatabase();
    }
    return RealDatabase.instance;
  }

  // Initialize database
  async initialize(): Promise<void> {
    await initializeDatabase();
    await seedDatabase();
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const rows = await db.query<any[]>(`
      SELECT id, email, name, role, department, is_active as isActive, last_login as lastLogin
      FROM users
      ORDER BY created_at DESC
    `);
    
    return rows.map((row: any) => ({
      ...row,
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : null
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    const row = await db.queryOne<any>(`
      SELECT id, email, name, role, department, is_active as isActive, last_login as lastLogin
      FROM users
      WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      ...row,
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : null
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = await db.queryOne<any>(`
      SELECT id, email, name, role, department, is_active as isActive, last_login as lastLogin
      FROM users
      WHERE email = ?
    `, [email]);
    
    if (!row) return null;
    
    return {
      ...row,
      lastLogin: row.lastLogin ? new Date(row.lastLogin) : null
    };
  }

  async createUser(userData: Omit<User, 'id' | 'lastLogin'>): Promise<User> {
    const insertId = await db.insert(`
      INSERT INTO users (email, name, role, department, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [userData.email, userData.name, userData.role, userData.department, userData.isActive]);
    
    return await this.getUserById(insertId.toString()) as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.department !== undefined) {
      fields.push('department = ?');
      values.push(updates.department);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive);
    }
    if (updates.lastLogin) {
      fields.push('last_login = ?');
      values.push(updates.lastLogin);
    }

    if (fields.length > 0) {
      values.push(id);
      await db.execute(`
        UPDATE users SET ${fields.join(', ')}
        WHERE id = ?
      `, values);
    }

    return await this.getUserById(id);
  }

  // Dataset Management
  async getDatasets(userId?: string): Promise<Dataset[]> {
    const query = userId ? 
      `SELECT id, name, description, department, file_type as fileType, uploaded_by as uploadedBy,
              uploaded_at as uploadedAt, row_count as rowCount, columns, is_processed as isProcessed, tags
       FROM datasets 
       WHERE uploaded_by = ?
       ORDER BY uploaded_at DESC` :
      `SELECT id, name, description, department, file_type as fileType, uploaded_by as uploadedBy,
              uploaded_at as uploadedAt, row_count as rowCount, columns, is_processed as isProcessed, tags
       FROM datasets 
       ORDER BY uploaded_at DESC`;
    
    const params = userId ? [userId] : [];
    const rows = await db.query<any[]>(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      department: row.department,
      fileType: row.fileType,
      uploadedBy: row.uploadedBy,
      uploadedAt: new Date(row.uploadedAt),
      rowCount: row.rowCount,
      columns: JSON.parse(row.columns || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      isProcessed: row.isProcessed
    }));
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    const row = await db.queryOne<any>(`
      SELECT id, name, description, department, file_type as fileType, uploaded_by as uploadedBy,
             uploaded_at as uploadedAt, row_count as rowCount, columns, is_processed as isProcessed, tags
      FROM datasets
      WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      department: row.department,
      fileType: row.fileType,
      uploadedBy: row.uploadedBy,
      uploadedAt: new Date(row.uploadedAt),
      rowCount: row.rowCount,
      columns: JSON.parse(row.columns || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      isProcessed: row.isProcessed
    };
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset> {
    const insertId = await db.insert(`
      INSERT INTO datasets (name, description, department, file_type, uploaded_by, row_count, columns, is_processed, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      datasetData.name,
      datasetData.description,
      datasetData.department,
      datasetData.fileType,
      datasetData.uploadedBy,
      datasetData.rowCount,
      JSON.stringify(datasetData.columns),
      datasetData.isProcessed,
      JSON.stringify(datasetData.tags)
    ]);
    
    return await this.getDatasetById(insertId.toString()) as Dataset;
  }

  // Patient Records
  async getPatientRecords(datasetId: string): Promise<PatientRecord[]> {
    const rows = await db.query<any[]>(`
      SELECT id, dataset_id as datasetId, patient_id as patientId, age, sex, department,
             diagnosis, icd10_code as icd10Code, service_provided as serviceProvided,
             visit_date as visitDate, outcome, referral_status as referralStatus,
             waiting_time as waitingTime, length_of_stay as lengthOfStay
      FROM patient_records
      WHERE dataset_id = ?
      ORDER BY visit_date DESC
    `, [datasetId]);
    
    return rows.map((row: any) => ({
      id: row.id,
      datasetId: row.datasetId,
      patientId: row.patientId,
      age: row.age,
      sex: row.sex,
      department: row.department,
      diagnosis: row.diagnosis,
      icd10Code: row.icd10Code,
      serviceProvided: row.serviceProvided,
      visitDate: new Date(row.visitDate),
      outcome: row.outcome,
      referralStatus: row.referralStatus,
      waitingTime: row.waitingTime,
      lengthOfStay: row.lengthOfStay
    }));
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    if (records.length === 0) return [];

    const values = records.map(record => [
      record.datasetId,
      record.patientId,
      record.age,
      record.sex,
      record.department,
      record.diagnosis,
      record.icd10Code,
      record.serviceProvided,
      record.visitDate,
      record.outcome,
      record.referralStatus,
      record.waitingTime,
      record.lengthOfStay
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await db.execute(`
      INSERT INTO patient_records 
      (dataset_id, patient_id, age, sex, department, diagnosis, icd10_code, service_provided,
       visit_date, outcome, referral_status, waiting_time, length_of_stay)
      VALUES ${placeholders}
    `, flatValues);

    // Return the inserted records
    const datasetId = records[0].datasetId;
    return await this.getPatientRecords(datasetId);
  }

  // Analytics
  async saveAnalyticsResult(result: Omit<AnalyticsResult, 'id' | 'generatedAt'>): Promise<AnalyticsResult> {
    const insertId = await db.insert(`
      INSERT INTO analytics_results (dataset_id, analysis_type, query, results, interpretation, recommendations, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      result.datasetId,
      result.analysisType,
      result.query,
      JSON.stringify(result.results),
      result.interpretation,
      JSON.stringify(result.recommendations),
      result.generatedBy
    ]);
    
    return await this.getAnalyticsResultById(insertId.toString()) as AnalyticsResult;
  }

  async getAnalyticsResults(datasetId?: string): Promise<AnalyticsResult[]> {
    const query = datasetId ? 
      `SELECT id, dataset_id as datasetId, analysis_type as analysisType, query, results, interpretation,
              recommendations, generated_by as generatedBy, generated_at as generatedAt
       FROM analytics_results 
       WHERE dataset_id = ?
       ORDER BY generated_at DESC` :
      `SELECT id, dataset_id as datasetId, analysis_type as analysisType, query, results, interpretation,
              recommendations, generated_by as generatedBy, generated_at as generatedAt
       FROM analytics_results 
       ORDER BY generated_at DESC`;
    
    const params = datasetId ? [datasetId] : [];
    const rows = await db.query<any[]>(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      datasetId: row.datasetId,
      analysisType: row.analysisType,
      query: row.query,
      generatedAt: new Date(row.generatedAt),
      generatedBy: row.generatedBy,
      results: JSON.parse(row.results || '{}'),
      interpretation: row.interpretation,
      recommendations: JSON.parse(row.recommendations || '[]')
    }));
  }

  async getAnalyticsResultById(id: string): Promise<AnalyticsResult | null> {
    const row = await db.queryOne<any>(`
      SELECT id, dataset_id as datasetId, analysis_type as analysisType, query, results, interpretation,
             recommendations, generated_by as generatedBy, generated_at as generatedAt
      FROM analytics_results
      WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      datasetId: row.datasetId,
      analysisType: row.analysisType,
      query: row.query,
      generatedAt: new Date(row.generatedAt),
      generatedBy: row.generatedBy,
      results: JSON.parse(row.results || '{}'),
      interpretation: row.interpretation,
      recommendations: JSON.parse(row.recommendations || '[]')
    };
  }

  // Dashboards
  async getDashboards(userId?: string): Promise<Dashboard[]> {
    const query = userId ? 
      `SELECT id, name, description, type, widgets, created_by as createdBy, created_at as createdAt, is_public as isPublic
       FROM dashboards 
       WHERE created_by = ? OR is_public = TRUE
       ORDER BY created_at DESC` :
      `SELECT id, name, description, type, widgets, created_by as createdBy, created_at as createdAt, is_public as isPublic
       FROM dashboards 
       ORDER BY created_at DESC`;
    
    const params = userId ? [userId] : [];
    const rows = await db.query<any[]>(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      createdAt: new Date(row.createdAt),
      createdBy: row.createdBy,
      isPublic: row.isPublic,
      widgets: JSON.parse(row.widgets || '[]')
    }));
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    const insertId = await db.insert(`
      INSERT INTO dashboards (name, description, type, widgets, created_by, is_public)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      dashboardData.name,
      dashboardData.description,
      dashboardData.type,
      JSON.stringify(dashboardData.widgets),
      dashboardData.createdBy,
      dashboardData.isPublic
    ]);
    
    return await this.getDashboardById(insertId.toString()) as Dashboard;
  }

  async getDashboardById(id: string): Promise<Dashboard | null> {
    const row = await db.queryOne<any>(`
      SELECT id, name, description, type, widgets, created_by as createdBy, created_at as createdAt, is_public as isPublic
      FROM dashboards
      WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      createdAt: new Date(row.createdAt),
      createdBy: row.createdBy,
      isPublic: row.isPublic,
      widgets: JSON.parse(row.widgets || '[]')
    };
  }

  // Reports
  async getReports(userId?: string): Promise<Report[]> {
    const query = userId ? 
      `SELECT id, title, type, period_start as periodStart, period_end as periodEnd, content,
              generated_by as generatedBy, generated_at as generatedAt, format
       FROM reports 
       WHERE generated_by = ?
       ORDER BY generated_at DESC` :
      `SELECT id, title, type, period_start as periodStart, period_end as periodEnd, content,
              generated_by as generatedBy, generated_at as generatedAt, format
       FROM reports 
       ORDER BY generated_at DESC`;
    
    const params = userId ? [userId] : [];
    const rows = await db.query<any[]>(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      period: {
        start: new Date(row.periodStart),
        end: new Date(row.periodEnd)
      },
      generatedAt: new Date(row.generatedAt),
      generatedBy: row.generatedBy,
      format: row.format,
      content: JSON.parse(row.content || '{}')
    }));
  }

  async saveReport(reportData: Omit<Report, 'id' | 'generatedAt'>): Promise<Report> {
    const insertId = await db.insert(`
      INSERT INTO reports (title, type, period_start, period_end, content, generated_by, format)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      reportData.title,
      reportData.type,
      reportData.period.start,
      reportData.period.end,
      JSON.stringify(reportData.content),
      reportData.generatedBy,
      reportData.format
    ]);
    
    return await this.getReportById(insertId.toString()) as Report;
  }

  async getReportById(id: string): Promise<Report | null> {
    const row = await db.queryOne<any>(`
      SELECT id, title, type, period_start as periodStart, period_end as periodEnd, content,
             generated_by as generatedBy, generated_at as generatedAt, format
      FROM reports
      WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      period: {
        start: new Date(row.periodStart),
        end: new Date(row.periodEnd)
      },
      generatedAt: new Date(row.generatedAt),
      generatedBy: row.generatedBy,
      format: row.format,
      content: JSON.parse(row.content || '{}')
    };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    return await db.testConnection();
  }
}

// Export singleton instance
export const realDB = RealDatabase.getInstance();
