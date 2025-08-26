import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Plus, Calendar, DollarSign } from 'lucide-react';

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
    if (profile?.organization_id) {
      fetchStages();
    }
  }, [profile?.organization_id]);

  const fetchStages = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('order_index', { ascending: true });

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

  const allStages = [
    { id: 'unassigned', name: 'Unassigned', color: '#6b7280', order_index: -1, is_closed: false },
    ...stages
  ];

  return (
    <div className="h-full">
      {/* Mobile: Vertical stack of stage cards */}
      <div className="block md:hidden h-full">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-1">
            {allStages.map((stage) => {
              const stageLeads = stage.id === 'unassigned' 
                ? getUnassignedLeads() 
                : getLeadsForStage(stage.id);

              return (
                <Card key={stage.id} className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="truncate">{stage.name}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {stageLeads.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 bg-muted/30 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted/70"
                            onClick={() => onLeadSelect(lead)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {formatLeadName(lead)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lead.email}
                                  </p>
                                  {lead.phone && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {lead.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <Badge 
                                  variant={getInterestBadgeVariant(lead.interest_level)}
                                  className="text-xs"
                                >
                                  {lead.interest_level}
                                </Badge>
                                {lead.estimated_value && (
                                  <span className="text-xs font-medium text-success">
                                    ${lead.estimated_value}
                                  </span>
                                )}
                                {lead.next_follow_up_date && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span className="truncate">
                                      {new Date(lead.next_follow_up_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop: Horizontal grid of stage columns */}
      <div className="hidden md:block h-full">
        <ScrollArea className="h-full">
          <div className="flex gap-4 pb-4 h-full" style={{ minWidth: 'max-content' }}>
            {allStages.map((stage) => {
              const stageLeads = stage.id === 'unassigned' 
                ? getUnassignedLeads() 
                : getLeadsForStage(stage.id);

              return (
                <Card key={stage.id} className="w-80 flex-shrink-0 h-full flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stageLeads.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-3 pr-4">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 bg-muted/30 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onLeadSelect(lead)}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {formatLeadName(lead)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {lead.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={getInterestBadgeVariant(lead.interest_level)}
                                className="text-xs"
                              >
                                {lead.interest_level}
                              </Badge>
                              {lead.estimated_value && (
                                <div className="flex items-center gap-1 text-xs font-medium text-success">
                                  <DollarSign className="h-3 w-3" />
                                  {lead.estimated_value}
                                </div>
                              )}
                            </div>
                            
                            {lead.next_follow_up_date && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Follow up: {new Date(lead.next_follow_up_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};