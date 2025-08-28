import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SecurityDashboard from '@/components/security/SecurityDashboard';
import AccessControlManager from '@/components/security/AccessControlManager';
import ComplianceManager from '@/components/security/ComplianceManager';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function SecurityPage() {
  const { isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access security settings. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security & Compliance</h1>
        <p className="text-muted-foreground">
          Comprehensive security management and compliance monitoring for your gym management platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="access-control" className="space-y-6">
          <AccessControlManager />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}