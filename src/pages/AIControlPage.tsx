import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AIModelTester from '@/components/ai/AIModelTester';
import { Brain, Settings, Zap, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AIControlPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Control Center</h1>
          <p className="text-muted-foreground mt-1">
            Centralized AI model management and testing for all platform features
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          AI Central Control
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              AI Models
            </CardTitle>
            <CardDescription>
              Multiple AI providers configured and ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Claude (Primary)</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">OpenAI (Secondary)</span>
                <Badge variant="secondary">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Features Using AI
            </CardTitle>
            <CardDescription>
              Platform features powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• Predictive Analytics</div>
              <div>• Enhanced Messaging</div>
              <div>• Content Generation</div>
              <div>• Churn Prediction</div>
              <div>• Revenue Forecasting</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Configuration
            </CardTitle>
            <CardDescription>
              Current AI configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default Model</span>
                <Badge variant="outline">Claude Sonnet</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Keys</span>
                <Badge variant="default">Configured</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This central control system manages all AI functionality across the platform. 
          Changes to the default model will affect all AI-powered features. Test models 
          thoroughly before switching defaults in production.
        </AlertDescription>
      </Alert>

      <AIModelTester />
    </div>
  );
}