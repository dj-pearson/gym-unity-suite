import { DollarSign } from 'lucide-react';
import ExpenseManager from '@/components/billing/ExpenseManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function ExpenseTrackingPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_SETTINGS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage expenses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expense Tracking</h1>
            <p className="text-muted-foreground">
              Track business expenses, manage vendors, and monitor budgets
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ExpenseManager />
    </div>
  );
}