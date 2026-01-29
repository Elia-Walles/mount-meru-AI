import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await dbAdapter.initialize();
    
    // Only seed data if using mock database
    if (dbAdapter.getDatabaseType() === 'mock') {
      console.log('🌱 Using mock database - seeding sample data');
      
      // Import MockDataGenerator only for mock database
      const { MockDataGenerator } = await import('@/lib/mock-data-generator');
      
      const datasets = await dbAdapter.getDatasets();
      if (datasets.length === 0) {
        // Create sample datasets
        const sampleDatasets = MockDataGenerator.generateSampleDatasets();
        for (const dataset of sampleDatasets) {
          await dbAdapter.createDataset(dataset);
        }

        // Generate sample patient records
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        
        const opdRecords = MockDataGenerator.generateOPDRecords(5000, startDate, endDate, 'sample-opd-2024');
        const ipdRecords = MockDataGenerator.generateIPDRecords(1200, startDate, endDate, 'sample-ipd-2024');
        const labRecords = MockDataGenerator.generateLaboratoryRecords(3000, startDate, endDate, 'sample-lab-2024');
        const rchRecords = MockDataGenerator.generateRCHRecords(2500, startDate, endDate, 'sample-rch-2024');
        
        await dbAdapter.addPatientRecords(opdRecords);
        await dbAdapter.addPatientRecords(ipdRecords);
        await dbAdapter.addPatientRecords(labRecords);
        await dbAdapter.addPatientRecords(rchRecords);
      }
    } else {
      console.log('🌐 Using real database - no mock data seeded');
    }
    
    return NextResponse.json({ 
      success: true, 
      databaseType: dbAdapter.getDatabaseType(),
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database initialization failed' 
    }, { status: 500 });
  }
}
