import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CertificationRequirementsManager } from '@/components/staff/CertificationRequirementsManager';
import { StaffCertificationsManager } from '@/components/staff/StaffCertificationsManager';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

export default function StaffCertificationPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.MANAGE_STAFF)) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access staff certification management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Staff Certification Management</h1>
        <p className="text-muted-foreground">
          Manage certification requirements and track staff compliance for operational safety and regulatory compliance.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Keep certifications up to date to ensure compliance with safety regulations 
          and maintain operational standards. Set up renewal reminders to prevent lapses.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="certifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certifications">Staff Certifications</TabsTrigger>
          <TabsTrigger value="requirements">Certification Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications">
          <StaffCertificationsManager />
        </TabsContent>

        <TabsContent value="requirements">
          <CertificationRequirementsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}