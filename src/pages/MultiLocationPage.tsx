import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationManager } from '@/components/location/LocationManager';
import { CrossLocationTransferManager } from '@/components/location/CrossLocationTransferManager';
import { StaffLocationAssignments } from '@/components/location/StaffLocationAssignments';
import { LocationAnalyticsDashboard } from '@/components/location/LocationAnalyticsDashboard';
import { Building2, ArrowRightLeft, Users, BarChart3 } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MultiLocationPage() {
  const [activeTab, setActiveTab] = useState('locations');

  return (
    <>
      <SEOHead 
        title="Multi-Location Management - Gym Chain Operations"
        description="Comprehensive multi-location management system for gym chains. Manage facilities, staff assignments, transfers, and analytics across all locations."
      />
      
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Multi-Location Management</h1>
            <p className="text-muted-foreground">
              Centralized management for gym chains and multi-location facilities
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Locations</span>
                <span className="sm:hidden">Sites</span>
              </TabsTrigger>
              <TabsTrigger value="transfers" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Transfers</span>
                <span className="sm:hidden">Moves</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Staff</span>
                <span className="sm:hidden">Staff</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="space-y-4">
              <LocationManager />
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4">
              <CrossLocationTransferManager />
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <StaffLocationAssignments />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <LocationAnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}