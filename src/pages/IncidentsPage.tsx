import React from 'react';
import { AlertTriangle } from 'lucide-react';
import IncidentReportManager from '@/components/incidents/IncidentReportManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function IncidentsPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_SETTINGS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage incident reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Incident Reports</h1>
            <p className="text-muted-foreground">
              Manage incident reports, insurance claims, and safety investigations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <IncidentReportManager />
    </div>
  );
}