// AI Service for Mount Meru AI Hospital Analytics Platform
// Integrates with Groq API using Llama 3.1 8B model

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface HospitalAnalyticsRequest {
  query: string;
  datasetInfo: {
    name: string;
    department: string;
    recordCount: number;
    columns: string[];
  };
  patientData?: any[];
  analysisType?: string;
}

export class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  private async callGroqAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data: AIResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw error;
    }
  }

  async analyzeHospitalData(request: HospitalAnalyticsRequest): Promise<{
    analysis: string;
    insights: string[];
    recommendations: string[];
    metrics?: any;
  }> {
    const systemPrompt = `You are an expert hospital data analyst and epidemiologist working for Mount Meru AI Hospital Analytics Platform. 

Your role is to analyze hospital data and provide insights for clinical and managerial decision-making. You specialize in:

- Epidemiological analysis (incidence, prevalence, case fatality rates)
- Hospital performance metrics (bed occupancy, length of stay, waiting times)
- Disease surveillance and outbreak detection
- Health service utilization analysis
- Tanzania Ministry of Health standards compliance

When analyzing data, always:
1. Provide clear, actionable insights
2. Use appropriate epidemiological terminology
3. Consider Tanzania healthcare context
4. Suggest practical recommendations
5. Flag any concerning patterns or trends

Format your response as JSON with:
{
  "analysis": "Detailed analysis of the data",
  "insights": ["key insight 1", "key insight 2", "key insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "metrics": {"key_metric": value, "another_metric": value}
}`;

    const userPrompt = this.createAnalysisPrompt(request);

    try {
      const response = await this.callGroqAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        analysis: response,
        insights: ['Analysis completed'],
        recommendations: ['Review the detailed analysis'],
        metrics: {}
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        analysis: 'AI analysis temporarily unavailable',
        insights: ['System error occurred'],
        recommendations: ['Please try again later'],
        metrics: {}
      };
    }
  }

  private createAnalysisPrompt(request: HospitalAnalyticsRequest): string {
    const { query, datasetInfo, patientData, analysisType } = request;

    let prompt = `Query: ${query}\n\n`;
    prompt += `Dataset Information:\n`;
    prompt += `- Name: ${datasetInfo.name}\n`;
    prompt += `- Department: ${datasetInfo.department}\n`;
    prompt += `- Records: ${datasetInfo.recordCount}\n`;
    prompt += `- Columns: ${datasetInfo.columns.join(', ')}\n`;

    if (analysisType) {
      prompt += `- Analysis Type: ${analysisType}\n`;
    }

    if (patientData && patientData.length > 0) {
      prompt += `\nSample Data (first 5 records):\n`;
      prompt += JSON.stringify(patientData.slice(0, 5), null, 2);
    }

    prompt += `\n\nPlease analyze this hospital data and provide insights.`;

    return prompt;
  }

  async generateNaturalLanguageSummary(data: any, analysisType: string): Promise<string> {
    const systemPrompt = `You are a hospital data analyst for Mount Meru AI. Create a clear, natural language summary of the following ${analysisType} analysis results for hospital management and clinical staff.`;

    const userPrompt = `Analysis Results:\n${JSON.stringify(data, null, 2)}\n\nPlease provide a concise, easy-to-understand summary.`;

    try {
      return await this.callGroqAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    } catch (error) {
      console.error('Summary generation failed:', error);
      return 'Summary generation temporarily unavailable.';
    }
  }

  async suggestQueries(datasetInfo: any): Promise<string[]> {
    const systemPrompt = `You are an expert hospital data analyst. Based on the dataset information provided, suggest 5 relevant analytical queries that hospital staff would find valuable for decision-making.`;

    const userPrompt = `Dataset: ${datasetInfo.name}\nDepartment: ${datasetInfo.department}\nColumns: ${datasetInfo.columns.join(', ')}\n\nSuggest 5 specific analytical queries.`;

    try {
      const response = await this.callGroqAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Extract numbered list items
      const lines = response.split('\n');
      return lines
        .filter(line => /^\d+\./.test(line))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);
    } catch (error) {
      console.error('Query suggestions failed:', error);
      return [
        'Analyze overall trends',
        'Calculate key performance indicators',
        'Identify seasonal patterns',
        'Compare department performance',
        'Generate summary statistics'
      ];
    }
  }

  async validateQuery(query: string): Promise<{
    isValid: boolean;
    suggestions?: string[];
    clarification?: string;
  }> {
    const systemPrompt = `You are a hospital data analyst. Validate if the following query is appropriate for hospital data analysis and provide suggestions for improvement if needed.`;

    const userPrompt = `Query: "${query}"\n\nIs this query appropriate for hospital data analysis? Provide suggestions if it needs improvement.`;

    try {
      const response = await this.callGroqAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      return {
        isValid: true,
        suggestions: response.split('\n').filter(line => line.trim()).slice(0, 3)
      };
    } catch (error) {
      console.error('Query validation failed:', error);
      return { isValid: true };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
