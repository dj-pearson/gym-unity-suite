import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { PipelineView } from '@/components/crm/PipelineView';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const getInterestBadgeVariant = (level: string) => {
    switch (level) {
      case 'hot': return 'destructive';
      case 'warm': return 'default';
      case 'cold': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading leads pipeline...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile-optimized header */}
      <div className="flex-none p-4 pb-0 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold truncate">Leads Pipeline</h1>
            <p className="text-muted-foreground text-sm">Track and manage your sales pipeline</p>
          </div>
          <Button 
            onClick={() => setShowLeadForm(true)}
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Lead</span>
          </Button>
        </div>

        {/* Mobile-optimized stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{leads.length}</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hot</p>
              <p className="text-lg font-bold text-destructive">
                {leads.filter(l => l.interest_level === 'hot').length}
              </p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-bold">
                {leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Converted</p>
              <p className="text-lg font-bold text-success">
                {leads.filter(l => l.status === 'member').length}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Mobile-optimized tabs and search */}
          <div className="flex-none space-y-3 mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pipeline" className="text-sm">Pipeline</TabsTrigger>
              <TabsTrigger value="list" className="text-sm">List</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>All Leads</DropdownMenuItem>
                  <DropdownMenuItem>Hot Leads</DropdownMenuItem>
                  <DropdownMenuItem>Recent</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tab content with full height */}
          <div className="flex-1 min-h-0">
            <TabsContent value="pipeline" className="h-full m-0">
              <PipelineView leads={filteredLeads} onLeadSelect={setSelectedLead} />
            </TabsContent>

            <TabsContent value="list" className="h-full m-0">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-none pb-3">
                  <CardTitle className="text-base">All Leads ({filteredLeads.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pt-0">
                  <div className="h-full overflow-auto">
                    <div className="space-y-3">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-medium text-primary text-sm">
                                {lead.first_name?.[0] || lead.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {lead.first_name && lead.last_name 
                                  ? `${lead.first_name} ${lead.last_name}` 
                                  : lead.email}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {lead.email}
                              </div>
                              {lead.phone && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <div className="flex flex-col items-end space-y-1">
                              <Badge 
                                variant={getInterestBadgeVariant(lead.interest_level)}
                                className="text-xs"
                              >
                                {lead.interest_level}
                              </Badge>
                              {lead.stage && (
                                <span 
                                  className="px-2 py-0.5 text-xs rounded-full"
                                  style={{ 
                                    backgroundColor: `${lead.stage.color}20`,
                                    color: lead.stage.color 
                                  }}
                                >
                                  {lead.stage.name}
                                </span>
                              )}
                              {lead.estimated_value && (
                                <div className="text-xs font-medium text-success">
                                  ${lead.estimated_value}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredLeads.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <p className="text-sm">No leads found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
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