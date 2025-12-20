import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import ImportButton from '@/components/imports/ImportButton';

interface EquipmentStats {
  totalEquipment: number;
  equipmentGrowth: number;
  maintenanceDue: number;
  nextMaintenance: string;
  facilityAreas: number;
  openIncidents: number;
  highPriorityIncidents: number;
}

export default function EquipmentPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('equipment');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EquipmentStats>({
    totalEquipment: 0,
    equipmentGrowth: 0,
    maintenanceDue: 0,
    nextMaintenance: 'No maintenance scheduled',
    facilityAreas: 0,
    openIncidents: 0,
    highPriorityIncidents: 0,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchEquipmentStats();
    }
  }, [profile?.organization_id]);

  const fetchEquipmentStats = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch total equipment count
      const { count: totalEquipment } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      // Fetch equipment added in last 30 days for growth calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentEquipment } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch maintenance schedules due in next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { count: maintenanceDue, data: upcomingMaintenance } = await supabase
        .from('maintenance_schedules')
        .select('*, equipment!inner(organization_id)', { count: 'exact' })
        .eq('equipment.organization_id', profile.organization_id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .lte('scheduled_date', sevenDaysFromNow.toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(1);

      // Format next maintenance date
      let nextMaintenance = 'No maintenance scheduled';
      if (upcomingMaintenance && upcomingMaintenance.length > 0) {
        const nextDate = new Date(upcomingMaintenance[0].scheduled_date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (nextDate.toDateString() === today.toDateString()) {
          nextMaintenance = 'Next: Today';
        } else if (nextDate.toDateString() === tomorrow.toDateString()) {
          nextMaintenance = 'Next: Tomorrow';
        } else {
          nextMaintenance = `Next: ${nextDate.toLocaleDateString()}`;
        }
      }

      // Fetch facility areas count
      const { count: facilityAreas } = await supabase
        .from('facility_areas')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      // Fetch open incidents
      const { count: openIncidents, data: incidents } = await supabase
        .from('incident_reports')
        .select('*', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .in('status', ['open', 'in_progress']);

      // Count high priority incidents
      const highPriorityIncidents = incidents?.filter(
        (inc) => inc.priority === 'high' || inc.priority === 'critical'
      ).length || 0;

      setStats({
        totalEquipment: totalEquipment || 0,
        equipmentGrowth: recentEquipment || 0,
        maintenanceDue: maintenanceDue || 0,
        nextMaintenance,
        facilityAreas: facilityAreas || 0,
        openIncidents: openIncidents || 0,
        highPriorityIncidents,
      });
    } catch (error) {
      console.error('Error fetching equipment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  const statsDisplay = [
    {
      title: "Total Equipment",
      value: loading ? "-" : stats.totalEquipment.toString(),
      change: loading ? "Loading..." : `+${stats.equipmentGrowth} this month`,
      icon: Wrench,
      color: "text-blue-600"
    },
    {
      title: "Maintenance Due",
      value: loading ? "-" : stats.maintenanceDue.toString(),
      change: loading ? "Loading..." : stats.nextMaintenance,
      icon: Calendar,
      color: "text-orange-600"
    },
    {
      title: "Facility Areas",
      value: loading ? "-" : stats.facilityAreas.toString(),
      change: loading ? "Loading..." : "All operational",
      icon: Building,
      color: "text-green-600"
    },
    {
      title: "Open Incidents",
      value: loading ? "-" : stats.openIncidents.toString(),
      change: loading ? "Loading..." : `${stats.highPriorityIncidents} high priority`,
      icon: AlertTriangle,
      color: stats.highPriorityIncidents > 0 ? "text-red-600" : "text-green-600"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Equipment & Facility Management</h2>
        <div className="flex items-center gap-2">
          <ImportButton module="equipment" />
          <Badge variant="outline" className="ml-auto">
            <Activity className="w-4 h-4 mr-2" />
            System Status: Operational
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((stat, index) => (
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