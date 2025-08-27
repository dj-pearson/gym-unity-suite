import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadAttributionManager } from '@/components/crm/LeadAttributionManager';
import { UserX, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AttributionPage() {
  const [showAttributionManager, setShowAttributionManager] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Attribution</h1>
          <p className="text-muted-foreground">
            Manage lead attribution disputes and manual reassignments
          </p>
        </div>
        <Button onClick={() => setShowAttributionManager(true)}>
          <UserX className="mr-2 h-4 w-4" />
          Manage Attribution
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Disputes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Disputes resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attribution Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Leads needing review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Manual Reassignments
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attribution Management</CardTitle>
          <CardDescription>
            Handle lead attribution disputes and perform manual lead reassignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            When leads sign up through multiple channels or there are disputes about attribution, 
            use this tool to review, reassign, and manage lead ownership fairly.
          </p>
          <Button onClick={() => setShowAttributionManager(true)} variant="outline">
            Open Attribution Manager
          </Button>
        </CardContent>
      </Card>

      <LeadAttributionManager
        isOpen={showAttributionManager}
        onClose={() => setShowAttributionManager(false)}
      />
    </div>
  );
}