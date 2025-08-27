import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Star, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

interface MemberFeedback {
  id: string;
  member_id: string;
  feedback_type: 'general' | 'service' | 'facility' | 'equipment' | 'staff' | 'class' | 'suggestion' | 'complaint';
  rating?: number;
  title: string;
  content: string;
  is_anonymous: boolean;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  assigned_to?: string;
  response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  member?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  assignee?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  responder?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface Staff {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

export default function MemberFeedbackManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<MemberFeedback[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<MemberFeedback | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchFeedback();
    fetchStaff();
  }, [profile?.organization_id]);

  const fetchFeedback = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('member_feedback')
        .select(`
          *,
          member:profiles!member_id(first_name, last_name, email, organization_id),
          assignee:profiles!assigned_to(first_name, last_name, email),
          responder:profiles!responded_by(first_name, last_name, email)
        `)
        .eq('member.organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data as any[] || []);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .in('role', ['owner', 'manager', 'staff'])
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string, newAssignee?: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newAssignee !== undefined) {
        updateData.assigned_to = newAssignee || null;
      }

      const { error } = await supabase
        .from('member_feedback')
        .update(updateData)
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feedback status updated successfully",
      });

      fetchFeedback();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('member_feedback')
        .update({
          response: responseText.trim(),
          responded_by: profile?.id,
          responded_at: new Date().toISOString(),
          status: 'resolved'
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Response sent successfully",
      });

      setResponseDialogOpen(false);
      setResponseText('');
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (feedbackItem: MemberFeedback) => {
    setSelectedFeedback(feedbackItem);
    setResponseText(feedbackItem.response || '');
    setAssignee(feedbackItem.assigned_to || '');
    setResponseDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint': return 'bg-red-100 text-red-800';
      case 'suggestion': return 'bg-purple-100 text-purple-800';
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'facility': return 'bg-green-100 text-green-800';
      case 'equipment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Filter feedback based on selected filters
  const filteredFeedback = feedback.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.feedback_type === typeFilter;
    return matchesStatus && matchesType;
  });

  if (loading) return <div className="text-center py-8">Loading feedback...</div>;

  // Calculate summary statistics
  const totalFeedback = feedback.length;
  const pendingFeedback = feedback.filter(f => f.status === 'pending').length;
  const resolvedFeedback = feedback.filter(f => f.status === 'resolved').length;
  const avgRating = feedback.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / 
                   feedback.filter(f => f.rating).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Member Feedback</h2>
          <p className="text-muted-foreground">
            Manage and respond to member feedback and suggestions
          </p>
        </div>
      </div>

      {/* Feedback Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalFeedback}</div>
                <div className="text-sm text-muted-foreground">Total Feedback</div>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{pendingFeedback}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{resolvedFeedback}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feedback & Suggestions</CardTitle>
              <CardDescription>Review and respond to member feedback</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No feedback found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No feedback matches your current filters' 
                  : 'Member feedback and suggestions will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((feedbackItem) => (
                <div key={feedbackItem.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(feedbackItem.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{feedbackItem.title}</h4>
                        <div className="flex items-center gap-2 mt-1 mb-2">
                          <Badge className={getTypeColor(feedbackItem.feedback_type)}>
                            {feedbackItem.feedback_type}
                          </Badge>
                          <Badge className={getStatusColor(feedbackItem.status)}>
                            {feedbackItem.status}
                          </Badge>
                          {feedbackItem.rating && renderRating(feedbackItem.rating)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{feedbackItem.content}</p>
                        <div className="text-xs text-muted-foreground">
                          {feedbackItem.is_anonymous ? 'Anonymous' : (
                            feedbackItem.member ? 
                            `${feedbackItem.member.first_name} ${feedbackItem.member.last_name}` : 
                            'Unknown Member'
                          )} • {new Date(feedbackItem.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {feedbackItem.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(feedbackItem.id, 'in_review')}
                        >
                          Mark In Review
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResponseDialog(feedbackItem)}
                      >
                        {feedbackItem.response ? 'Edit Response' : 'Respond'}
                      </Button>
                      {feedbackItem.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(feedbackItem.id, 'closed')}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {feedbackItem.response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      <div className="text-sm font-medium text-gray-700 mb-1">Response:</div>
                      <p className="text-sm text-gray-600">{feedbackItem.response}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        By {feedbackItem.responder?.first_name} {feedbackItem.responder?.last_name} • 
                        {feedbackItem.responded_at && new Date(feedbackItem.responded_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              Send a response to the member's feedback
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">{selectedFeedback.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{selectedFeedback.content}</p>
                <div className="text-xs text-muted-foreground">
                  From: {selectedFeedback.is_anonymous ? 'Anonymous' : 
                    `${selectedFeedback.member?.first_name} ${selectedFeedback.member?.last_name}`}
                </div>
              </div>
              
              <div>
                <Label htmlFor="assignee">Assign To</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="response">Response</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Write your response to the member..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleStatusUpdate(selectedFeedback.id, 'in_review', assignee)}
                  variant="outline"
                  disabled={assignee === selectedFeedback.assigned_to}
                >
                  Update Assignment
                </Button>
                <Button onClick={handleRespond} disabled={!responseText.trim()}>
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}