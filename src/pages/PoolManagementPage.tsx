import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoolFacilitiesManager } from '@/components/pools/PoolFacilitiesManager';
import { PoolLaneReservationManager } from '@/components/pools/PoolLaneReservationManager';
import PoolMaintenanceScheduler from '@/components/pools/PoolMaintenanceScheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Calendar, GraduationCap, Shield, Droplets, Wrench } from 'lucide-react';

export default function PoolManagementPage() {
  return (
    <DashboardLayout>
      <SEOHead
        title="Pool & Aquatic Center Management - Complete Swimming Facility Operations"
        description="Comprehensive pool management system for swimming facilities. Manage pool lanes, swim lessons, lifeguard scheduling, water quality testing, and maintenance tracking."
        keywords="pool management, aquatic center, swim lessons, lifeguard scheduling, water quality, pool maintenance, lane reservations"
      />

      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Pool & Aquatic Center Management</h1>
          <p className="text-muted-foreground">
            Complete management system for swimming facilities, lessons, and aquatic programs
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pool Facilities</CardTitle>
              <Waves className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">All operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">12 completed, 6 upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Swim Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">42 enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifeguards On Duty</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">All stations covered</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs defaultValue="facilities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="facilities">Pools</TabsTrigger>
            <TabsTrigger value="reservations">Lane Reservations</TabsTrigger>
            <TabsTrigger value="lessons">Swim Lessons</TabsTrigger>
            <TabsTrigger value="lifeguards">Lifeguards</TabsTrigger>
            <TabsTrigger value="water-quality">Water Quality</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="facilities" className="space-y-6">
            <PoolFacilitiesManager />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <PoolLaneReservationManager />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Swim Lessons Management</CardTitle>
                <CardDescription>
                  Manage swim classes, enrollments, and instructor scheduling
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Swim Lessons System</h3>
                <p className="text-muted-foreground">
                  Comprehensive swim lesson management and enrollment system coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifeguards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifeguard Scheduling</CardTitle>
                <CardDescription>
                  Manage lifeguard shifts, certifications, and coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Lifeguard Management</h3>
                <p className="text-muted-foreground">
                  Lifeguard scheduling and certification tracking coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="water-quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Water Quality Testing</CardTitle>
                <CardDescription>
                  Track pH levels, chlorine, and chemical balance compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Water Quality Monitoring</h3>
                <p className="text-muted-foreground">
                  Water quality testing and compliance tracking coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pool Maintenance</CardTitle>
                <CardDescription>
                  Schedule and track pool maintenance, cleaning, and repairs
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Maintenance Management</h3>
                <p className="text-muted-foreground">
                  Pool maintenance scheduling and tracking system coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}