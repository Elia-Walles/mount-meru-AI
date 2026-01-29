// Database Migration Script using API
// This script initializes the database via the API endpoint

async function runMigration() {
  console.log('🚀 Starting Mount Meru AI Database Migration...');
  
  try {
    // Test database connection and initialize schema
    console.log('🔧 Initializing database via API...');
    const response = await fetch('http://localhost:3000/api/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database migration completed successfully!');
      console.log('🎉 Mount Meru AI Platform is ready to use!');
      console.log('Database type:', result.databaseType);
    } else {
      console.error('❌ Migration failed:', response.statusText);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Make sure the development server is running on http://localhost:3000');
    process.exit(1);
  }
}

// Run the migration
runMigration();
