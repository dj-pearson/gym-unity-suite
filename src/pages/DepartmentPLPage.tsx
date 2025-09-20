import { TrendingUp } from 'lucide-react';
import DepartmentPLManager from '@/components/analytics/DepartmentPLManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function DepartmentPLPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_REPORTS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view P&L reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Department P&L</h1>
            <p className="text-muted-foreground">
              Track revenue, costs, and profitability by department
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <DepartmentPLManager />
    </div>
  );
}