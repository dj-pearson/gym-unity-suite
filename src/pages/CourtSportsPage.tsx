import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourtSportsManager } from '@/components/courts/CourtSportsManager';
import { CourtReservationManager } from '@/components/courts/CourtReservationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Wrench, Trophy } from 'lucide-react';

export default function CourtSportsPage() {
  return (
    <DashboardLayout>
      <SEOHead
        title="Court Sports Management - Comprehensive Sports Facility Management"
        description="Manage tennis, pickleball, racquetball courts and other sports facilities. Handle court reservations, equipment checkout, tournaments, and maintenance scheduling."
        keywords="court management, sports facility, tennis court booking, pickleball reservations, equipment rental, tournament management"
      />

      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Court Sports Management</h1>
          <p className="text-muted-foreground">
            Complete management system for tennis, pickleball, racquetball, and other court sports facilities
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Available for booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">8 completed, 16 upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Rented</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">5 returned, 3 outstanding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Registration ongoing</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs defaultValue="courts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          </TabsList>

          <TabsContent value="courts" className="space-y-6">
            <CourtSportsManager />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <CourtReservationManager />
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Management</CardTitle>
                <CardDescription>
                  Manage sports equipment inventory and checkout system
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Equipment Management</h3>
                <p className="text-muted-foreground">
                  Equipment checkout and inventory management coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Management</CardTitle>
                <CardDescription>
                  Organize and manage sports tournaments and competitions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tournament System</h3>
                <p className="text-muted-foreground">
                  Tournament management and bracket generation coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}