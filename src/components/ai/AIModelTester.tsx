import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { aiService, AI_MODELS, AIModel, AIResponse } from '@/lib/ai/aiService';
import { toast } from 'sonner';
import { 
  Brain, 
  Zap, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Settings,
  Play,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface TestResult {
  modelId: string;
  success: boolean;
  response?: AIResponse;
  error?: string;
  latency: number;
  timestamp: Date;
}

export default function AIModelTester() {
  const [selectedModel, setSelectedModel] = useState(aiService.getDefaultModel());
  const [testPrompt, setTestPrompt] = useState('Explain the benefits of regular exercise in 2-3 sentences.');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [batchTesting, setBatchTesting] = useState(false);

  const defaultModel = aiService.getDefaultModel();
  const availableModels = aiService.getAvailableModels();

  const handleSingleTest = async () => {
    if (!testPrompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }

    setTesting(true);
    try {
      const result = await aiService.testModel(selectedModel, testPrompt);
      const testResult: TestResult = {
        modelId: selectedModel,
        ...result,
        timestamp: new Date()
      };
      
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
      
      if (result.success) {
        toast.success(`Test completed in ${result.latency}ms`);
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Test error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleBatchTest = async () => {
    if (!testPrompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }

    setBatchTesting(true);
    const results: TestResult[] = [];
    
    try {
      for (const model of availableModels) {
        const result = await aiService.testModel(model.id, testPrompt);
        results.push({
          modelId: model.id,
          ...result,
          timestamp: new Date()
        });
      }
      
      setTestResults(prev => [...results, ...prev.slice(0, 10 - results.length)]);
      toast.success(`Batch test completed for ${results.length} models`);
    } catch (error) {
      toast.error(`Batch test error: ${error.message}`);
    } finally {
      setBatchTesting(false);
    }
  };

  const handleSetDefaultModel = (modelId: string) => {
    aiService.setDefaultModel(modelId);
    toast.success(`Default model set to ${AI_MODELS[modelId].name}`);
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'claude':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'openai':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 1000) return 'text-green-600';
    if (latency < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Model Testing & Control</h2>
        <Badge variant="secondary" className="ml-2">
          <Settings className="w-3 h-3 mr-1" />
          Central Control
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection & Testing */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Model Testing
              </CardTitle>
              <CardDescription>
                Test and compare AI model performance with custom prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Badge className={getProviderColor(model.provider)} variant="outline">
                              {model.provider}
                            </Badge>
                            {model.name}
                            {model.id === defaultModel && (
                              <Badge variant="default" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quick Actions</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSingleTest}
                      disabled={testing || batchTesting}
                    >
                      {testing ? 'Testing...' : 'Test Single'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleBatchTest}
                      disabled={testing || batchTesting}
                    >
                      {batchTesting ? 'Testing All...' : 'Test All Models'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-prompt">Test Prompt</Label>
                <Textarea
                  id="test-prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a prompt to test the AI models..."
                  rows={4}
                />
              </div>

              {selectedModel && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Model:</strong> {AI_MODELS[selectedModel].name}
                      </div>
                      <div>
                        <strong>Provider:</strong> 
                        <Badge className={`ml-1 ${getProviderColor(AI_MODELS[selectedModel].provider)}`} variant="outline">
                          {AI_MODELS[selectedModel].provider}
                        </Badge>
                      </div>
                      <div>
                        <strong>Context Length:</strong> {AI_MODELS[selectedModel].contextLength.toLocaleString()} tokens
                      </div>
                      <div>
                        <strong>Cost:</strong> ${AI_MODELS[selectedModel].costPer1kTokens}/1k tokens
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {AI_MODELS[selectedModel].description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {AI_MODELS[selectedModel].capabilities.map(cap => (
                        <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(testing || batchTesting) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {batchTesting ? `Testing ${availableModels.length} models...` : 'Testing model...'}
                    </span>
                  </div>
                  <Progress value={batchTesting ? undefined : 50} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select value={defaultModel} onValueChange={handleSetDefaultModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  The default model will be used for all AI features unless explicitly overridden.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableModels.map(model => (
                <div key={model.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{model.name}</div>
                    <Badge className={getProviderColor(model.provider)} variant="outline">
                      {model.provider}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Cost: ${model.costPer1kTokens}/1k tokens</div>
                    <div>Context: {model.contextLength.toLocaleString()}</div>
                  </div>
                  {model.id === defaultModel && (
                    <Badge variant="default" className="text-xs mt-2">Default</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Test Results
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTestResults([])}
                className="ml-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={`${result.modelId}-${result.timestamp.getTime()}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{AI_MODELS[result.modelId].name}</span>
                      <Badge className={getProviderColor(AI_MODELS[result.modelId].provider)} variant="outline">
                        {AI_MODELS[result.modelId].provider}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={getLatencyColor(result.latency)}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {result.latency}ms
                      </span>
                      {result.response?.cost && (
                        <span className="text-muted-foreground">
                          <DollarSign className="w-3 h-3 inline mr-1" />
                          ${result.response.cost.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {result.success && result.response ? (
                    <div className="space-y-2">
                      <div className="text-sm bg-muted p-3 rounded">
                        {result.response.content.length > 200 
                          ? `${result.response.content.substring(0, 200)}...` 
                          : result.response.content
                        }
                      </div>
                      {result.response.usage && (
                        <div className="text-xs text-muted-foreground grid grid-cols-3 gap-4">
                          <span>Prompt: {result.response.usage.promptTokens} tokens</span>
                          <span>Response: {result.response.usage.completionTokens} tokens</span>
                          <span>Total: {result.response.usage.totalTokens} tokens</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}