import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Badge as BadgeIcon,
  Clock,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';

interface StaffMember {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff' | 'trainer';
  avatar_url?: string;
  created_at: string;
  hire_date?: string;
  hourly_rate?: number;
  status: 'active' | 'inactive' | 'on_leave';
  certifications?: string[];
  employee_id?: string;
  department?: string;
}

interface StaffDetailDialogProps {
  staff: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function StaffDetailDialog({ staff, open, onOpenChange, onUpdate }: StaffDetailDialogProps) {
  const [loading, setLoading] = useState(false);

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
        return 'default'; // Changed from 'success' to 'default'
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'; // Changed from 'success' to 'default'
      case 'inactive':
        return 'destructive';
      case 'on_leave':
        return 'secondary'; // Changed from 'warning' to 'secondary'
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={staff.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-white">
                {getStaffInitials(staff)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-xl font-semibold text-foreground">
                {getStaffName(staff)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getRoleBadgeVariant(staff.role)}>
                  {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(staff.status)}>
                  {staff.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="gym-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{staff.email}</div>
                    </div>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{staff.phone}</div>
                      </div>
                    </div>
                  )}
                  {staff.employee_id && (
                    <div className="flex items-center space-x-3">
                      <BadgeIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Employee ID</div>
                        <div className="font-medium">{staff.employee_id}</div>
                      </div>
                    </div>
                  )}
                  {staff.department && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Department</div>
                        <div className="font-medium">{staff.department}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card className="gym-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Employment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {staff.hire_date && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Hire Date</div>
                        <div className="font-medium">
                          {new Date(staff.hire_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {staff.hourly_rate && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Hourly Rate</div>
                        <div className="font-medium">${staff.hourly_rate}/hour</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Member Since</div>
                      <div className="font-medium">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certifications */}
            {staff.certifications && staff.certifications.length > 0 && (
              <Card className="gym-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BadgeIcon className="h-5 w-5" />
                    <span>Certifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {staff.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="gym-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">8.5</div>
                  <div className="text-sm text-muted-foreground">Performance Score</div>
                </CardContent>
              </Card>
              <Card className="gym-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">42</div>
                  <div className="text-sm text-muted-foreground">Hours This Week</div>
                </CardContent>
              </Card>
              <Card className="gym-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-secondary">95%</div>
                  <div className="text-sm text-muted-foreground">Attendance Rate</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="gym-card">
              <CardContent className="p-6 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Schedule Management</h3>
                <p className="text-muted-foreground">
                  Schedule management features will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="gym-card">
              <CardContent className="p-6 text-center">
                <BadgeIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Performance Tracking</h3>
                <p className="text-muted-foreground">
                  Performance analytics and tracking features coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="gym-card">
              <CardContent className="p-6 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Document Management</h3>
                <p className="text-muted-foreground">
                  Employee document management system will be implemented soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}