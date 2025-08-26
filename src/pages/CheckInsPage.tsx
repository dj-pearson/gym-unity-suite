import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCheck, 
  Search, 
  Clock,
  QrCode,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/dashboard/StatCard';

interface Member {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
  checked_out_at?: string;
  member: Member;
  location: {
    name: string;
  };
}

export default function CheckInsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCheckIns(), fetchMembers()]);
  }, [profile?.organization_id]);

  const fetchCheckIns = async () => {
    if (!profile?.organization_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          profiles!check_ins_member_id_fkey (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          ),
          locations (
            name
          )
        `)
        .gte('checked_in_at', `${today}T00:00:00`)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error('Error fetching check-ins:', error);
        return;
      }

      const transformedCheckIns = data.map(checkIn => ({
        ...checkIn,
        member: checkIn.profiles,
        location: checkIn.locations
      }));

      setCheckIns(transformedCheckIns);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleCheckIn = async (member: Member) => {
    if (!profile?.location_id) {
      toast({
        title: "Location Required",
        description: "You must be assigned to a location to process check-ins.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckInLoading(true);

      // Check if member is already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id, checked_out_at')
        .eq('member_id', member.id)
        .eq('location_id', profile.location_id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .is('checked_out_at', null)
        .single();

      if (existingCheckIn) {
        // Check out
        const { error } = await supabase
          .from('check_ins')
          .update({ checked_out_at: new Date().toISOString() })
          .eq('id', existingCheckIn.id);

        if (error) {
          toast({
            title: "Check-out Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Member Checked Out",
          description: `${getMemberName(member)} has been checked out successfully.`,
        });
      } else {
        // Check in
        const { error } = await supabase
          .from('check_ins')
          .insert({
            member_id: member.id,
            location_id: profile.location_id,
            checked_in_at: new Date().toISOString(),
          });

        if (error) {
          toast({
            title: "Check-in Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Member Checked In",
          description: `${getMemberName(member)} has been checked in successfully.`,
        });
      }

      // Refresh check-ins
      await fetchCheckIns();
      setSelectedMember(null);
      setSearchTerm('');
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  const getMemberName = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  const getMemberInitials = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  };

  const filteredMembers = members.filter(member =>
    getMemberName(member).toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Limit to 5 results

  const todaysStats = {
    totalCheckIns: checkIns.length,
    currentlyInGym: checkIns.filter(c => !c.checked_out_at).length,
    peakHour: '6:00 PM', // This would be calculated from actual data
    avgDuration: '90 min' // This would be calculated from actual data
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Check-ins</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading check-ins...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-success to-green-400 rounded-lg">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Check-ins</h1>
            <p className="text-muted-foreground">
              Manage member check-ins and track facility usage
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Today's Check-ins"
          value={todaysStats.totalCheckIns}
          icon={UserCheck}
          gradient="success"
        />
        <StatCard
          title="Currently in Gym"
          value={todaysStats.currentlyInGym}
          icon={Users}
          gradient="primary"
        />
        <StatCard
          title="Peak Hour"
          value={todaysStats.peakHour}
          icon={TrendingUp}
          gradient="secondary"
        />
        <StatCard
          title="Avg Duration"
          value={todaysStats.avgDuration}
          icon={Clock}
          gradient="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Check-in */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Quick Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members found
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const isCheckedIn = checkIns.some(
                      c => c.member.id === member.id && !c.checked_out_at
                    );
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="bg-gradient-secondary text-white">
                              {getMemberInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {getMemberName(member)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={isCheckedIn ? 'default' : 'outline'}
                          className={isCheckedIn ? 'bg-success' : ''}
                        >
                          {isCheckedIn ? 'Checked In' : 'Check In'}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {selectedMember && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedMember.avatar_url} />
                      <AvatarFallback className="bg-gradient-secondary text-white">
                        {getMemberInitials(selectedMember)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {getMemberName(selectedMember)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedMember.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCheckIn(selectedMember)}
                    disabled={checkInLoading}
                    className="bg-gradient-to-br from-success to-green-400 hover:opacity-90"
                  >
                    {checkInLoading ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Check In/Out
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">No check-ins today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={checkIn.member.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs">
                          {getMemberInitials(checkIn.member)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {getMemberName(checkIn.member)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(checkIn.checked_in_at)}
                          {checkIn.checked_out_at && (
                            <> - {formatTime(checkIn.checked_out_at)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {checkIn.checked_out_at ? (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}