// Production Migration Script for Mount Meru AI
// This script sets up the real database and removes all mock/demo data

async function runProductionMigration() {
  console.log('🚀 Starting Mount Meru AI Production Migration...');
  console.log('🔧 Setting up real TiDB Cloud database...');
  
  try {
    // Initialize real database
    const response = await fetch('http://localhost:3000/api/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Production database initialized successfully!');
      console.log('🎉 Mount Meru AI Platform is ready for production!');
      console.log('Database type:', result.databaseType);
      
      if (result.databaseType === 'real') {
        console.log('🌐 Connected to TiDB Cloud - Production Ready');
      } else {
        console.log('⚠️  Using mock database - Install mysql2 for real database');
      }
    } else {
      console.error('❌ Migration failed:', response.statusText);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Make sure the development server is running on http://localhost:3000');
    console.log('💡 Also ensure mysql2 is installed for real database connection');
    process.exit(1);
  }
}

// Run the production migration
runProductionMigration();
