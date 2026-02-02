import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function POST(request: NextRequest) {
  try {
    await dbAdapter.initialize();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, message: 'Database initialization failed' },
      { status: 500 }
    );
  }
}
