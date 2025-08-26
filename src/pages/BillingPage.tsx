import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Receipt,
  AlertCircle,
  Plus
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-success to-green-400 rounded-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
            <p className="text-muted-foreground">
              Manage memberships, payments, and financial reporting
            </p>
          </div>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value="$12,450"
          change={{ value: "12%", type: "positive" }}
          icon={DollarSign}
          gradient="success"
        />
        <StatCard
          title="Active Subscriptions"
          value="234"
          change={{ value: "5%", type: "positive" }}
          icon={CreditCard}
          gradient="primary"
        />
        <StatCard
          title="Failed Payments"
          value="8"
          change={{ value: "2", type: "negative" }}
          icon={AlertCircle}
          gradient="warning"
        />
        <StatCard
          title="Collection Rate"
          value="96.5%"
          change={{ value: "1.2%", type: "positive" }}
          icon={TrendingUp}
          gradient="secondary"
        />
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="mr-2 h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Transaction history and payment tracking will be available here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Revenue trends and financial insights will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}