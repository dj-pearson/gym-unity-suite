import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Crown, 
  Users, 
  UserCog, 
  Dumbbell, 
  User,
  TestTube,
  Shield,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react';

const roleOptions = [
  { value: 'owner', label: 'Owner', icon: Crown, description: 'Full system access' },
  { value: 'manager', label: 'Manager', icon: Users, description: 'Management permissions' },
  { value: 'staff', label: 'Staff', icon: UserCog, description: 'Staff operations' },
  { value: 'trainer', label: 'Trainer', icon: Dumbbell, description: 'Training & classes' },
  { value: 'member', label: 'Member', icon: User, description: 'Member portal' },
];

const testAccounts = [
  { email: 'owner@test.com', role: 'owner', name: 'Sarah Johnson' },
  { email: 'manager@test.com', role: 'manager', name: 'Mike Davis' },
  { email: 'staff@test.com', role: 'staff', name: 'Emily Chen' },
  { email: 'trainer@test.com', role: 'trainer', name: 'Alex Rodriguez' },
  { email: 'member@test.com', role: 'member', name: 'John Smith' },
];

export const RoleTestingPanel: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async () => {
    if (!selectedRole || !profile?.id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole as any,
          organization_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', // FitnessPro Gym
          location_id: 'a290f1ee-6c54-4b01-90e6-d701748f0851'
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast.success(`Role updated to ${selectedRole}!`, {
        description: 'You can now test features for this role.'
      });
    } catch (error) {
      console.error('Role update error:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentRoleInfo = roleOptions.find(r => r.value === profile?.role);
  const selectedRoleInfo = roleOptions.find(r => r.value === selectedRole);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-hero text-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <TestTube className="w-6 h-6" />
            <div>
              <CardTitle>Authentication Testing Panel</CardTitle>
              <CardDescription className="text-white/80">
                Test role-based access control and permissions across the platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {currentRoleInfo?.icon && (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <currentRoleInfo.icon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {profile.first_name} {profile.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{profile.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {profile.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentRoleInfo?.description}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Profile loading...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Role Switching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role to test" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <role.icon className="w-4 h-4" />
                      <span>{role.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedRoleInfo && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">{selectedRoleInfo.label}</div>
                <div className="text-xs text-muted-foreground">{selectedRoleInfo.description}</div>
              </div>
            )}

            <Button 
              onClick={handleRoleUpdate} 
              disabled={!selectedRole || isUpdating || selectedRole === profile?.role}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Switch to {selectedRoleInfo?.label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Account Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Quick Test Setup Guide
          </CardTitle>
          <CardDescription>
            Ready-to-use test accounts for comprehensive role testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testAccounts.map((account) => {
              const roleInfo = roleOptions.find(r => r.value === account.role);
              return (
                <div key={account.email} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {roleInfo?.icon && (
                      <roleInfo.icon className="w-4 h-4 text-primary" />
                    )}
                    <Badge variant="outline" className="capitalize">
                      {account.role}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">{account.name}</div>
                  <div className="text-xs text-muted-foreground">{account.email}</div>
                  <div className="text-xs text-muted-foreground">Password: [Contact Admin]</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm">
              <strong>Testing Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Create accounts with these emails or switch your current role above</li>
                <li>Test navigation and permission-based features for each role</li>
                <li>Verify that role restrictions work properly</li>
                <li>Check that data visibility respects organizational boundaries</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Testing Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Testing Areas</CardTitle>
          <CardDescription>
            Test these key areas to verify role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Owner/Manager Access</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dashboard with full analytics</li>
                <li>• Member management (view, edit, delete)</li>
                <li>• Staff management and payroll</li>
                <li>• Financial reports and billing</li>
                <li>• System settings and integrations</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Staff/Trainer Access</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Limited member views</li>
                <li>• Class scheduling and management</li>
                <li>• Check-in operations</li>
                <li>• Basic reporting access</li>
                <li>• No financial or staff management</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Member Access</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Personal dashboard and profile</li>
                <li>• Class booking and history</li>
                <li>• Billing information view</li>
                <li>• Notification preferences</li>
                <li>• No access to admin features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};