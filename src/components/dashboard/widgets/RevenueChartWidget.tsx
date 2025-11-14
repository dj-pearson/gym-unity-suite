import React from 'react';
import { DollarSign } from 'lucide-react';

/**
 * RevenueChartWidget - Placeholder for revenue chart
 */
export function RevenueChartWidget() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <DollarSign className="mx-auto h-12 w-12 opacity-50 mb-4" />
      <p className="font-medium">Revenue analytics coming soon</p>
      <p className="text-sm mt-1">Track monthly and yearly revenue</p>
    </div>
  );
}
