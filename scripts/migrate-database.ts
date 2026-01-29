#!/usr/bin/env node

// Database Migration Script for Mount Meru AI Hospital Analytics Platform
// This script creates all necessary tables and sets up the database

import { db, initializeDatabase, seedDatabase } from '../lib/database';

async function runMigration() {
  console.log('🚀 Starting Mount Meru AI Database Migration...');
  
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!');
    
    // Initialize database schema
    console.log('🔧 Creating database schema...');
    await initializeDatabase();
    
    // Seed initial data
    console.log('🌱 Seeding initial data...');
    await seedDatabase();
    
    console.log('✅ Database migration completed successfully!');
    console.log('🎉 Mount Meru AI Platform is ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
