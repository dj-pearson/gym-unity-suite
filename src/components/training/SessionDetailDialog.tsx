import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, DollarSign, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingSession {
  id: string;
  trainer_id: string;
  member_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  price: number;
  notes?: string;
  trainer_name?: string;
  member_name?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
}

interface SessionDetailDialogProps {
  session: TrainingSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SessionDetailDialog({
  session,
  open,
  onOpenChange,
  onSuccess
}: SessionDetailDialogProps) {
  const { toast } = useToast();
  const permissions = usePermissions();
  const { profile } = useAuth();
  const canEdit = permissions.hasRole('owner') || permissions.hasRole('manager') || permissions.hasRole('staff') || 
    (permissions.hasRole('trainer') && session?.trainer_id === profile?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    session_type: 'individual',
    price: 0,
    notes: '',
    status: 'scheduled'
  });

  // Initialize form data when session changes
  React.useEffect(() => {
    if (session) {
      setFormData({
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.duration_minutes,
        session_type: session.session_type,
        price: session.price,
        notes: session.notes || '',
        status: session.status
      });
    }
  }, [session]);

  if (!session) return null;

  // canEdit is now calculated above
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { variant: 'default', label: 'Scheduled' },
      completed: { variant: 'secondary', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      no_show: { variant: 'outline', label: 'No Show' }
    };

    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('personal_training_sessions')
        .update({
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_minutes: formData.duration_minutes,
          session_type: formData.session_type,
          price: formData.price,
          notes: formData.notes || null,
          status: formData.status
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session updated successfully"
      });

      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('personal_training_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: profile?.id
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session cancelled successfully"
      });

      onSuccess();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: "Failed to cancel session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return format(endDate, 'HH:mm');
  };

  const handleStartTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      start_time: time,
      end_time: calculateEndTime(time, prev.duration_minutes)
    }));
  };

  const handleDurationChange = (duration: number) => {
    setFormData(prev => ({
      ...prev,
      duration_minutes: duration,
      end_time: calculateEndTime(prev.start_time, duration)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Training Session Details</span>
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Session Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                getStatusBadge(session.status)
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trainer</span>
              <span className="text-sm">{session.trainer_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Member</span>
              <span className="text-sm">{session.member_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date</span>
              <span className="text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(session.session_date), 'PPP')}
              </span>
            </div>
          </div>

          <Separator />

          {/* Session Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                {isEditing ? (
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{session.start_time}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                {isEditing ? (
                  <Select
                    value={formData.duration_minutes.toString()}
                    onValueChange={(value) => handleDurationChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{session.duration_minutes} minutes</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_type">Session Type</Label>
                {isEditing ? (
                  <Select
                    value={formData.session_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="small_group">Small Group</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="capitalize text-sm mt-1">{session.session_type.replace('_', ' ')}</div>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                {isEditing ? (
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="pl-9"
                      min="0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">${session.price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Session notes..."
                />
              ) : (
                <div className="text-sm text-muted-foreground mt-1 min-h-[60px]">
                  {session.notes || 'No notes provided'}
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Info */}
          {session.status === 'cancelled' && session.cancellation_reason && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Cancellation Reason</Label>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {session.cancellation_reason}
                </div>
                {session.cancelled_at && (
                  <div className="text-xs text-muted-foreground">
                    Cancelled on {format(new Date(session.cancelled_at), 'PPP p')}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {canEdit && session.status === 'scheduled' && !isEditing && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel Session
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}