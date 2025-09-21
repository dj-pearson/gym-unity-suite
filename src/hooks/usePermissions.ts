import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'owner' | 'manager' | 'staff' | 'trainer' | 'member';

export interface Permission {
  readonly roles: readonly UserRole[];
  description?: string;
}

// Define permissions for different features
export const PERMISSIONS = {
  // Dashboard access
  VIEW_DASHBOARD: { roles: ['owner', 'manager', 'staff', 'trainer', 'member'] },
  
  // Member management
  VIEW_MEMBERS: { roles: ['owner', 'manager', 'staff'] },
  CREATE_MEMBERS: { roles: ['owner', 'manager', 'staff'] },
  EDIT_MEMBERS: { roles: ['owner', 'manager', 'staff'] },
  DELETE_MEMBERS: { roles: ['owner', 'manager'] },
  
  // CRM & Leads
  VIEW_CRM: { roles: ['owner', 'manager', 'staff'] },
  CREATE_LEADS: { roles: ['owner', 'manager', 'staff'] },
  EDIT_LEADS: { roles: ['owner', 'manager', 'staff'] },
  DELETE_LEADS: { roles: ['owner', 'manager'] },
  
  // Classes & Scheduling
  VIEW_CLASSES: { roles: ['owner', 'manager', 'staff', 'trainer', 'member'] },
  CREATE_CLASSES: { roles: ['owner', 'manager', 'staff'] },
  EDIT_CLASSES: { roles: ['owner', 'manager', 'staff', 'trainer'] },
  DELETE_CLASSES: { roles: ['owner', 'manager'] },
  BOOK_CLASSES: { roles: ['member', 'staff', 'trainer'] },
  
  // Check-ins
  VIEW_CHECKINS: { roles: ['owner', 'manager', 'staff'] },
  MANUAL_CHECKIN: { roles: ['owner', 'manager', 'staff'] },
  
  // Billing & Payments
  VIEW_BILLING: { roles: ['owner', 'manager', 'staff'] },
  PROCESS_PAYMENTS: { roles: ['owner', 'manager', 'staff'] },
  REFUND_PAYMENTS: { roles: ['owner', 'manager'] },
  
  // Reports & Analytics
  VIEW_REPORTS: { roles: ['owner', 'manager'] },
  EXPORT_DATA: { roles: ['owner', 'manager'] },
  
  // Retail/POS
  VIEW_RETAIL: { roles: ['owner', 'manager', 'staff'] },
  PROCESS_SALES: { roles: ['owner', 'manager', 'staff'] },
  MANAGE_INVENTORY: { roles: ['owner', 'manager'] },
  
  // Corporate Management
  VIEW_CORPORATE: { roles: ['owner', 'manager', 'staff'] },
  CREATE_CORPORATE_ACCOUNTS: { roles: ['owner', 'manager', 'staff'] },
  EDIT_CORPORATE_ACCOUNTS: { roles: ['owner', 'manager', 'staff'] },
  DELETE_CORPORATE_ACCOUNTS: { roles: ['owner', 'manager'] },
  MANAGE_CORPORATE_BILLING: { roles: ['owner', 'manager'] },

  // Settings & Configuration
  VIEW_SETTINGS: { roles: ['owner', 'manager'] },
  EDIT_ORGANIZATION: { roles: ['owner'] },
  MANAGE_STAFF: { roles: ['owner', 'manager'] },
  MANAGE_LOCATIONS: { roles: ['owner'] },
} as const;

export const usePermissions = () => {
  const { profile } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!profile?.role) return false;
    return permission.roles.includes(profile.role);
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!profile?.role) return false;
    return roles.includes(profile.role);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['owner', 'manager']);
  };

  const isOwner = (): boolean => {
    return hasRole('owner');
  };

  const isStaff = (): boolean => {
    return hasAnyRole(['owner', 'manager', 'staff']);
  };

  const isMember = (): boolean => {
    return hasRole('member');
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isOwner,
    isStaff,
    isMember,
    userRole: profile?.role,
    PERMISSIONS,
  };
};