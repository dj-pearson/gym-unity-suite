import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Package, Settings, Plus } from 'lucide-react';
import PersonalTrainingScheduler from '@/components/training/PersonalTrainingScheduler';
import TrainingPackageManager from '@/components/training/TrainingPackageManager';
import TrainerAvailabilityManager from '@/components/training/TrainerAvailabilityManager';
import TrainingSessionManager from '@/components/training/TrainingSessionManager';
import { useToast } from '@/hooks/use-toast';

export default function PersonalTrainingPage() {
  const permissions = usePermissions();
  const canManageTraining = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff');
  const canViewTraining = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff') || permissions.hasRole('trainer') || permissions.hasRole('member');
  const isTrainer = permissions.hasRole('trainer');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sessions');

  if (!canViewTraining) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view personal training.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal Training</h1>
          <p className="text-muted-foreground">
            Manage personal training sessions, packages, and trainer availability
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <PersonalTrainingScheduler />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          {canManageTraining ? (
            <TrainingPackageManager />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Training Packages</CardTitle>
                <CardDescription>
                  View available training packages and purchase options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can view and purchase training packages, but cannot manage them.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          {canManageTraining || isTrainer ? (
            <TrainerAvailabilityManager />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Trainer Availability</CardTitle>
                <CardDescription>
                  View when trainers are available for sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can view trainer availability when booking sessions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          {canManageTraining ? (
            <TrainingSessionManager />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>
                  Administrative tools for managing training sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You don't have permission to access session management tools.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}