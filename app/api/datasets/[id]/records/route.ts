import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const records = await dbAdapter.getPatientRecords(params.id);
    
    return NextResponse.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch patient records' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const records = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const addedRecords = await dbAdapter.addPatientRecords(records);
    
    return NextResponse.json({ 
      success: true, 
      records: addedRecords 
    });
  } catch (error) {
    console.error('Add patient records error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to add patient records' 
    }, { status: 500 });
  }
}
