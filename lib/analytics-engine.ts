// Analytics Engine for Mount Meru AI Hospital Analytics Platform
// Core analytics capabilities including epidemiological, statistical, and surveillance analysis

import { PatientRecord, AnalyticsResult } from './mock-database';

export interface AnalysisQuery {
  type: 'descriptive' | 'trend' | 'epidemiological' | 'statistical' | 'surveillance' | 'forecasting';
  query: string;
  datasetId: string;
  parameters?: any;
}

export interface EpidemiologicalMetrics {
  incidence: number;
  prevalence: number;
  caseFatalityRate: number;
  proportionalMorbidityRatio: number;
  causeSpecificMortalityFraction?: number;
}

export interface StatisticalTestResult {
  test: string;
  statistic: number;
  pValue: number;
  confidenceInterval: [number, number];
  interpretation: string;
  isSignificant: boolean;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  seasonalPattern: boolean;
  forecast?: number[];
  confidence: number;
}

export interface SurveillanceAlert {
  alertLevel: 'low' | 'moderate' | 'high' | 'critical';
  threshold: number;
  observedValue: number;
  expectedValue: number;
  message: string;
  recommendations: string[];
}

export class AnalyticsEngine {
  // Descriptive Statistics
  static calculateDescriptiveStats(records: PatientRecord[], variable: keyof PatientRecord): any {
    const values = records.map(record => record[variable]).filter(val => typeof val === 'number') as number[];
    
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 ? 
      (sorted[n/2 - 1] + sorted[n/2]) / 2 : 
      sorted[Math.floor(n/2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    return {
      count: n,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: sorted[0],
      max: sorted[n - 1],
      stdDev: Math.round(stdDev * 100) / 100,
      q1: sorted[Math.floor(n * 0.25)],
      q3: sorted[Math.floor(n * 0.75)]
    };
  }

  // Epidemiological Analysis
  static calculateEpidemiologicalMetrics(
    records: PatientRecord[], 
    population: number = 10000,
    timePeriod: number = 365 // days
  ): EpidemiologicalMetrics {
    const totalCases = records.length;
    const deaths = records.filter(r => r.outcome === 'Died').length;
    const newCases = records.filter(r => {
      const daysSinceStart = (r.visitDate.getTime() - records[0].visitDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceStart <= timePeriod;
    }).length;

    const incidence = (newCases / population) * 1000; // per 1000 population
    const prevalence = (totalCases / population) * 1000; // per 1000 population
    const caseFatalityRate = totalCases > 0 ? (deaths / totalCases) * 100 : 0;
    const proportionalMorbidityRatio = totalCases > 0 ? (totalCases / totalCases) * 100 : 100; // This would need total disease burden

    return {
      incidence: Math.round(incidence * 100) / 100,
      prevalence: Math.round(prevalence * 100) / 100,
      caseFatalityRate: Math.round(caseFatalityRate * 100) / 100,
      proportionalMorbidityRatio: Math.round(proportionalMorbidityRatio * 100) / 100
    };
  }

  // Trend Analysis
  static analyzeTrend(records: PatientRecord[], timeUnit: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): TrendAnalysis {
    const groupedData = this.groupByTimePeriod(records, timeUnit);
    const values = Object.values(groupedData);
    
    if (values.length < 2) {
      return {
        trend: 'stable',
        percentChange: 0,
        seasonalPattern: false,
        confidence: 0
      };
    }

    // Simple linear regression for trend
    const n = values.length;
    const xValues = Array.from({length: n}, (_, i) => i);
    const yValues = values;
    
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    
    const slope = numerator / denominator;
    const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    
    // Calculate percent change
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    // Simple seasonality detection (for monthly data)
    const seasonalPattern = timeUnit === 'monthly' && this.detectSeasonality(values);
    
    return {
      trend,
      percentChange: Math.round(percentChange * 100) / 100,
      seasonalPattern,
      confidence: Math.round(Math.abs(slope) * 100) / 100
    };
  }

  // Statistical Tests
  static performStatisticalTest(
    group1: PatientRecord[], 
    group2: PatientRecord[], 
    variable: keyof PatientRecord,
    testType: 'chi-square' | 't-test' | 'mann-whitney' = 't-test'
  ): StatisticalTestResult {
    const values1 = group1.map(r => r[variable]).filter(v => typeof v === 'number') as number[];
    const values2 = group2.map(r => r[variable]).filter(v => typeof v === 'number') as number[];
    
    if (values1.length === 0 || values2.length === 0) {
      throw new Error('Insufficient data for statistical test');
    }

    let result: StatisticalTestResult;

    switch (testType) {
      case 't-test':
        result = this.tTest(values1, values2);
        break;
      case 'mann-whitney':
        result = this.mannWhitneyUTest(values1, values2);
        break;
      case 'chi-square':
        result = this.chiSquareTest(group1, group2);
        break;
      default:
        result = this.tTest(values1, values2);
    }

    return result;
  }

  // Surveillance and Outbreak Detection
  static detectOutbreak(
    records: PatientRecord[], 
    thresholdMultiplier: number = 2.0
  ): SurveillanceAlert[] {
    const alerts: SurveillanceAlert[] = [];
    const groupedByDiagnosis = this.groupBy(records, 'diagnosis');
    
    for (const [diagnosis, diagnosisRecords] of Object.entries(groupedByDiagnosis)) {
      const timeGrouped = this.groupByTimePeriod(diagnosisRecords, 'weekly');
      const weeklyCounts = Object.values(timeGrouped);
      
      if (weeklyCounts.length < 4) continue; // Need at least 4 weeks for baseline
      
      // Calculate baseline (mean of first 4 weeks)
      const baseline = weeklyCounts.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
      const threshold = baseline * thresholdMultiplier;
      
      // Check recent weeks
      const recentWeeks = weeklyCounts.slice(-4);
      for (let i = 0; i < recentWeeks.length; i++) {
        const currentCount = recentWeeks[i];
        if (currentCount > threshold) {
          const alertLevel = currentCount > threshold * 2 ? 'critical' : 
                           currentCount > threshold * 1.5 ? 'high' : 'moderate';
          
          alerts.push({
            alertLevel,
            threshold,
            observedValue: currentCount,
            expectedValue: baseline,
            message: `Unusual increase in ${diagnosis} cases detected`,
            recommendations: [
              'Investigate potential outbreak source',
              'Enhance surveillance and case finding',
              'Review infection control measures',
              'Consider public health intervention'
            ]
          });
        }
      }
    }
    
    return alerts;
  }

  // Forecasting
  static forecastCases(records: PatientRecord[], periods: number = 6): number[] {
    const monthlyData = this.groupByTimePeriod(records, 'monthly');
    const values = Object.values(monthlyData);
    
    if (values.length < 3) {
      return Array(periods).fill(0);
    }

    // Simple moving average forecast
    const forecast: number[] = [];
    const windowSize = Math.min(3, values.length);
    
    for (let i = 0; i < periods; i++) {
      const recentValues = values.slice(-windowSize);
      const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      forecast.push(Math.round(avg));
      
      // Add forecast to values for next iteration
      values.push(avg);
    }
    
    return forecast;
  }

  // Helper Methods
  private static groupByTimePeriod(records: PatientRecord[], period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    records.forEach(record => {
      const date = new Date(record.visitDate);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    return grouped;
  }

  private static groupBy<T>(records: T[], key: keyof T): Record<string, T[]> {
    return records.reduce((groups, record) => {
      const groupKey = String(record[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(record);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private static detectSeasonality(values: number[]): boolean {
    if (values.length < 12) return false;
    
    // Simple seasonality detection using autocorrelation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Check for 12-month pattern
    let correlation = 0;
    const lag = Math.min(12, Math.floor(values.length / 2));
    
    for (let i = 0; i < values.length - lag; i++) {
      correlation += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    correlation /= (values.length - lag) * variance;
    
    return Math.abs(correlation) > 0.3;
  }

  // Statistical Test Implementations
  private static tTest(values1: number[], values2: number[]): StatisticalTestResult {
    const n1 = values1.length;
    const n2 = values2.length;
    const mean1 = values1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n2;
    
    const var1 = values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
    
    const pooledStdError = Math.sqrt(var1/n1 + var2/n2);
    const tStatistic = (mean1 - mean2) / pooledStdError;
    
    // Approximate p-value for two-tailed test
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));
    
    const meanDiff = mean1 - mean2;
    const confidenceInterval: [number, number] = [
      meanDiff - 1.96 * pooledStdError,
      meanDiff + 1.96 * pooledStdError
    ];
    
    return {
      test: 'Independent t-test',
      statistic: Math.round(tStatistic * 1000) / 1000,
      pValue: Math.round(pValue * 1000) / 1000,
      confidenceInterval: [Math.round(confidenceInterval[0] * 1000) / 1000, Math.round(confidenceInterval[1] * 1000) / 1000],
      interpretation: pValue < 0.05 ? 'Significant difference detected' : 'No significant difference',
      isSignificant: pValue < 0.05
    };
  }

  private static mannWhitneyUTest(values1: number[], values2: number[]): StatisticalTestResult {
    // Simplified Mann-Whitney U test implementation
    const combined = [...values1.map(v => ({value: v, group: 1})), ...values2.map(v => ({value: v, group: 2}))];
    combined.sort((a, b) => a.value - b.value);
    
    let rank1 = 0, rank2 = 0;
    combined.forEach((item, index) => {
      if (item.group === 1) rank1 += index + 1;
      else rank2 += index + 1;
    });
    
    const n1 = values1.length;
    const n2 = values2.length;
    const u1 = rank1 - n1 * (n1 + 1) / 2;
    const u2 = rank2 - n2 * (n2 + 1) / 2;
    const u = Math.min(u1, u2);
    
    // Simplified p-value calculation
    const expectedU = n1 * n2 / 2;
    const stdU = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
    const zScore = (u - expectedU) / stdU;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      test: 'Mann-Whitney U test',
      statistic: Math.round(u * 1000) / 1000,
      pValue: Math.round(pValue * 1000) / 1000,
      confidenceInterval: [0, 0], // Not applicable for non-parametric test
      interpretation: pValue < 0.05 ? 'Significant difference detected' : 'No significant difference',
      isSignificant: pValue < 0.05
    };
  }

  private static chiSquareTest(group1: PatientRecord[], group2: PatientRecord[]): StatisticalTestResult {
    // Simplified chi-square test for categorical data
    const outcomes = ['Discharged', 'Admitted', 'Referred', 'Died'];
    
    const observed1 = outcomes.map(outcome => 
      group1.filter(r => r.outcome === outcome).length
    );
    const observed2 = outcomes.map(outcome => 
      group2.filter(r => r.outcome === outcome).length
    );
    
    const row1 = observed1.reduce((a, b) => a + b, 0);
    const row2 = observed2.reduce((a, b) => a + b, 0);
    const colTotals = observed1.map((val, i) => val + observed2[i]);
    const total = row1 + row2;
    
    let chiSquare = 0;
    for (let i = 0; i < outcomes.length; i++) {
      const expected1 = row1 * colTotals[i] / total;
      const expected2 = row2 * colTotals[i] / total;
      
      if (expected1 > 0) chiSquare += Math.pow(observed1[i] - expected1, 2) / expected1;
      if (expected2 > 0) chiSquare += Math.pow(observed2[i] - expected2, 2) / expected2;
    }
    
    // Simplified p-value calculation
    const df = (outcomes.length - 1) * (2 - 1);
    const pValue = 1 - this.chiSquareCDF(chiSquare, df);
    
    return {
      test: 'Chi-square test',
      statistic: Math.round(chiSquare * 1000) / 1000,
      pValue: Math.round(pValue * 1000) / 1000,
      confidenceInterval: [0, 0], // Not applicable
      interpretation: pValue < 0.05 ? 'Significant association detected' : 'No significant association',
      isSignificant: pValue < 0.05
    };
  }

  // Approximate normal CDF
  private static normalCDF(x: number): number {
    // Approximation of the normal cumulative distribution function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }

  // Approximate chi-square CDF
  private static chiSquareCDF(x: number, df: number): number {
    // Simplified chi-square CDF approximation
    if (x <= 0) return 0;
    if (df === 1) return 2 * (1 - this.normalCDF(Math.sqrt(x)));
    if (df === 2) return 1 - Math.exp(-x / 2);
    
    // For higher degrees of freedom, use approximation
    const mean = df;
    const variance = 2 * df;
    const z = (x - mean) / Math.sqrt(variance);
    return this.normalCDF(z);
  }
}
