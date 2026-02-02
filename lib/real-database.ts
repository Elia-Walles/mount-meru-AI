import crypto from 'crypto';
import { db, initializeDatabase, seedDatabase } from './database';
import { User, Dataset, PatientRecord, AnalyticsResult, Dashboard, Report, DashboardWidget } from './types';

/** Parse JSON column: driver may return already-parsed object/array (e.g. MySQL JSON type). */
function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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

  async getPasswordHashByEmail(email: string): Promise<string | null> {
    const row = await db.queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE email = ?`,
      [email]
    );
    return row?.password_hash ?? null;
  }

  async createUser(
    userData: Omit<User, 'id' | 'lastLogin'> & { passwordHash?: string }
  ): Promise<User> {
    await db.insert(
      `INSERT INTO users (email, name, role, department, password_hash, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userData.email,
        userData.name,
        userData.role,
        userData.department ?? null,
        (userData as { passwordHash?: string }).passwordHash ?? null,
        userData.isActive,
      ]
    );
    // id is UUID() from DB, so fetch by email to get the created row
    const user = await this.getUserByEmail(userData.email);
    if (!user) throw new Error('Failed to retrieve created user');
    return user;
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
    const baseSelect = `SELECT id, name, description, department, file_type as fileType, uploaded_by as uploadedBy,
              uploaded_at as uploadedAt, row_count as rowCount, columns, is_processed as isProcessed, tags
       FROM datasets 
       WHERE deleted_at IS NULL`;
    const query = userId
      ? `${baseSelect} AND uploaded_by = ? ORDER BY uploaded_at DESC`
      : `${baseSelect} ORDER BY uploaded_at DESC`;
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
      columns: parseJson(row.columns, []),
      tags: parseJson(row.tags, []),
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
      columns: parseJson(row.columns, []),
      tags: parseJson(row.tags, []),
      isProcessed: row.isProcessed
    };
  }

  async createDataset(datasetData: Omit<Dataset, 'id' | 'uploadedAt'>): Promise<Dataset> {
    const id = crypto.randomUUID();
    await db.execute(`
      INSERT INTO datasets (id, name, description, department, file_type, uploaded_by, row_count, columns, is_processed, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
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
    return await this.getDatasetById(id) as Dataset;
  }

  async softDeleteDataset(id: string, userId?: string): Promise<boolean> {
    const where = userId ? 'id = ? AND uploaded_by = ?' : 'id = ?';
    const params = userId ? [id, userId] : [id];
    const n = await db.execute(
      `UPDATE datasets SET deleted_at = CURRENT_TIMESTAMP WHERE ${where}`,
      params
    );
    return n > 0;
  }

  async restoreDataset(id: string, userId?: string): Promise<boolean> {
    const where = userId ? 'id = ? AND uploaded_by = ?' : 'id = ?';
    const params = userId ? [id, userId] : [id];
    const n = await db.execute(
      `UPDATE datasets SET deleted_at = NULL WHERE ${where}`,
      params
    );
    return n > 0;
  }

  async getTrashDatasets(userId?: string): Promise<Dataset[]> {
    const baseSelect = `SELECT id, name, description, department, file_type as fileType, uploaded_by as uploadedBy,
              uploaded_at as uploadedAt, row_count as rowCount, columns, is_processed as isProcessed, tags
       FROM datasets 
       WHERE deleted_at IS NOT NULL`;
    const query = userId
      ? `${baseSelect} AND uploaded_by = ? ORDER BY deleted_at DESC`
      : `${baseSelect} ORDER BY deleted_at DESC`;
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
      columns: parseJson(row.columns, []),
      tags: parseJson(row.tags, []),
      isProcessed: row.isProcessed
    }));
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

  /** Format date for MySQL DATE column (YYYY-MM-DD). */
  private formatDateForDb(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async addPatientRecords(records: Omit<PatientRecord, 'id'>[]): Promise<PatientRecord[]> {
    if (records.length === 0) return [];

    const BATCH_SIZE = 500;
    const datasetId = records[0].datasetId;

    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      const batch = records.slice(start, start + BATCH_SIZE);
      const values = batch.map(record => [
        record.datasetId,
        String(record.patientId).slice(0, 50),
        Math.min(120, Math.max(0, record.age)),
        record.sex,
        String(record.department).slice(0, 50),
        String(record.diagnosis).slice(0, 255),
        record.icd10Code ? String(record.icd10Code).slice(0, 10) : null,
        String(record.serviceProvided).slice(0, 255),
        record.visitDate instanceof Date ? this.formatDateForDb(record.visitDate) : this.formatDateForDb(new Date(record.visitDate)),
        String(record.outcome).slice(0, 100),
        String(record.referralStatus).slice(0, 50),
        record.waitingTime ?? null,
        record.lengthOfStay ?? null
      ]);

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await db.execute(`
        INSERT INTO patient_records 
        (dataset_id, patient_id, age, sex, department, diagnosis, icd10_code, service_provided,
         visit_date, outcome, referral_status, waiting_time, length_of_stay)
        VALUES ${placeholders}
      `, flatValues);
    }

    return await this.getPatientRecords(datasetId);
  }

  // Analytics
  async saveAnalyticsResult(result: Omit<AnalyticsResult, 'id' | 'generatedAt'>): Promise<AnalyticsResult> {
    const id = crypto.randomUUID();
    await db.execute(`
      INSERT INTO analytics_results (id, dataset_id, analysis_type, query, results, interpretation, recommendations, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      result.datasetId,
      result.analysisType,
      result.query,
      JSON.stringify(result.results),
      result.interpretation,
      JSON.stringify(result.recommendations),
      result.generatedBy
    ]);
    return await this.getAnalyticsResultById(id) as AnalyticsResult;
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
      results: parseJson(row.results, {}),
      interpretation: row.interpretation,
      recommendations: parseJson(row.recommendations, [])
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
      results: parseJson(row.results, {}),
      interpretation: row.interpretation,
      recommendations: parseJson(row.recommendations, [])
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
      widgets: parseJson(row.widgets, [])
    }));
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    const id = crypto.randomUUID();
    await db.execute(`
      INSERT INTO dashboards (id, name, description, type, widgets, created_by, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      dashboardData.name,
      dashboardData.description,
      dashboardData.type,
      JSON.stringify(dashboardData.widgets),
      dashboardData.createdBy,
      dashboardData.isPublic
    ]);
    return await this.getDashboardById(id) as Dashboard;
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
      widgets: parseJson(row.widgets, [])
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
      content: parseJson(row.content, {})
    }));
  }

  async saveReport(reportData: Omit<Report, 'id' | 'generatedAt'>): Promise<Report> {
    const id = crypto.randomUUID();
    await db.execute(`
      INSERT INTO reports (id, title, type, period_start, period_end, content, generated_by, format)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      reportData.title,
      reportData.type,
      reportData.period.start,
      reportData.period.end,
      JSON.stringify(reportData.content),
      reportData.generatedBy,
      reportData.format
    ]);
    return await this.getReportById(id) as Report;
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
      content: parseJson(row.content, {})
    };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    return await db.testConnection();
  }

  // Verification tokens (email verification)
  async createVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await db.execute(
      `INSERT INTO verification_tokens (token, email, expires_at) VALUES (?, ?, ?)`,
      [token, email, expiresAt]
    );
  }

  async getEmailByVerificationToken(token: string): Promise<string | null> {
    const row = await db.queryOne<{ email: string; expires_at: Date }>(
      `SELECT email, expires_at FROM verification_tokens WHERE token = ?`,
      [token]
    );
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) return null;
    return row.email;
  }

  async deleteVerificationToken(token: string): Promise<void> {
    await db.execute(`DELETE FROM verification_tokens WHERE token = ?`, [token]);
  }

  // Reset tokens (password reset)
  async createResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await db.execute(
      `INSERT INTO reset_tokens (token, email, expires_at) VALUES (?, ?, ?)`,
      [token, email, expiresAt]
    );
  }

  async getEmailByResetToken(token: string): Promise<string | null> {
    const row = await db.queryOne<{ email: string; expires_at: Date }>(
      `SELECT email, expires_at FROM reset_tokens WHERE token = ?`,
      [token]
    );
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) return null;
    return row.email;
  }

  async deleteResetToken(token: string): Promise<void> {
    await db.execute(`DELETE FROM reset_tokens WHERE token = ?`, [token]);
  }

  async updateUserPassword(email: string, passwordHash: string): Promise<void> {
    await db.execute(`UPDATE users SET password_hash = ? WHERE email = ?`, [passwordHash, email]);
  }
}

// Export singleton instance
export const realDB = RealDatabase.getInstance();
