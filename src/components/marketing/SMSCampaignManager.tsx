import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Phone } from 'lucide-react';

export default function SMSCampaignManager() {
  return (
    <div className="space-y-6">
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>SMS Campaign Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">SMS Campaigns Coming Soon</h3>
          <p className="text-muted-foreground">
            SMS marketing campaigns, automated reminders, and two-way messaging 
            features will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}