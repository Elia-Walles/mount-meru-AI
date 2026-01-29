import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { AnalyticsEngine } from '@/lib/analytics-engine';
import { aiService } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const results = await dbAdapter.getAnalyticsResults(datasetId || undefined);
    
    return NextResponse.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error('Get analytics results error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch analytics results' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { datasetId, query } = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    // Get patient records for analysis
    const patientRecords = await dbAdapter.getPatientRecords(datasetId);
    const dataset = await dbAdapter.getDatasetById(datasetId);
    
    if (!dataset) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dataset not found' 
      }, { status: 404 });
    }

    if (patientRecords.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No patient records found for this dataset' 
      }, { status: 400 });
    }
    
    // Use AI service for advanced analysis
    const aiRequest = {
      query,
      datasetInfo: {
        name: dataset.name,
        department: dataset.department,
        recordCount: dataset.rowCount,
        columns: dataset.columns
      },
      patientData: patientRecords.slice(0, 100), // Send sample data for analysis
      analysisType: determineAnalysisType(query)
    };

    try {
      const aiAnalysis = await aiService.analyzeHospitalData(aiRequest);
      
      // Generate additional statistical insights using AnalyticsEngine
      let statisticalResults: any = {};
      
      try {
        const analysisType = determineAnalysisType(query);
        
        switch (analysisType) {
          case 'descriptive':
            statisticalResults = AnalyticsEngine.calculateDescriptiveStats(patientRecords, 'age');
            break;
          case 'trend':
            statisticalResults = AnalyticsEngine.analyzeTrend(patientRecords);
            break;
          case 'epidemiological':
            statisticalResults = AnalyticsEngine.calculateEpidemiologicalMetrics(patientRecords);
            break;
          case 'surveillance':
            statisticalResults = AnalyticsEngine.detectOutbreak(patientRecords);
            break;
          case 'forecasting':
            statisticalResults = AnalyticsEngine.forecastCases(patientRecords);
            break;
        }
      } catch (statError) {
        console.error('Statistical analysis failed:', statError);
        statisticalResults = { error: 'Statistical analysis failed' };
      }

      // Save analytics result
      const analyticsResult = await dbAdapter.saveAnalyticsResult({
        datasetId,
        analysisType: determineAnalysisType(query),
        query,
        results: {
          aiAnalysis,
          statisticalResults,
          recordCount: patientRecords.length
        },
        interpretation: aiAnalysis.analysis,
        recommendations: aiAnalysis.recommendations,
        generatedBy: 'system' // This should come from authenticated user
      });

      return NextResponse.json({ 
        success: true, 
        results: {
          aiAnalysis: aiAnalysis.analysis,
          insights: aiAnalysis.insights,
          recommendations: aiAnalysis.recommendations,
          metrics: aiAnalysis.metrics,
          statisticalResults,
          analysisType: determineAnalysisType(query)
        }
      });
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      // Fallback to basic statistical analysis
      const analysisType = determineAnalysisType(query);
      let results: any = {};
      let interpretation = '';
      let recommendations: string[] = [];

      switch (analysisType) {
        case 'descriptive':
          results = AnalyticsEngine.calculateDescriptiveStats(patientRecords, 'age');
          interpretation = `The average patient age is ${results?.mean} years with a standard deviation of ${results?.stdDev}.`;
          recommendations = ['Consider age-specific interventions', 'Monitor age-related disease patterns'];
          break;

        case 'trend':
          const trendAnalysis = AnalyticsEngine.analyzeTrend(patientRecords);
          results = trendAnalysis;
          interpretation = `The data shows a ${trendAnalysis.trend} trend with ${trendAnalysis.percentChange}% change.`;
          recommendations = trendAnalysis.trend === 'increasing' ? 
            ['Monitor the increasing trend', 'Prepare for increased service demand'] :
            ['Investigate causes of decline', 'Maintain current interventions'];
          break;

        case 'epidemiological':
          const epiMetrics = AnalyticsEngine.calculateEpidemiologicalMetrics(patientRecords);
          results = epiMetrics;
          interpretation = `The incidence rate is ${epiMetrics.incidence} per 1000 population with a case fatality rate of ${epiMetrics.caseFatalityRate}%.`;
          recommendations = ['Strengthen prevention measures', 'Improve case management', 'Enhance surveillance'];
          break;

        case 'surveillance':
          const alerts = AnalyticsEngine.detectOutbreak(patientRecords);
          results = alerts;
          interpretation = alerts.length > 0 ? 
            `${alerts.length} potential outbreak(s) detected requiring immediate attention.` :
            'No unusual patterns detected. Current situation is stable.';
          recommendations = alerts.length > 0 ? 
            alerts[0].recommendations :
            ['Continue routine surveillance', 'Maintain current prevention measures'];
          break;

        default:
          // Simple count analysis
          const diagnosisCounts = patientRecords.reduce((acc, record) => {
            acc[record.diagnosis] = (acc[record.diagnosis] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          results = diagnosisCounts;
          interpretation = `Found ${patientRecords.length} total records with ${Object.keys(diagnosisCounts).length} different diagnoses.`;
          recommendations = ['Analyze most common conditions', 'Focus on high-burden diseases'];
      }

      // Save analytics result
      const analyticsResult = await dbAdapter.saveAnalyticsResult({
        datasetId,
        analysisType,
        query,
        results,
        interpretation,
        recommendations,
        generatedBy: 'system'
      });

      return NextResponse.json({ 
        success: true, 
        results: {
          data: results,
          interpretation,
          recommendations,
          analysisType,
          fallback: true
        }
      });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Analytics processing failed' 
    }, { status: 500 });
  }
}

function determineAnalysisType(query: string): 'descriptive' | 'trend' | 'epidemiological' | 'statistical' | 'surveillance' | 'forecasting' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('over time')) {
    return 'trend';
  }
  if (lowerQuery.includes('incidence') || lowerQuery.includes('prevalence') || lowerQuery.includes('rate')) {
    return 'epidemiological';
  }
  if (lowerQuery.includes('outbreak') || lowerQuery.includes('alert') || lowerQuery.includes('abnormal')) {
    return 'surveillance';
  }
  if (lowerQuery.includes('compare') || lowerQuery.includes('difference') || lowerQuery.includes('test')) {
    return 'statistical';
  }
  if (lowerQuery.includes('forecast') || lowerQuery.includes('predict') || lowerQuery.includes('future')) {
    return 'forecasting';
  }
  
  return 'descriptive';
}
