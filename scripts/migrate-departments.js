const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DATABASE_PORT || '4000', 10),
  user: process.env.DATABASE_USERNAME || '2yYx8Tpj48B2C7P.root',
  password: process.env.DATABASE_PASSWORD || 'jaaz5rUzgezbwOW8',
  database: process.env.DATABASE_NAME || 'mount_meru',
  ssl: getSslConfig(),
  connectionLimit: 10,
};

// SSL configuration
function getSslConfig() {
  const certPath = path.join(process.cwd(), 'certs', 'isrgrootx1.pem');
  try {
    if (fs.existsSync(certPath)) {
      return { ca: fs.readFileSync(certPath), rejectUnauthorized: true };
    }
  } catch {
    // ignore
  }
  return { rejectUnauthorized: true };
}

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Running departments table migration...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Create departments table without icon field
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_departments_active (is_active),
        INDEX idx_departments_sort (sort_order)
      )
    `);
    console.log('✅ Created departments table (without icon field)');

    // Insert default departments without icons
    await connection.execute(`
      INSERT INTO departments (id, name, description, sort_order) VALUES
      ('opd', 'OPD', 'Outpatient Department - General consultations and emergency services', 1),
      ('ipd', 'IPD', 'Inpatient Department - Admitted patient care and ward management', 2),
      ('laboratory', 'Laboratory', 'Laboratory Services - Diagnostic tests and medical investigations', 3),
      ('pharmacy', 'Pharmacy', 'Pharmacy - Medication dispensing and pharmaceutical services', 4),
      ('rch', 'RCH', 'Reproductive and Child Health - Maternal and child health services', 5),
      ('theatre', 'Theatre', 'Operating Theatre - Surgical procedures and operations', 6),
      ('mortuary', 'Mortuary', 'Mortuary Services - Post-mortem and mortuary management', 7)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        sort_order = VALUES(sort_order)
    `);
    console.log('✅ Seeded default departments (without icons)');

    // Drop icon column if it exists (for existing tables)
    try {
      await connection.execute(`ALTER TABLE departments DROP COLUMN IF EXISTS icon`);
      console.log('✅ Removed icon column (if it existed)');
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }
      // Column doesn't exist, which is fine
    }

    console.log('🎉 Departments migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();
