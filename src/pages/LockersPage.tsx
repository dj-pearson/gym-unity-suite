import React from 'react';
import { Lock } from 'lucide-react';
import LockerManager from '@/components/lockers/LockerManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function LockersPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_SETTINGS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage lockers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Locker Management</h1>
            <p className="text-muted-foreground">
              Manage locker inventory, rentals, and maintenance
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <LockerManager />
    </div>
  );
}