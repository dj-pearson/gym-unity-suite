import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChildProfilesManager } from "@/components/childcare/ChildProfilesManager";
import { ChildcareCheckInManager } from "@/components/childcare/ChildcareCheckInManager";
import { ChildcareActivitiesManager } from "@/components/childcare/ChildcareActivitiesManager";
import { SEOHead } from "@/components/seo/SEOHead";
import { Baby, UserCheck, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChildcarePage() {
  return (
    <>
      <SEOHead
        title="Childcare Management - RepClub"
        description="Comprehensive childcare management system. Handle child profiles, check-ins, activity scheduling, and staff ratio tracking."
        keywords="childcare management, child check-in, activity scheduling, staff ratio, family services"
      />
      
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Baby className="h-8 w-8 mr-3 text-primary" />
            Childcare Management
          </h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children Enrolled</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">3 completed, 3 remaining</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff on Duty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Perfect 1:3 ratio</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="checkin" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Check-ins
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Daily Check-ins
                </CardTitle>
                <CardDescription>
                  Manage child check-ins and check-outs with real-time tracking and condition monitoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChildcareCheckInManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Child Profiles
                </CardTitle>
                <CardDescription>
                  Manage comprehensive child profiles including medical information, emergency contacts, and special requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChildProfilesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activity Scheduling
                </CardTitle>
                <CardDescription>
                  Schedule age-appropriate activities, manage staff ratios, and track participation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChildcareActivitiesManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}