import React from 'react';
import { BarChart3 } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your gym's performance
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
}