import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users,
  Plus, 
  Clock,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  MoreVertical,
  Filter,
  Search,
  Settings,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import StaffForm from '@/components/staff/StaffForm';
import StaffDetailDialog from '@/components/staff/StaffDetailDialog';
import ScheduleManager from '@/components/staff/ScheduleManager';
import PayrollManager from '@/components/staff/PayrollManager';
import { usePermissions } from '@/hooks/usePermissions';
import ImportButton from '@/components/imports/ImportButton';
import { Skeleton, SkeletonCard, SkeletonAvatar } from '@/components/ui/skeleton';

interface StaffMember {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff' | 'trainer';
  avatar_url?: string;
  created_at: string;
  hire_date?: string | null;
  hourly_rate?: number | null;
  status: 'active' | 'inactive' | 'on_leave';
  certifications?: string[] | null;
  employee_id?: string | null;
  department?: string | null;
}

export default function StaffPage() {
  const { profile } = useAuth();
  const { hasPermission, PERMISSIONS } = usePermissions();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (hasPermission(PERMISSIONS.MANAGE_STAFF)) {
      fetchStaff();
    }
  }, [profile?.organization_id]); // Removed hasPermission from dependencies

  const fetchStaff = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      const { data: staffData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          avatar_url,
          created_at
        `)
        .eq('organization_id', profile.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'trainer'])
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching staff",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Transform data to match interface with defaults for new fields
      const transformedStaff = (staffData || []).map(member => ({
        ...member,
        role: member.role as 'owner' | 'manager' | 'staff' | 'trainer', // Type cast to exclude 'member'
        status: 'active' as const,
        hire_date: null,
        hourly_rate: null,
        certifications: null,
        employee_id: null,
        department: null,
      }));

      setStaff(transformedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setShowDetailDialog(true);
  };

  const canManageStaff = hasPermission(PERMISSIONS.MANAGE_STAFF);

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = `${staffMember.first_name || ''} ${staffMember.last_name || ''} ${staffMember.email} ${staffMember.employee_id || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || staffMember.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getStaffName = (staffMember: StaffMember) => {
    if (staffMember.first_name && staffMember.last_name) {
      return `${staffMember.first_name} ${staffMember.last_name}`;
    }
    return staffMember.email;
  };

  const getStaffInitials = (staffMember: StaffMember) => {
    if (staffMember.first_name && staffMember.last_name) {
      return `${staffMember.first_name[0]}${staffMember.last_name[0]}`.toUpperCase();
    }
    return staffMember.email[0].toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'staff':
        return 'outline';
      case 'trainer':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (!hasPermission(PERMISSIONS.MANAGE_STAFF)) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view staff management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-96" />

        {/* Staff List Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <SkeletonAvatar size="lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage employees, schedules, and payroll
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canManageStaff && (
            <>
              <ImportButton module="staff" onImportComplete={fetchStaff} />
              <Button
                className="bg-gradient-secondary hover:opacity-90"
                onClick={() => setShowStaffForm(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {staff.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Staff</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {staff.filter(s => s.role === 'trainer').length}
            </div>
            <div className="text-sm text-muted-foreground">Trainers</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">
              {staff.filter(s => s.role === 'manager').length}
            </div>
            <div className="text-sm text-muted-foreground">Managers</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">
              {staff.filter(s => s.role === 'staff').length}
            </div>
            <div className="text-sm text-muted-foreground">Support Staff</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={roleFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('all')}
              >
                All Roles
              </Button>
              <Button
                variant={roleFilter === 'trainer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('trainer')}
              >
                Trainers
              </Button>
              <Button
                variant={roleFilter === 'staff' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('staff')}
              >
                Staff
              </Button>
              <Button
                variant={roleFilter === 'manager' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('manager')}
              >
                Managers
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Staff Grid */}
          {filteredStaff.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No staff found' : 'No staff members'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Start by adding your first staff member'
                  }
                </p>
                {!searchTerm && canManageStaff && (
                  <Button 
                    className="bg-gradient-secondary hover:opacity-90"
                    onClick={() => setShowStaffForm(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Staff Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((staffMember) => (
                <Card 
                  key={staffMember.id} 
                  className="gym-card hover:shadow-elevation-2 cursor-pointer"
                  onClick={() => handleStaffClick(staffMember)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={staffMember.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {getStaffInitials(staffMember)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {getStaffName(staffMember)}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={getRoleBadgeVariant(staffMember.role)} className="text-xs">
                              {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-2 h-4 w-4" />
                        <span className="truncate">{staffMember.email}</span>
                      </div>
                      {staffMember.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-4 w-4" />
                          <span>{staffMember.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>
                          Joined {new Date(staffMember.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Role specific info */}
                    <div className="text-xs text-muted-foreground">
                      {staffMember.role === 'trainer' && 'Fitness Professional'}
                      {staffMember.role === 'staff' && 'Support Staff'}
                      {staffMember.role === 'manager' && 'Management Team'}
                      {staffMember.role === 'owner' && 'Owner'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduleManager />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollManager />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
        <DialogContent className="max-w-2xl">
          <StaffForm
            onSuccess={() => {
              setShowStaffForm(false);
              fetchStaff();
            }}
            onCancel={() => setShowStaffForm(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedStaff && (
        <StaffDetailDialog
          staff={selectedStaff}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onUpdate={fetchStaff}
        />
      )}
    </div>
  );
}