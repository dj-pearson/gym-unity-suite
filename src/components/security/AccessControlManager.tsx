import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Clock
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

const MOCK_USERS: UserAccess[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@gymclub.com',
    role: 'Admin',
    status: 'active',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    mfaEnabled: true,
    permissions: ['all'],
    loginAttempts: 0
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@gymclub.com',
    role: 'Staff',
    status: 'active',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    mfaEnabled: false,
    permissions: ['members.read', 'classes.manage'],
    loginAttempts: 2
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike@gymclub.com',
    role: 'Trainer',
    status: 'suspended',
    lastLogin: new Date(Date.now() - 86400000 * 3).toISOString(),
    mfaEnabled: true,
    permissions: ['classes.read', 'members.read'],
    loginAttempts: 5
  }
];

const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access',
    permissions: ['all'],
    userCount: 2,
    isCustom: false
  },
  {
    id: '2',
    name: 'Staff',
    description: 'General staff access',
    permissions: ['members.read', 'members.write', 'classes.manage'],
    userCount: 5,
    isCustom: false
  },
  {
    id: '3',
    name: 'Trainer',
    description: 'Class instruction access',
    permissions: ['classes.read', 'members.read'],
    userCount: 8,
    isCustom: false
  },
  {
    id: '4',
    name: 'Front Desk',
    description: 'Reception and check-in access',
    permissions: ['checkins.manage', 'members.read'],
    userCount: 3,
    isCustom: true
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
  const [users, setUsers] = useState<UserAccess[]>(MOCK_USERS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [loading, setLoading] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccess | null>(null);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
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
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
        : user
    ));

    toast({
      title: "User Status Updated",
      description: "User access has been modified successfully"
    });
  };

  const handleToggleMFA = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, mfaEnabled: !user.mfaEnabled }
        : user
    ));

    toast({
      title: "MFA Settings Updated",
      description: "Multi-factor authentication settings have been changed"
    });
  };

  const handleResetLoginAttempts = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, loginAttempts: 0 }
        : user
    ));

    toast({
      title: "Login Attempts Reset",
      description: "Failed login attempts have been cleared"
    });
  };

  const handleAddRole = () => {
    if (!roleForm.name || !roleForm.description || roleForm.permissions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newRole: Role = {
      id: Date.now().toString(),
      ...roleForm,
      userCount: 0,
      isCustom: true
    };

    setRoles(prev => [...prev, newRole]);
    setShowAddRole(false);
    setRoleForm({ name: '', description: '', permissions: [] });

    toast({
      title: "Role Created",
      description: "New role has been created successfully"
    });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.userCount > 0) {
      toast({
        title: "Cannot Delete Role",
        description: "Role is assigned to users and cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    setRoles(prev => prev.filter(role => role.id !== roleId));
    toast({
      title: "Role Deleted",
      description: "Role has been removed successfully"
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
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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