import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Phone,
  Mail,
  Plus,
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';

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

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
  is_closed: boolean;
  conversion_rate?: number;
  avg_time_in_stage?: number;
}

interface EnhancedPipelineViewProps {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  onLeadUpdate?: () => void;
}

export default function EnhancedPipelineView({ leads, onLeadSelect, onLeadUpdate }: EnhancedPipelineViewProps) {
  const { profile } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [stageMetrics, setStageMetrics] = useState<Record<string, any>>({});

  useEffect(() => {
    if (profile?.organization_id) {
      fetchStages();
      calculateStageMetrics();
    }
  }, [profile?.organization_id, leads]);

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

  const calculateStageMetrics = async () => {
    const metrics: Record<string, any> = {};
    
    for (const stage of stages) {
      const stageLeads = getLeadsForStage(stage.id);
      const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
      
      metrics[stage.id] = {
        leadCount: stageLeads.length,
        totalValue,
        avgValue: stageLeads.length > 0 ? totalValue / stageLeads.length : 0
      };
    }
    
    setStageMetrics(metrics);
  };

  const getLeadsForStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getUnassignedLeads = () => {
    return leads.filter(lead => !lead.stage_id);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    
    if (!draggedLead || !profile?.organization_id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage_id: targetStageId === 'unassigned' ? null : targetStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggedLead.id);

      if (error) throw error;

      toast({
        title: 'Lead moved successfully',
        description: `${formatLeadName(draggedLead)} moved to ${targetStageId === 'unassigned' ? 'Unassigned' : stages.find(s => s.id === targetStageId)?.name}`,
      });

      if (onLeadUpdate) {
        onLeadUpdate();
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to move lead. Please try again.',
        variant: 'destructive'
      });
    }

    setDraggedLead(null);
  };

  const formatLeadName = (lead: Lead) => {
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

  const getStageProgress = (stageId: string) => {
    const currentStageIndex = stages.findIndex(stage => stage.id === stageId);
    const totalStages = stages.length;
    return totalStages > 0 ? Math.round(((currentStageIndex + 1) / totalStages) * 100) : 0;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pipeline...</div>;
  }

  const allStages = [
    { 
      id: 'unassigned', 
      name: 'Unassigned', 
      color: 'hsl(var(--muted-foreground))', 
      order_index: -1, 
      is_closed: false 
    },
    ...stages
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Total Pipeline</div>
                <div className="text-2xl font-bold">
                  ${leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <div className="text-sm font-medium">Avg Deal Size</div>
                <div className="text-2xl font-bold">
                  ${Math.round(leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) / Math.max(leads.length, 1)).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" />
              <div>
                <div className="text-sm font-medium">Active Leads</div>
                <div className="text-2xl font-bold">{leads.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warning" />
              <div>
                <div className="text-sm font-medium">Follow-ups Due</div>
                <div className="text-2xl font-bold">
                  {leads.filter(lead => 
                    lead.next_follow_up_date && 
                    new Date(lead.next_follow_up_date) <= new Date()
                  ).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Pipeline View */}
      <div className="block lg:hidden">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 p-1">
            {allStages.map((stage) => {
              const stageLeads = stage.id === 'unassigned' 
                ? getUnassignedLeads() 
                : getLeadsForStage(stage.id);
              const metrics = stageMetrics[stage.id] || { leadCount: 0, totalValue: 0 };

              return (
                <Card 
                  key={stage.id} 
                  className="gym-card"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="truncate">{stage.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stageLeads.length}
                        </Badge>
                        {stage.id !== 'unassigned' && metrics.totalValue > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            ${metrics.totalValue.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="max-h-80 overflow-y-auto">
                      <div className="space-y-3">
                        {stageLeads.map((lead) => (
                          <LeadCard 
                            key={lead.id}
                            lead={lead}
                            onSelect={() => onLeadSelect(lead)}
                            onDragStart={(e) => handleDragStart(e, lead)}
                            progress={getStageProgress(stage.id)}
                          />
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No leads in this stage
                            <div className="text-xs mt-1 opacity-60">
                              Drag leads here to move them
                            </div>
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

      {/* Desktop Pipeline View */}
      <div className="hidden lg:block">
        <ScrollArea className="h-[600px]">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
            {allStages.map((stage) => {
              const stageLeads = stage.id === 'unassigned' 
                ? getUnassignedLeads() 
                : getLeadsForStage(stage.id);
              const metrics = stageMetrics[stage.id] || { leadCount: 0, totalValue: 0 };

              return (
                <Card 
                  key={stage.id} 
                  className="w-80 flex-shrink-0 h-full flex flex-col gym-card"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-sm font-medium">
                      <div className="flex items-center justify-between mb-2">
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
                      </div>
                      {stage.id !== 'unassigned' && metrics.totalValue > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Pipeline Value</span>
                          <span className="font-semibold text-success">
                            ${metrics.totalValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-3 pr-4">
                        {stageLeads.map((lead) => (
                          <LeadCard 
                            key={lead.id}
                            lead={lead}
                            onSelect={() => onLeadSelect(lead)}
                            onDragStart={(e) => handleDragStart(e, lead)}
                            progress={getStageProgress(stage.id)}
                          />
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            <div className="mb-2">No leads in this stage</div>
                            <div className="text-xs opacity-60">
                              Drag leads here to move them
                            </div>
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
}

interface LeadCardProps {
  lead: Lead;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  progress: number;
}

function LeadCard({ lead, onSelect, onDragStart, progress }: LeadCardProps) {
  const formatLeadName = (lead: Lead) => {
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

  const isFollowUpDue = lead.next_follow_up_date && 
    new Date(lead.next_follow_up_date) <= new Date();

  return (
    <div
      className="p-3 bg-card border rounded-lg cursor-move hover:shadow-md transition-all active:scale-[0.98]"
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {formatLeadName(lead)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {lead.email}
          </p>
          {lead.phone && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant={getInterestBadgeVariant(lead.interest_level)}
          className="text-xs"
        >
          {lead.interest_level}
        </Badge>
        {lead.estimated_value && (
          <div className="flex items-center gap-1 text-xs font-medium text-success">
            <DollarSign className="h-3 w-3" />
            {lead.estimated_value.toLocaleString()}
          </div>
        )}
      </div>

      {isFollowUpDue && (
        <div className="flex items-center gap-1 p-2 bg-warning/10 rounded text-xs text-warning mb-2">
          <Calendar className="h-3 w-3" />
          <span className="font-medium">Follow-up due!</span>
        </div>
      )}
      
      {lead.next_follow_up_date && !isFollowUpDue && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Follow up: {new Date(lead.next_follow_up_date).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Pipeline Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="bg-gradient-primary h-1 rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}