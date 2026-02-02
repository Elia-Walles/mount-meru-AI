// Production: require real MySQL2 driver (no stub)
const mysql = require('mysql2/promise');

import fs from 'fs';
import path from 'path';

// Build SSL config: use cert file if present, otherwise rely on system CAs (rejectUnauthorized: true)
function getSslConfig(): { ca?: Buffer; rejectUnauthorized: boolean } {
  const certPath = path.join(process.cwd(), 'certs', 'isrgrootx1.pem');
  try {
    if (fs.existsSync(certPath)) {
      return { ca: fs.readFileSync(certPath), rejectUnauthorized: true };
    }
  } catch {
    // ignore
  }
  // TiDB Cloud accepts connections with system CA bundle
  return { rejectUnauthorized: true };
}

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DATABASE_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DATABASE_PORT || '4000', 10),
  user: process.env.DATABASE_USERNAME || '2yYx8Tpj48B2C7P.root',
  password: process.env.DATABASE_PASSWORD || 'jaaz5rUzgezbwOW8',
  database: process.env.DATABASE_NAME || 'mount_meru',
  ssl: getSslConfig(),
  connectionLimit: 10,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database connection class
export class Database {
  private static instance: Database;
  private pool: any;

  private constructor() {
    this.pool = pool;
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // Execute query with parameters
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      if (!this.pool) throw new Error('Database pool not available');
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Execute single query and return first result
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const rows = await this.query<T>(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Execute insert query and return insert ID
  async insert(sql: string, params?: any[]): Promise<number> {
    try {
      if (!this.pool) throw new Error('Database pool not available');
      const [result] = await this.pool.execute(sql, params);
      const insertResult = result as any;
      return insertResult.insertId;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  // Execute update/delete query and return affected rows
  async execute(sql: string, params?: any[]): Promise<number> {
    try {
      if (!this.pool) throw new Error('Database pool not available');
      const [result] = await this.pool.execute(sql, params);
      const executeResult = result as any;
      return executeResult.affectedRows;
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  // Begin transaction
  async beginTransaction(): Promise<any> {
    if (!this.pool) throw new Error('Database pool not available');
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  // Commit transaction
  async commit(connection: any): Promise<void> {
    await connection.commit();
    connection.release();
  }

  // Rollback transaction
  async rollback(connection: any): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  // Close connection pool
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Export singleton instance
export const db = Database.getInstance();

// Database schema initialization
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔧 Initializing database schema...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('administrator', 'data_analyst', 'clinician', 'me_officer', 'medical_recorder', 'hospital_management') NOT NULL,
        department VARCHAR(100),
        password_hash VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create datasets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        department ENUM('opd', 'ipd', 'laboratory', 'pharmacy', 'rch', 'theatre', 'mortuary') NOT NULL,
        file_type ENUM('excel', 'csv', 'tsv', 'pdf', 'image', 'bulk') NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        row_count INT DEFAULT 0,
        columns JSON,
        is_processed BOOLEAN DEFAULT FALSE,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create patient_records table
    await db.query(`
      CREATE TABLE IF NOT EXISTS patient_records (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        dataset_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(50) NOT NULL,
        age INT NOT NULL,
        sex ENUM('male', 'female') NOT NULL,
        department VARCHAR(50) NOT NULL,
        diagnosis VARCHAR(255) NOT NULL,
        icd10_code VARCHAR(10),
        service_provided VARCHAR(255) NOT NULL,
        visit_date DATE NOT NULL,
        outcome VARCHAR(100) NOT NULL,
        referral_status VARCHAR(50) DEFAULT 'Not Referred',
        waiting_time INT,
        length_of_stay INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
        INDEX idx_dataset_id (dataset_id),
        INDEX idx_visit_date (visit_date),
        INDEX idx_diagnosis (diagnosis),
        INDEX idx_department (department)
      )
    `);

    // Create analytics_results table
    await db.query(`
      CREATE TABLE IF NOT EXISTS analytics_results (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        dataset_id VARCHAR(36) NOT NULL,
        analysis_type ENUM('descriptive', 'trend', 'epidemiological', 'statistical', 'surveillance', 'forecasting') NOT NULL,
        query TEXT NOT NULL,
        results JSON,
        interpretation TEXT,
        recommendations JSON,
        generated_by VARCHAR(36) NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_dataset_id (dataset_id),
        INDEX idx_analysis_type (analysis_type)
      )
    `);

    // Create dashboards table
    await db.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('management', 'department', 'weekly_review', 'monthly_review', 'quarterly_review', 'annual') NOT NULL,
        widgets JSON,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_public BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create reports table
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom') NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        content JSON,
        generated_by VARCHAR(36) NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        format ENUM('pdf', 'word', 'excel') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Verification tokens for email verification
    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        token VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires_at)
      )
    `);

    // Reset tokens for password reset
    await db.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        token VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires_at)
      )
    `);

    // Add password_hash to users if missing (migration for existing deployments)
    try {
      await db.query(
        `ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL`
      );
      console.log('✅ Added password_hash column to users');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
      if (msg !== 'ER_DUP_FIELDNAME') throw e;
    }

    // Add deleted_at to datasets for soft delete / Trash
    try {
      await db.query(
        `ALTER TABLE datasets ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`
      );
      console.log('✅ Added deleted_at column to datasets');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
      if (msg !== 'ER_DUP_FIELDNAME') throw e;
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error);
    throw error;
  }
}

// Seed initial data
export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding initial data...');

    // Check if users already exist
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers.length > 0 ? (existingUsers[0] as any).count : 0;

    if (userCount === 0) {
      // Insert demo users
      await db.query(`
        INSERT INTO users (id, email, name, role, department, is_active) VALUES
        ('admin-001', 'admin@mountmeru.ai', 'System Administrator', 'administrator', NULL, TRUE),
        ('analyst-001', 'analyst@mountmeru.ai', 'Data Analyst', 'data_analyst', 'opd', TRUE),
        ('clinician-001', 'doctor@mountmeru.ai', 'Dr. Sarah Mwangi', 'clinician', 'ipd', TRUE)
      `);

      console.log('✅ Demo users created');
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}
