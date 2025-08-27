import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  AlertCircle,
  ChevronRight,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface WaitlistEntry {
  id: string;
  class_id: string;
  member_id: string;
  priority_order: number;
  status: string;
  joined_at: string;
  member: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  class: {
    name: string;
    scheduled_at: string;
    max_capacity: number;
  };
}

interface WaitlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistManager({ isOpen, onClose }: WaitlistManagerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWaitlistEntries();
    }
  }, [isOpen, profile?.organization_id]);

  const fetchWaitlistEntries = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      // First, get all classes for this organization
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, scheduled_at, max_capacity')
        .eq('organization_id', profile.organization_id);

      if (classesError) throw classesError;

      if (!classes || classes.length === 0) {
        setWaitlistEntries([]);
        return;
      }

      const classIds = classes.map(c => c.id);

      // Get waitlist entries for these classes
      const { data: waitlists, error: waitlistError } = await supabase
        .from('class_waitlists')
        .select('*')
        .eq('status', 'waiting')
        .in('class_id', classIds)
        .order('priority_order', { ascending: true });

      if (waitlistError) throw waitlistError;

      if (!waitlists || waitlists.length === 0) {
        setWaitlistEntries([]);
        return;
      }

      // Get member details
      const memberIds = waitlists.map(w => w.member_id);
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', memberIds);

      if (membersError) throw membersError;

      // Combine the data
      const transformedData: WaitlistEntry[] = waitlists.map(entry => {
        const member = members?.find(m => m.id === entry.member_id);
        const classInfo = classes.find(c => c.id === entry.class_id);
        
        return {
          ...entry,
          member: member || { email: 'Unknown Member' },
          class: classInfo || { name: 'Unknown Class', scheduled_at: new Date().toISOString(), max_capacity: 0 }
        };
      });

      // Sort by class scheduled time, then by priority order
      transformedData.sort((a, b) => {
        const dateA = new Date(a.class.scheduled_at).getTime();
        const dateB = new Date(b.class.scheduled_at).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.priority_order - b.priority_order;
      });

      setWaitlistEntries(transformedData);
    } catch (error: any) {
      console.error('Error fetching waitlist entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch waitlist entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteFromWaitlist = async (entryId: string, memberId: string, classId: string) => {
    try {
      setLoading(true);

      // Check if there's space in the class
      const { data: bookings } = await supabase
        .from('class_bookings')
        .select('id')
        .eq('class_id', classId)
        .eq('status', 'booked');

      const { data: classData } = await supabase
        .from('classes')
        .select('max_capacity')
        .eq('id', classId)
        .single();

      if (!classData) throw new Error('Class not found');

      const currentBookings = bookings?.length || 0;
      if (currentBookings >= classData.max_capacity) {
        toast({
          title: "Cannot Promote",
          description: "Class is still at full capacity",
          variant: "destructive",
        });
        return;
      }

      // Create booking for the member
      const { error: bookingError } = await supabase
        .from('class_bookings')
        .insert({
          class_id: classId,
          member_id: memberId,
          status: 'booked'
        });

      if (bookingError) throw bookingError;

      // Update waitlist status
      const { error: waitlistError } = await supabase
        .from('class_waitlists')
        .update({ status: 'promoted', notified_at: new Date().toISOString() })
        .eq('id', entryId);

      if (waitlistError) throw waitlistError;

      toast({
        title: "Member Promoted",
        description: "Member has been moved from waitlist to booked",
      });

      fetchWaitlistEntries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to promote member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWaitlist = async (entryId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('class_waitlists')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Removed from Waitlist",
        description: "Member has been removed from the waitlist",
      });

      fetchWaitlistEntries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member from waitlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (member: WaitlistEntry['member']) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  const getMemberInitials = (member: WaitlistEntry['member']) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  };

  // Group entries by class
  const entriesByClass = waitlistEntries.reduce((acc, entry) => {
    const key = entry.class_id;
    if (!acc[key]) {
      acc[key] = {
        class: entry.class,
        entries: []
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { class: WaitlistEntry['class'], entries: WaitlistEntry[] }>);

  if (loading && waitlistEntries.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Waitlist Management</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading waitlist data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Management
          </DialogTitle>
        </DialogHeader>

        {Object.keys(entriesByClass).length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Waitlist Entries</h3>
            <p className="text-muted-foreground">
              There are currently no members on any waitlists
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {waitlistEntries.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Waiting</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-warning">
                    {Object.keys(entriesByClass).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Classes with Waitlists</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-success">
                    {Math.round(waitlistEntries.length / Object.keys(entriesByClass).length * 10) / 10}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg per Class</div>
                </CardContent>
              </Card>
            </div>

            {/* Waitlist by Class */}
            <div className="space-y-4">
              {Object.entries(entriesByClass).map(([classId, { class: classInfo, entries }]) => (
                <Card key={classId} className="gym-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(classInfo.scheduled_at), 'PPp')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {classInfo.max_capacity} capacity
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">
                        {entries.length} waiting
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {entries.map((entry, index) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            #{entry.priority_order}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-secondary text-white text-xs">
                              {getMemberInitials(entry.member)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getMemberName(entry.member)}</div>
                            <div className="text-sm text-muted-foreground">
                              Joined {format(new Date(entry.joined_at), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => promoteFromWaitlist(entry.id, entry.member_id, entry.class_id)}
                            disabled={loading}
                            className="bg-gradient-success hover:opacity-90"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Promote
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromWaitlist(entry.id)}
                            disabled={loading}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}