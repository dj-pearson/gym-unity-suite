import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Calendar, User, Plus, Edit, MapPin, DollarSign, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { LeadForm } from './LeadForm';
import { MembershipConversionDialog } from './MembershipConversionDialog';
import { SalespersonCommissionManager } from './SalespersonCommissionManager';
import { SalespersonReferralManager } from './SalespersonReferralManager';
import { LeadAttributionManager } from './LeadAttributionManager';

interface LeadDetailProps {
  lead: any;
  onClose: () => void;
  onUpdate: () => void;
  onActivityAdd: () => void;
}

interface Activity {
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
}

export const LeadDetail: React.FC<LeadDetailProps> = ({ 
  lead, 
  onClose, 
  onUpdate, 
  onActivityAdd 
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showCommissionManager, setShowCommissionManager] = useState(false);
  const [showReferralManager, setShowReferralManager] = useState(false);
  const [showAttributionManager, setShowAttributionManager] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [lead.id]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatLeadName = () => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }
    return lead.email;
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{formatLeadName()}</DialogTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setShowCommissionManager(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Commissions
                </Button>
                <Button variant="outline" onClick={() => setShowReferralManager(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Referrals
                </Button>
                <Button variant="outline" onClick={() => setShowAttributionManager(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Attribution
                </Button>
                {lead.status === 'lead' && (
                  <Button onClick={() => setShowConversionDialog(true)}>
                    Convert to Member
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lead Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lead Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={lead.interest_level === 'hot' ? 'destructive' : 'secondary'}>
                      {lead.interest_level}
                    </Badge>
                    <Badge variant="outline">{lead.status}</Badge>
                  </div>
                  {lead.stage && (
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                      >
                        {lead.stage.name}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lead Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lead.estimated_value ? `$${lead.estimated_value}` : 'Not set'}
                  </div>
                  {lead.source && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Source: {lead.source}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lead Details Tabs */}
            <Tabs defaultValue="activities" className="space-y-4">
              <TabsList>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes & Details</TabsTrigger>
              </TabsList>

              <TabsContent value="activities" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Activity Timeline</h3>
                  <Button onClick={onActivityAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                </div>

                <div className="space-y-3">
                  {activities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-muted rounded-full">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{activity.title}</h4>
                              <Badge variant="outline">{activity.activity_type}</Badge>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            {activity.outcome && (
                              <p className="text-sm mt-2">
                                <strong>Outcome:</strong> {activity.outcome}
                              </p>
                            )}
                            {activity.next_action && (
                              <p className="text-sm mt-1">
                                <strong>Next Action:</strong> {activity.next_action}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {activities.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No activities logged yet</p>
                        <Button onClick={onActivityAdd} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Log First Activity
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.notes ? (
                      <p className="whitespace-pre-wrap">{lead.notes}</p>
                    ) : (
                      <p className="text-muted-foreground">No notes added yet</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Important Dates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Created:</strong> {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                      {lead.last_contact_date && (
                        <div>
                          <strong>Last Contact:</strong> {new Date(lead.last_contact_date).toLocaleDateString()}
                        </div>
                      )}
                      {lead.next_follow_up_date && (
                        <div>
                          <strong>Next Follow-up:</strong> {new Date(lead.next_follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Salesperson Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {lead.assigned_salesperson ? (
                        <div>
                          <strong>Assigned to:</strong> {lead.assigned_salesperson.first_name} {lead.assigned_salesperson.last_name}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Not assigned to salesperson</p>
                      )}
                      {lead.entered_by && (
                        <div>
                          <strong>Entered by:</strong> {lead.entered_by.first_name} {lead.entered_by.last_name}
                        </div>
                      )}
                      {lead.referral_code && (
                        <div>
                          <strong>Referral Code:</strong> <code className="text-sm bg-muted px-1 rounded">{lead.referral_code}</code>
                        </div>
                      )}
                      <div>
                        <strong>Attribution:</strong> <Badge variant={lead.attribution_status === 'confirmed' ? 'default' : 'secondary'}>
                          {lead.attribution_status?.replace('_', ' ') || 'confirmed'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {showEditForm && (
        <LeadForm
          lead={lead}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            onUpdate();
          }}
        />
      )}

      {showConversionDialog && (
        <MembershipConversionDialog
          lead={lead}
          isOpen={showConversionDialog}
          onClose={() => setShowConversionDialog(false)}
          onSuccess={() => {
            setShowConversionDialog(false);
            onUpdate();
          }}
        />
      )}

      {showCommissionManager && (
        <SalespersonCommissionManager
          isOpen={showCommissionManager}
          onClose={() => setShowCommissionManager(false)}
        />
      )}

      {showReferralManager && (
        <SalespersonReferralManager
          isOpen={showReferralManager}
          onClose={() => setShowReferralManager(false)}
        />
      )}

      {showAttributionManager && (
        <LeadAttributionManager
          isOpen={showAttributionManager}
          onClose={() => setShowAttributionManager(false)}
        />
      )}
    </>
  );
};