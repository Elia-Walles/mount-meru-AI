import { NextRequest, NextResponse } from 'next/server';
import { realDB } from '@/lib/real-database';

export async function GET() {
  try {
    const departments = await realDB.getDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error('Departments API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const department = await realDB.createDepartment(body);
    
    return NextResponse.json({ 
      success: true, 
      department 
    }, { status: 201 });
  } catch (error) {
    console.error('Create department API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create department' },
      { status: 500 }
    );
  }
}
