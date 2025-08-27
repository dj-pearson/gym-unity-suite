import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, FileText, Clock } from 'lucide-react';
import SubscriptionStatus from '@/components/membership/SubscriptionStatus';
import { SubscriptionManager } from '@/components/membership/SubscriptionManager';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-gradient-secondary rounded-lg">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your membership payments and subscription details
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Subscription */}
        <div className="space-y-6">
          <SubscriptionStatus />
        </div>

        {/* Subscription Management */}
        <div className="space-y-6">
          <SubscriptionManager />
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="gym-card opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              View and download your payment receipts and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Billing Reminders
            </CardTitle>
            <CardDescription>
              Set up automatic reminders for upcoming payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}