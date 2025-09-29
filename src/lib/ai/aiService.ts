import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'claude' | 'openai';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  contextLength: number;
  costPer1kTokens: number;
  capabilities: string[];
  isDefault?: boolean;
}

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  provider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

// Available AI models configuration
export const AI_MODELS: Record<string, AIModel> = {
  // Claude Models (Primary)
  'claude-sonnet-4-0': {
    id: 'claude-sonnet-4-0',
    name: 'Claude 4 Sonnet',
    provider: 'claude',
    description: 'Claude Sonnet 4 (alias) — auto-tracks latest 4.0 series',
    contextLength: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['text', 'analysis', 'code', 'reasoning'],
    isDefault: true
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    description: 'Previous gen Claude model',
    contextLength: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['text', 'analysis', 'code', 'reasoning']
  },
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022', 
    name: 'Claude 3.5 Haiku',
    provider: 'claude',
    description: 'Fast and efficient Claude model',
    contextLength: 200000,
    costPer1kTokens: 0.0008,
    capabilities: ['text', 'analysis', 'speed']
  },
  // OpenAI Models (Secondary)
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s flagship model with vision capabilities',
    contextLength: 128000,
    costPer1kTokens: 0.005,
    capabilities: ['text', 'vision', 'code']
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and cost-effective OpenAI model',
    contextLength: 128000,
    costPer1kTokens: 0.00015,
    capabilities: ['text', 'vision', 'speed']
  }
};

export class AIService {
  private static instance: AIService;
  private defaultModel: string = 'claude-sonnet-4-0';

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setDefaultModel(modelId: string): void {
    if (AI_MODELS[modelId]) {
      this.defaultModel = modelId;
      localStorage.setItem('ai_default_model', modelId);
    }
  }

  public getDefaultModel(): string {
    const saved = localStorage.getItem('ai_default_model');
    return (saved && AI_MODELS[saved]) ? saved : this.defaultModel;
  }

  public getModel(modelId?: string): AIModel {
    const id = modelId || this.getDefaultModel();
    return AI_MODELS[id] || AI_MODELS[this.defaultModel];
  }

  public getAvailableModels(): AIModel[] {
    return Object.values(AI_MODELS);
  }

  public getModelsByProvider(provider: AIProvider): AIModel[] {
    return Object.values(AI_MODELS).filter(model => model.provider === provider);
  }

  public async generateResponse(request: AIRequest): Promise<AIResponse> {
    const model = this.getModel(request.model);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          messages: request.messages,
          model: model.id,
          provider: model.provider,
          maxTokens: request.maxTokens || 4000,
          temperature: request.temperature || 0.7,
          stream: request.stream || false
        }
      });

      if (error) throw error;

      return {
        content: data.content,
        model: model.id,
        provider: model.provider,
        usage: data.usage,
        cost: this.calculateCost(data.usage?.totalTokens || 0, model)
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  public async testModel(modelId: string, testPrompt: string): Promise<{
    success: boolean;
    response?: AIResponse;
    error?: string;
    latency: number;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.generateResponse({
        messages: [
          { role: 'user', content: testPrompt }
        ],
        model: modelId
      });

      return {
        success: true,
        response,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  public calculateCost(tokens: number, model: AIModel): number {
    return (tokens / 1000) * model.costPer1kTokens;
  }

  // Specialized methods for common use cases
  public async analyzeText(text: string, analysisType: 'sentiment' | 'summary' | 'extract' | 'classify'): Promise<AIResponse> {
    const prompts = {
      sentiment: `Analyze the sentiment of the following text and provide a score from -1 (very negative) to 1 (very positive), along with a brief explanation: "${text}"`,
      summary: `Provide a concise summary of the following text: "${text}"`,
      extract: `Extract key information and insights from the following text: "${text}"`,
      classify: `Classify the following text into relevant categories and provide tags: "${text}"`
    };

    return this.generateResponse({
      messages: [
        { role: 'system', content: 'You are an AI assistant specialized in text analysis. Provide clear, structured responses.' },
        { role: 'user', content: prompts[analysisType] }
      ]
    });
  }

  public async generateContent(type: 'email' | 'sms' | 'notification', context: any): Promise<AIResponse> {
    const systemPrompts = {
      email: 'You are an expert email writer for fitness facilities. Write professional, engaging emails.',
      sms: 'You are an expert SMS writer. Keep messages concise, friendly, and under 160 characters when possible.',
      notification: 'You are writing push notifications for a gym app. Be brief, actionable, and motivating.'
    };

    return this.generateResponse({
      messages: [
        { role: 'system', content: systemPrompts[type] },
        { role: 'user', content: `Generate a ${type} with the following context: ${JSON.stringify(context)}` }
      ]
    });
  }

  public async predictChurn(memberData: any): Promise<AIResponse> {
    return this.generateResponse({
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI specialist in member retention for fitness facilities. Analyze member data and provide churn risk assessment with specific recommendations.'
        },
        { 
          role: 'user', 
          content: `Analyze this member's data and predict churn risk with specific factors and intervention suggestions: ${JSON.stringify(memberData)}`
        }
      ]
    });
  }

  public async forecastRevenue(historicalData: any, timeframe: string): Promise<AIResponse> {
    return this.generateResponse({
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI financial analyst specializing in fitness facility revenue forecasting. Provide detailed predictions with confidence levels.'
        },
        { 
          role: 'user', 
          content: `Based on this historical data, forecast revenue for the ${timeframe}: ${JSON.stringify(historicalData)}`
        }
      ]
    });
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();