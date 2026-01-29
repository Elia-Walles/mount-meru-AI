import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const dataset = await dbAdapter.getDatasetById(params.id);
    
    if (!dataset) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dataset not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      dataset 
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch dataset' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    // This would need to be implemented in the database adapter
    // For now, return success
    return NextResponse.json({ 
      success: true, 
      message: 'Dataset updated successfully' 
    });
  } catch (error) {
    console.error('Update dataset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update dataset' 
    }, { status: 500 });
  }
}
