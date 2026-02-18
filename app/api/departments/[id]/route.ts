import { NextRequest, NextResponse } from 'next/server';
import { realDB } from '@/lib/real-database';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await realDB.updateDepartment(id, body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update department API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await realDB.deleteDepartment(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete department API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
