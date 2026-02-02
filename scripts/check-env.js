// Check environment variables for production
console.log('🔍 Checking environment variables...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('has DATABASE_PASSWORD:', !!process.env.DATABASE_PASSWORD);

// Test database connection
async function testDatabase() {
  try {
    const response = await fetch('http://localhost:3000/api/test-env');
    const data = await response.json();
    console.log('🌐 Server environment:', data);
  } catch (error) {
    console.error('❌ Failed to test server environment:', error.message);
  }
}

testDatabase();
