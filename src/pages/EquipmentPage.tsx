import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EquipmentManager from '@/components/equipment/EquipmentManager';
import MaintenanceScheduler from '@/components/equipment/MaintenanceScheduler';
import FacilityAreaManager from '@/components/equipment/FacilityAreaManager';
import IncidentReports from '@/components/equipment/IncidentReports';
import VendorManager from '@/components/equipment/VendorManager';
import { 
  Wrench, 
  Calendar, 
  Building, 
  AlertTriangle, 
  Users, 
  Activity,
  Zap,
  Shield
} from 'lucide-react';

export default function EquipmentPage() {
  console.log('EquipmentPage: Rendering');
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('equipment');

  if (!profile) {
    return <div>Loading...</div>;
  }

  const stats = [
    {
      title: "Total Equipment",
      value: "127",
      change: "+3 this month",
      icon: Wrench,
      color: "text-blue-600"
    },
    {
      title: "Maintenance Due",
      value: "8",
      change: "Next: Tomorrow",
      icon: Calendar,
      color: "text-orange-600"
    },
    {
      title: "Facility Areas",
      value: "12",
      change: "All operational",
      icon: Building,
      color: "text-green-600"
    },
    {
      title: "Open Incidents",
      value: "2",
      change: "1 high priority",
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Equipment & Facility Management</h2>
        <Badge variant="outline" className="ml-auto">
          <Activity className="w-4 h-4 mr-2" />
          System Status: Operational
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Vendors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Equipment Inventory
              </CardTitle>
              <CardDescription>
                Manage your gym's equipment inventory, track specifications, and monitor usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Maintenance Scheduling
              </CardTitle>
              <CardDescription>
                Schedule maintenance tasks, track completion, and manage service history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceScheduler />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Facility Management
              </CardTitle>
              <CardDescription>
                Manage facility areas, track utilization, and schedule cleaning tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacilityAreaManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safety & Incident Reports
              </CardTitle>
              <CardDescription>
                Report and track safety incidents, manage follow-ups, and ensure compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentReports />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Vendor Management
              </CardTitle>
              <CardDescription>
                Manage service providers, track performance, and handle contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}