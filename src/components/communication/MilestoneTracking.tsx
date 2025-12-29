import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Plus } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  milestone_type: string;
  achievement_date: string;
  recognition_sent: boolean;
  recognition_sent_at: string | null;
  member: {
    first_name: string;
    last_name: string;
  } | null;
}

export function MilestoneTracking() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMilestones();
  }, [profile?.organization_id, typeFilter]);

  const fetchMilestones = async () => {
    if (!profile?.organization_id) return;

    try {
      // First get members for this organization
      const { data: members } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', profile.organization_id);

      if (!members || members.length === 0) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      const memberIds = members.map(m => m.id);

      let query = supabase
        .from('member_milestones')
        .select(`
          *,
          member:profiles!member_milestones_member_id_fkey(first_name, last_name)
        `)
        .in('member_id', memberIds)
        .order('achievement_date', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('milestone_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      // Error handled silently - empty state shown
    } finally {
      setLoading(false);
    }
  };

  const sendRecognition = async (milestoneId: string) => {
    try {
      if (!profile?.organization_id) {
        throw new Error('No organization ID');
      }

      const { error } = await supabase
        .from('member_milestones')
        .update({
          recognition_sent: true,
          recognition_sent_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;

      toast({
        title: "Recognition Sent",
        description: "Member has been celebrated for their achievement!"
      });

      fetchMilestones();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send recognition",
        variant: "destructive"
      });
    }
  };

  const getMilestoneColor = (type: string): string => {
    switch (type) {
      case 'visit':
        return 'border-l-yellow-500';
      case 'class':
        return 'border-l-blue-500';
      case 'referral':
        return 'border-l-green-500';
      default:
        return 'border-l-primary';
    }
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const achieved = new Date(date);
    const diffMs = now.getTime() - achieved.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Achieved today';
    if (diffDays === 1) return 'Yesterday';
    if (diffHours > 0 && diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const filteredMilestones = milestones.filter(milestone =>
    searchTerm === '' ||
    milestone.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${milestone.member?.first_name} ${milestone.member?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Card><CardContent className="p-6">Loading milestones...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Member Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search members..."
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Milestones</SelectItem>
                  <SelectItem value="visit">Visit Milestones</SelectItem>
                  <SelectItem value="class">Class Milestones</SelectItem>
                  <SelectItem value="referral">Referral Milestones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          {filteredMilestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No milestones found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMilestones.map((milestone) => (
                <Card key={milestone.id} className={`border-l-4 ${getMilestoneColor(milestone.milestone_type)}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{milestone.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {milestone.member?.first_name} {milestone.member?.last_name}
                          {milestone.description && ` - ${milestone.description}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {milestone.milestone_type.charAt(0).toUpperCase() + milestone.milestone_type.slice(1)} Milestone
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(milestone.achievement_date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {milestone.recognition_sent ? (
                          <Badge variant="secondary">Celebrated</Badge>
                        ) : (
                          <Button size="sm" onClick={() => sendRecognition(milestone.id)}>
                            <Trophy className="w-4 h-4 mr-1" />
                            Celebrate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MilestoneTracking;
