import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { PipelineView } from '@/components/crm/PipelineView';

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

export const LeadsPage: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLeads();
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

  const filteredLeads = leads.filter(lead => {
    const searchStr = searchTerm.toLowerCase();
    return (
      lead.email.toLowerCase().includes(searchStr) ||
      lead.first_name?.toLowerCase().includes(searchStr) ||
      lead.last_name?.toLowerCase().includes(searchStr) ||
      lead.phone?.includes(searchStr)
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading leads pipeline...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <Button onClick={() => setShowLeadForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
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
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {leads.filter(l => l.status === 'member').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="pipeline">
          <PipelineView leads={filteredLeads} onLeadSelect={setSelectedLead} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
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
                        <span className="font-medium text-primary">
                          {lead.first_name?.[0] || lead.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {lead.first_name && lead.last_name 
                            ? `${lead.first_name} ${lead.last_name}` 
                            : lead.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-sm text-muted-foreground">{lead.phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.stage && (
                        <span 
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${lead.stage.color}20`,
                            color: lead.stage.color,
                            borderColor: lead.stage.color 
                          }}
                        >
                          {lead.stage.name}
                        </span>
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
          }}
          onActivityAdd={() => {}}
        />
      )}
    </div>
  );
};