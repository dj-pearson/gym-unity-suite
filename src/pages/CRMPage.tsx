import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Phone, Mail, Calendar, User, FileText, Settings, BarChart3, Target, Star } from 'lucide-react';
import { toast } from 'sonner';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { ActivityForm } from '@/components/crm/ActivityForm';
import EnhancedPipelineView from '@/components/crm/EnhancedPipelineView';
import { LeadStagesManager } from '@/components/crm/LeadStagesManager';
import LeadScoringDashboard from '@/components/crm/LeadScoringDashboard';
import LeadAnalyticsDashboard from '@/components/crm/LeadAnalyticsDashboard';

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string;
  stage_id: string | null;
  assigned_to: string | null;
  source: string | null;
  interest_level: string;
  estimated_value: number | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  stage?: {
    id: string;
    name: string;
    color: string;
  };
  assigned_staff?: {
    first_name: string;
    last_name: string;
  };
}

interface LeadActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  next_action: string | null;
  created_at: string;
  created_by: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

export const CRMPage: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showStagesManager, setShowStagesManager] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLeads();
      fetchRecentActivities();
    }
  }, [profile?.organization_id]);

  const fetchLeads = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch related data separately to avoid join issues
      const leadsWithDetails = await Promise.all((data || []).map(async (lead) => {
        let stage = null;
        let assigned_staff = null;

        if (lead.stage_id) {
          const { data: stageData } = await supabase
            .from('lead_stages')
            .select('id, name, color')
            .eq('id', lead.stage_id)
            .single();
          stage = stageData;
        }

        if (lead.assigned_to) {
          const { data: staffData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', lead.assigned_to)
            .single();
          assigned_staff = staffData;
        }

        return { ...lead, stage, assigned_staff };
      }));

      setLeads(leadsWithDetails);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Fetch creator details separately and filter by organization
      const activitiesWithDetails = await Promise.all((data || []).map(async (activity) => {
        // Check if lead belongs to current organization
        const { data: leadData } = await supabase
          .from('leads')
          .select('organization_id')
          .eq('id', activity.lead_id)
          .single();

        if (!leadData || leadData.organization_id !== profile.organization_id) {
          return null;
        }

        let creator = null;
        if (activity.created_by) {
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', activity.created_by)
            .single();
          creator = creatorData;
        }

        return { ...activity, creator };
      }));

      setActivities(activitiesWithDetails.filter(Boolean));
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchStr = searchTerm.toLowerCase();
    return (
      lead.email.toLowerCase().includes(searchStr) ||
      lead.first_name?.toLowerCase().includes(searchStr) ||
      lead.last_name?.toLowerCase().includes(searchStr) ||
      lead.phone?.includes(searchStr)
    );
  });

  const getInterestBadgeVariant = (level: string) => {
    switch (level) {
      case 'hot': return 'destructive';
      case 'warm': return 'default';
      case 'cold': return 'secondary';
      default: return 'secondary';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatLeadName = (lead: Lead) => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }
    return lead.email;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading CRM...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">Manage leads and track sales activities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowStagesManager(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Stages
          </Button>
          <Button onClick={() => setShowLeadForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {leads.filter(l => l.interest_level === 'hot').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === 'member').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{formatLeadName(lead)}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-sm text-muted-foreground">{lead.phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getInterestBadgeVariant(lead.interest_level)}>
                        {lead.interest_level}
                      </Badge>
                      {lead.stage && (
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                        >
                          {lead.stage.name}
                        </Badge>
                      )}
                      {lead.estimated_value && (
                        <div className="text-sm font-medium">${lead.estimated_value}</div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <EnhancedPipelineView 
            leads={leads} 
            onLeadSelect={setSelectedLead}
            onLeadUpdate={fetchLeads}
          />
        </TabsContent>

        <TabsContent value="scoring">
          <LeadScoringDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <LeadAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Activities</h3>
            <Button 
              onClick={() => setShowActivityForm(true)}
              disabled={!selectedLead}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <div className="p-2 bg-muted rounded-full">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant="outline">{activity.activity_type}</Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                        {activity.creator && (
                          <span>by {activity.creator.first_name} {activity.creator.last_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities logged yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showLeadForm && (
        <LeadForm
          onClose={() => setShowLeadForm(false)}
          onSuccess={() => {
            setShowLeadForm(false);
            fetchLeads();
          }}
        />
      )}

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            fetchLeads();
            fetchRecentActivities();
          }}
          onActivityAdd={() => setShowActivityForm(true)}
        />
      )}

      {showActivityForm && selectedLead && (
        <ActivityForm
          leadId={selectedLead.id}
          onClose={() => setShowActivityForm(false)}
          onSuccess={() => {
            setShowActivityForm(false);
            fetchRecentActivities();
          }}
        />
      )}

      {showStagesManager && (
        <LeadStagesManager
          onClose={() => setShowStagesManager(false)}
        />
      )}
    </div>
  );
};