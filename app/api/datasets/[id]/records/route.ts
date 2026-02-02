import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import type { PatientRecord } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbAdapter.initialize();
    const { id } = await params;
    const records = await dbAdapter.getPatientRecords(id);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    await dbAdapter.initialize();
    const { id } = await params;
    const records = (Array.isArray(body) ? body : []) as Omit<PatientRecord, 'id'>[];
    const recordsWithDatasetId = records.map((r) => ({ ...r, datasetId: r.datasetId ?? id }));
    const addedRecords = await dbAdapter.addPatientRecords(recordsWithDatasetId);
    
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
