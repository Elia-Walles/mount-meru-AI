import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const datasets = await dbAdapter.getDatasets(userId || undefined);
    
    return NextResponse.json({ 
      success: true, 
      datasets 
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch datasets' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const datasetData = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const dataset = await dbAdapter.createDataset(datasetData);
    
    return NextResponse.json({ 
      success: true, 
      dataset 
    });
  } catch (error) {
    console.error('Create dataset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create dataset' 
    }, { status: 500 });
  }
}
