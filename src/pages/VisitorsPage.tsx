import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Ticket } from 'lucide-react';
import GuestPassManager from '@/components/visitors/GuestPassManager';
import VisitorCheckInManager from '@/components/visitors/VisitorCheckInManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function VisitorsPage() {
  const { hasPermission, PERMISSIONS } = usePermissions();

  if (!hasPermission(PERMISSIONS.VIEW_MEMBERS)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage visitors and guest passes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Visitor Management</h1>
            <p className="text-muted-foreground">
              Manage guest passes, visitor check-ins, and daily facility access
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for different visitor management functions */}
      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkin" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Visitor Check-In</span>
          </TabsTrigger>
          <TabsTrigger value="passes" className="flex items-center space-x-2">
            <Ticket className="h-4 w-4" />
            <span>Guest Passes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <VisitorCheckInManager />
        </TabsContent>

        <TabsContent value="passes">
          <GuestPassManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}