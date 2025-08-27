import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SalespersonCommissionManager } from '@/components/crm/SalespersonCommissionManager';
import { DollarSign, Settings, Users } from 'lucide-react';

export default function CommissionsPage() {
  const [showCommissionManager, setShowCommissionManager] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Management</h1>
          <p className="text-muted-foreground">
            Manage salesperson commissions, rates, and settings
          </p>
        </div>
        <Button onClick={() => setShowCommissionManager(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Manage Commissions
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commission Structure
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Commission system enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Salespeople
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              With commission plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Commissions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              Pending calculations
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Overview</CardTitle>
          <CardDescription>
            Set up and manage commission structures for your sales team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Use the Commission Manager to configure individual salesperson commission rates, 
            set organizational defaults, and manage commission calculations.
          </p>
          <Button onClick={() => setShowCommissionManager(true)} variant="outline">
            Open Commission Manager
          </Button>
        </CardContent>
      </Card>

      <SalespersonCommissionManager
        isOpen={showCommissionManager}
        onClose={() => setShowCommissionManager(false)}
      />
    </div>
  );
}