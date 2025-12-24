import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Shield,
  Key,
  Lock,
  Unlock,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  mfaEnabled: boolean;
  permissions: string[];
  loginAttempts: number;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isCustom: boolean;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

// Role definitions - these are based on the user_role enum in the database
const SYSTEM_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full system access and business ownership',
    permissions: ['all'],
    userCount: 0,
    isCustom: false
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Location and staff management',
    permissions: ['members.read', 'members.write', 'classes.manage', 'staff.manage', 'billing.read', 'reports.view'],
    userCount: 0,
    isCustom: false
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'General staff access',
    permissions: ['members.read', 'members.write', 'classes.manage', 'checkins.manage'],
    userCount: 0,
    isCustom: false
  },
  {
    id: 'trainer',
    name: 'Trainer',
    description: 'Class instruction access',
    permissions: ['classes.read', 'classes.manage', 'members.read'],
    userCount: 0,
    isCustom: false
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Member self-service access',
    permissions: ['classes.read'],
    userCount: 0,
    isCustom: false
  }
];

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'members.read', name: 'View Members', category: 'Members', description: 'View member profiles and information' },
  { id: 'members.write', name: 'Manage Members', category: 'Members', description: 'Create, edit, and delete member accounts' },
  { id: 'classes.read', name: 'View Classes', category: 'Classes', description: 'View class schedules and bookings' },
  { id: 'classes.manage', name: 'Manage Classes', category: 'Classes', description: 'Create and modify class schedules' },
  { id: 'billing.read', name: 'View Billing', category: 'Billing', description: 'View payment and subscription data' },
  { id: 'billing.manage', name: 'Manage Billing', category: 'Billing', description: 'Process payments and manage subscriptions' },
  { id: 'staff.manage', name: 'Manage Staff', category: 'Staff', description: 'Manage employee accounts and schedules' },
  { id: 'reports.view', name: 'View Reports', category: 'Analytics', description: 'Access analytics and reporting' },
  { id: 'checkins.manage', name: 'Manage Check-ins', category: 'Operations', description: 'Process member check-ins and access' }
];

export default function AccessControlManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccess | null>(null);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Fetch users from the database
  const { data: usersData = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['access-control-users', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, status, updated_at')
        .eq('organization_id', profile.organization_id)
        .order('role', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!profile?.organization_id,
    staleTime: 30 * 1000,
  });

  // Transform database users to UserAccess format
  const users: UserAccess[] = useMemo(() => {
    return usersData.map((user) => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
      role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member',
      status: (user.status as 'active' | 'inactive' | 'suspended') || 'active',
      lastLogin: user.updated_at, // Using updated_at as proxy for activity
      mfaEnabled: false, // MFA not implemented in current schema
      permissions: SYSTEM_ROLES.find(r => r.id === user.role)?.permissions || [],
      loginAttempts: 0, // Not tracked in current schema
    }));
  }, [usersData]);

  // Calculate role user counts
  const roles: Role[] = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    usersData.forEach((user) => {
      const role = user.role || 'member';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    return SYSTEM_ROLES.map((role) => ({
      ...role,
      userCount: roleCounts[role.id] || 0,
    }));
  }, [usersData]);

  // Mutation to update user status
  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      if (!profile?.organization_id) throw new Error('No organization ID');

      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control-users'] });
      toast({
        title: 'User Status Updated',
        description: 'User access has been modified successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
      console.error('Error updating user status:', error);
    },
  });

  // Mutation to update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!profile?.organization_id) throw new Error('No organization ID');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .eq('organization_id', profile.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control-users'] });
      toast({
        title: 'User Role Updated',
        description: 'User role has been changed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      console.error('Error updating user role:', error);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStatusIcon = (user: UserAccess) => {
    if (user.loginAttempts >= 3) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (user.status === 'active') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUserStatus.mutate({ userId, status: newStatus });
  };

  const handleToggleMFA = (userId: string) => {
    // MFA is not implemented in the current schema
    toast({
      title: 'MFA Not Available',
      description: 'Multi-factor authentication is not yet implemented',
      variant: 'destructive',
    });
  };

  const handleResetLoginAttempts = (userId: string) => {
    // Login attempts tracking is not implemented in current schema
    toast({
      title: 'Feature Not Available',
      description: 'Login attempt tracking is not yet implemented',
      variant: 'destructive',
    });
  };

  const handleAddRole = () => {
    // Custom roles are not supported - roles are defined in the database enum
    toast({
      title: 'Custom Roles Not Supported',
      description: 'Roles are managed at the database level. Contact support to add new roles.',
      variant: 'destructive',
    });
    setShowAddRole(false);
  };

  const handleDeleteRole = (roleId: string) => {
    // Roles are defined in the database enum and cannot be deleted
    toast({
      title: 'Cannot Delete System Role',
      description: 'System roles cannot be deleted',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access Control Management</h2>
          <p className="text-muted-foreground">
            Manage user permissions, roles, and security settings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchUsers()}
          disabled={usersLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Access Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Access Management
          </CardTitle>
          <CardDescription>
            Monitor and control user access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found in this organization
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user)}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.loginAttempts > 0 && (
                          <p className="text-xs text-red-600">{user.loginAttempts} failed attempts</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={user.mfaEnabled} 
                        onCheckedChange={() => handleToggleMFA(user.id)}
                      />
                      <span className="text-sm">{user.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(user.lastLogin), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </Button>
                      {user.loginAttempts > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetLoginAttempts(user.id)}
                        >
                          Reset Attempts
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Roles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Role Management
              </CardTitle>
              <CardDescription>
                Define and manage user roles and permissions
              </CardDescription>
            </div>
            <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role Name *</Label>
                    <Input
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Front Desk Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of role responsibilities"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions *</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={roleForm.permissions.includes(permission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRoleForm(prev => ({ 
                                  ...prev, 
                                  permissions: [...prev.permissions, permission.id] 
                                }));
                              } else {
                                setRoleForm(prev => ({ 
                                  ...prev, 
                                  permissions: prev.permissions.filter(p => p !== permission.id) 
                                }));
                              }
                            }}
                          />
                          <label htmlFor={permission.id} className="text-sm">
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddRole(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRole}>
                      Create Role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    {role.isCustom && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.userCount > 0}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Users:</span>
                      <Badge variant="outline">{role.userCount}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.includes('all') ? (
                          <Badge variant="default" className="text-xs">All Permissions</Badge>
                        ) : (
                          role.permissions.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.name || perm}
                            </Badge>
                          ))
                        )}
                        {role.permissions.length > 3 && !role.permissions.includes('all') && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}