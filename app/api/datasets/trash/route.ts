import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    await dbAdapter.initialize();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const datasets = await dbAdapter.getTrashDatasets(userId);
    return NextResponse.json({ success: true, datasets });
  } catch (error) {
    console.error('Get trash error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch trash' }, { status: 500 });
  }
}
