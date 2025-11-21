import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarDays, AlertTriangle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';
import { SafetyInspectionForm } from './SafetyInspectionForm';
import { InspectionChecklistManager } from './InspectionChecklistManager';
import { SafetyViolationManager } from './SafetyViolationManager';
import { toast } from 'sonner';
import { getStatusColor } from '@/lib/colorUtils';

interface SafetyInspection {
  id: string;
  equipment_id: string;
  checklist_id: string;
  inspector_id: string;
  scheduled_date: string;
  completed_at: string | null;
  overall_status: 'pending' | 'passed' | 'failed' | 'needs_attention';
  total_items: number;
  passed_items: number;
  failed_items: number;
  critical_failures: number;
  next_inspection_date: string | null;
  requires_immediate_attention: boolean;
  equipment_taken_offline: boolean;
  inspection_notes: string | null;
  recommendations: string | null;
  equipment: {
    name: string;
    equipment_type: string;
    status: string;
  };
  inspection_checklists: {
    checklist_name: string;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
}

export function SafetyInspectionManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inspections');
  const [selectedInspection, setSelectedInspection] = useState<SafetyInspection | null>(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ['safety-inspections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_inspections')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      
      // Simplified - return basic data for now
      return data?.map(inspection => ({
        ...inspection,
        equipment: { name: 'Equipment', equipment_type: 'cardio', status: 'active' },
        inspection_checklists: { checklist_name: 'Safety Checklist' },
        inspector: { first_name: 'Staff', last_name: 'Member' }
      })) || [];
    },
    enabled: !!user,
  });

  const { data: overdueInspections } = useQuery({
    queryKey: ['overdue-inspections'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('safety_inspections')
        .select(`
          *,
          equipment!inner(name, equipment_type)
        `)
        .eq('overall_status', 'pending')
        .lt('scheduled_date', today);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const { data, error } = await supabase
        .from('safety_inspections')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      toast.success('Inspection marked as completed');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'needs_attention': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (inspectionsLoading) {
    return <div>Loading safety inspections...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inspections</p>
                <p className="text-2xl font-bold">{inspections?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueInspections?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {inspections?.filter(i => i.overall_status === 'passed').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inspections?.filter(i => i.overall_status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
          </TabsList>
          
          {activeTab === 'inspections' && (
            <Dialog open={showInspectionForm} onOpenChange={setShowInspectionForm}>
              <DialogTrigger asChild>
                <Button>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Schedule Inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Schedule Safety Inspection</DialogTitle>
                </DialogHeader>
                <SafetyInspectionForm onClose={() => setShowInspectionForm(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="inspections" className="space-y-4">
          {/* Overdue Inspections Alert */}
          {overdueInspections && overdueInspections.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Overdue Inspections Require Immediate Attention
                </CardTitle>
                <CardDescription className="text-red-600">
                  {overdueInspections.length} inspection(s) are past due and need to be completed immediately.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Inspections List */}
          <div className="grid gap-4">
            {inspections?.map((inspection) => (
              <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{inspection.equipment.name}</CardTitle>
                      <CardDescription>
                        {inspection.equipment.equipment_type} • {inspection.inspection_checklists.checklist_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(inspection.overall_status)}>
                        {getStatusIcon(inspection.overall_status)}
                        <span className="ml-1 capitalize">{inspection.overall_status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Scheduled Date</p>
                      <p className="font-medium">{new Date(inspection.scheduled_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inspector</p>
                      <p className="font-medium">{inspection.inspector.first_name} {inspection.inspector.last_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className="font-medium">
                        {inspection.total_items > 0 ? 
                          `${inspection.passed_items}/${inspection.total_items} items passed` :
                          'Not started'
                        }
                      </p>
                    </div>
                  </div>

                  {inspection.critical_failures > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="font-medium">Critical Safety Issues Found</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        {inspection.critical_failures} critical safety item(s) failed inspection
                      </p>
                    </div>
                  )}

                  {inspection.requires_immediate_attention && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center text-yellow-800">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">Requires Immediate Attention</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Safety Inspection Details</DialogTitle>
                        </DialogHeader>
                        <SafetyInspectionForm 
                          inspection={inspection} 
                          onClose={() => setSelectedInspection(null)} 
                        />
                      </DialogContent>
                    </Dialog>
                    
                    {inspection.overall_status === 'pending' && !inspection.completed_at && (
                      <Button 
                        size="sm" 
                        onClick={() => completeInspectionMutation.mutate(inspection.id)}
                        disabled={completeInspectionMutation.isPending}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklists">
          <InspectionChecklistManager />
        </TabsContent>

        <TabsContent value="violations">
          <SafetyViolationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}