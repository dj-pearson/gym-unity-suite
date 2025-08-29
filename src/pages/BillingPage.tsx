import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, FileText, Clock, Zap, Receipt } from 'lucide-react';
import SubscriptionStatus from '@/components/membership/SubscriptionStatus';
import { SubscriptionManager } from '@/components/membership/SubscriptionManager';
import { InvoiceGenerator } from '@/components/billing/InvoiceGenerator';
import { BillingAutomation } from '@/components/billing/BillingAutomation';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-gradient-secondary rounded-lg">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing Management</h1>
          <p className="text-muted-foreground">
            Comprehensive billing, invoicing, and payment automation
          </p>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceGenerator />
        </TabsContent>

        <TabsContent value="automation">
          <BillingAutomation />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View and download your payment receipts and transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Payment history will be displayed here</p>
                <p className="text-xs text-muted-foreground mt-2">Feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}