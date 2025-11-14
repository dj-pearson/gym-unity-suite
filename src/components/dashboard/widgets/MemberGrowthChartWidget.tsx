import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * MemberGrowthChartWidget - Placeholder for member growth chart
 *
 * TODO: Integrate charting library (recharts, Chart.js, etc.)
 */
export function MemberGrowthChartWidget() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <TrendingUp className="mx-auto h-12 w-12 opacity-50 mb-4" />
      <p className="font-medium">Growth analytics coming soon</p>
      <p className="text-sm mt-1">Track member acquisition over time</p>
    </div>
  );
}
