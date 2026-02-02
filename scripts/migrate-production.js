// Production migration: initialize database schema and seed initial data
async function runProductionMigration() {
  console.log('🚀 Mount Meru AI – Production database migration');
  console.log('🔧 Connecting to TiDB Cloud...');

  try {
    const response = await fetch('http://localhost:3000/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database initialized:', result.message);
      console.log('🎉 Platform ready for production.');
    } else {
      const err = await response.json().catch(() => ({}));
      console.error('❌ Migration failed:', err.message || response.statusText);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('💡 Ensure the dev server is running: npm run dev');
    console.log('💡 Ensure DATABASE_* env vars are set in .env');
    process.exit(1);
  }
}

runProductionMigration();
