import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    await dbAdapter.initialize();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const reports = await dbAdapter.getReports(userId);
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbAdapter.initialize();
    const body = await request.json();
    const { title, type, generatedBy, format = 'pdf' } = body;

    if (!title || !type || !generatedBy) {
      return NextResponse.json(
        { success: false, message: 'title, type, and generatedBy are required' },
        { status: 400 }
      );
    }

    const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid report type' }, { status: 400 });
    }

    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);
    if (type === 'weekly') periodStart.setDate(periodStart.getDate() - 7);
    else if (type === 'monthly') periodStart.setMonth(periodStart.getMonth() - 1);
    else if (type === 'quarterly') periodStart.setMonth(periodStart.getMonth() - 3);
    else if (type === 'annual') periodStart.setFullYear(periodStart.getFullYear() - 1);

    const analyticsResults = await dbAdapter.getAnalyticsResults();
    const summary = analyticsResults.length > 0
      ? `This report summarizes ${analyticsResults.length} analysis result(s) for the selected period. Key findings and recommendations are included in the interpretation section.`
      : 'No analytics results available for this period. Run analyses on your datasets to include insights in future reports.';

    const report = await dbAdapter.saveReport({
      title,
      type: type as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom',
      period: { start: periodStart, end: periodEnd },
      content: {
        summary,
        tables: analyticsResults.slice(0, 5).map(r => ({ query: r.query, type: r.analysisType })),
        charts: [],
        interpretation: analyticsResults.slice(0, 3).map(r => r.interpretation).join('\n\n') || summary,
      },
      generatedBy,
      format: (format === 'word' || format === 'excel') ? format : 'pdf',
    });

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        period: { start: report.period.start.toISOString(), end: report.period.end.toISOString() },
        generatedAt: report.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate report' }, { status: 500 });
  }
}
