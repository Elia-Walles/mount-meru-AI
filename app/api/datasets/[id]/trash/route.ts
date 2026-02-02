import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbAdapter.initialize();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || undefined;
    const ok = await dbAdapter.softDeleteDataset(id, userId);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Dataset not found or already in trash' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Soft delete error:', error);
    return NextResponse.json({ success: false, message: 'Failed to move to trash' }, { status: 500 });
  }
}
