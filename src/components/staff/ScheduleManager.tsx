import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

export default function ScheduleManager() {
  return (
    <div className="space-y-6">
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Staff Schedule Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            Advanced staff scheduling features including drag-and-drop calendar,
            availability tracking, and shift management will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}