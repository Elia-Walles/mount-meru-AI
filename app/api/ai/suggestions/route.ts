import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { datasetId } = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    // Get dataset information
    const dataset = await dbAdapter.getDatasetById(datasetId);
    
    if (!dataset) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dataset not found' 
      }, { status: 404 });
    }

    // Get query suggestions from AI service
    const suggestions = await aiService.suggestQueries(dataset);

    return NextResponse.json({ 
      success: true, 
      suggestions 
    });
  } catch (error) {
    console.error('Query suggestions error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate suggestions' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    // Validate query using AI service
    const validation = await aiService.validateQuery(query);

    return NextResponse.json({ 
      success: true, 
      validation 
    });
  } catch (error) {
    console.error('Query validation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Query validation failed' 
    }, { status: 500 });
  }
}
