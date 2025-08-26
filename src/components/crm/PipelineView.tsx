import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface PipelineViewProps {
  leads: any[];
  onLeadSelect: (lead: any) => void;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
  is_closed: boolean;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ leads, onLeadSelect }) => {
  const { profile } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [profile?.organization_id]);

  const fetchStages = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsForStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getUnassignedLeads = () => {
    return leads.filter(lead => !lead.stage_id);
  };

  const formatLeadName = (lead: any) => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }
    return lead.email;
  };

  const getInterestBadgeVariant = (level: string) => {
    switch (level) {
      case 'hot': return 'destructive';
      case 'warm': return 'default';
      case 'cold': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sales Pipeline</h3>
        <div className="text-sm text-muted-foreground">
          Total: {leads.length} leads
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Unassigned leads column */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Unassigned</span>
              <Badge variant="secondary">{getUnassignedLeads().length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getUnassignedLeads().map((lead) => (
              <div
                key={lead.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onLeadSelect(lead)}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {formatLeadName(lead)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={getInterestBadgeVariant(lead.interest_level)} className="text-xs">
                    {lead.interest_level}
                  </Badge>
                  {lead.estimated_value && (
                    <span className="text-xs font-medium">${lead.estimated_value}</span>
                  )}
                </div>
              </div>
            ))}
            {getUnassignedLeads().length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No unassigned leads
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage columns */}
        {stages.map((stage) => {
          const stageLeads = getLeadsForStage(stage.id);
          const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

          return (
            <Card key={stage.id} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span style={{ color: stage.color }}>{stage.name}</span>
                  <Badge variant="secondary">{stageLeads.length}</Badge>
                </CardTitle>
                {stageValue > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Value: ${stageValue.toLocaleString()}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onLeadSelect(lead)}
                    style={{ borderLeftColor: stage.color, borderLeftWidth: '3px' }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {formatLeadName(lead)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={getInterestBadgeVariant(lead.interest_level)} className="text-xs">
                        {lead.interest_level}
                      </Badge>
                      {lead.estimated_value && (
                        <span className="text-xs font-medium">${lead.estimated_value}</span>
                      )}
                    </div>
                    {lead.next_follow_up_date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Follow-up: {new Date(lead.next_follow_up_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No leads in this stage
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};