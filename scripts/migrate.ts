import { initializeDatabase } from '../lib/database';

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');
    await initializeDatabase();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
