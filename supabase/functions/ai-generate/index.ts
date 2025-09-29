import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  provider: 'claude' | 'openai';
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      messages,
      model,
      provider,
      maxTokens = 4000,
      temperature = 0.7,
      stream = false
    }: AIRequest = await req.json();

    console.log(`[AI-GENERATE] Processing request for ${provider}:${model}`);

    let response;
    let usage;

    if (provider === 'claude') {
      response = await callClaudeAPI(messages, model, maxTokens, temperature);
      usage = response.usage;
    } else if (provider === 'openai') {
      response = await callOpenAIAPI(messages, model, maxTokens, temperature);
      usage = response.usage;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`[AI-GENERATE] Success - ${usage?.total_tokens || 0} tokens`);

    return new Response(JSON.stringify({
      content: response.content,
      model: model,
      provider: provider,
      usage: usage ? {
        promptTokens: usage.input_tokens || usage.prompt_tokens || 0,
        completionTokens: usage.output_tokens || usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[AI-GENERATE] Error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      details: error?.toString() || 'No details available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callClaudeAPI(
  messages: any[],
  model: string,
  maxTokens: number,
  temperature: number
) {
  const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
  if (!claudeApiKey) {
    throw new Error('CLAUDE_API_KEY is not configured');
  }

  // Convert messages to Claude format
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const claudeMessages = userMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  const requestBody = {
    model: model,
    max_tokens: maxTokens,
    messages: claudeMessages,
    ...(systemMessage && { system: systemMessage.content })
  };

  console.log(`[CLAUDE-API] Request to ${model}`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[CLAUDE-API] Error ${response.status}:`, errorText);
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0]?.text || '',
    usage: data.usage
  };
}

async function callOpenAIAPI(
  messages: any[],
  model: string,
  maxTokens: number,
  temperature: number
) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Determine if this is a newer model that uses max_completion_tokens
  const isNewerModel = model.includes('gpt-5') || model.includes('gpt-4.1') || 
                      model.includes('o3') || model.includes('o4');

  const requestBody = {
    model: model,
    messages: messages,
    // Use max_completion_tokens for newer models, max_tokens for legacy
    ...(isNewerModel ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
    // Temperature is not supported in newer models
    ...((!isNewerModel) && { temperature })
  };

  console.log(`[OPENAI-API] Request to ${model}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OPENAI-API] Error ${response.status}:`, errorText);
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
  };
}