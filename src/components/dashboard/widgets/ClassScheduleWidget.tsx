import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * ClassScheduleWidget - Placeholder for class schedule
 */
export function ClassScheduleWidget() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Calendar className="mx-auto h-12 w-12 opacity-50 mb-4" />
      <p className="font-medium">Class schedule coming soon</p>
      <p className="text-sm mt-1">View and manage today's classes</p>
    </div>
  );
}
