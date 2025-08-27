import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Plus, 
  Users, 
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  FileText,
  Users2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberDetailDialog } from '@/components/members/MemberDetailDialog';

interface Member {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  parent_member_id?: string;
  relationship_type?: string;
  family_notes?: string;
  membership?: {
    status: string;
    plan: {
      name: string;
      price: number;
    };
  };
}

export default function MembersPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [profile?.organization_id]);

  const fetchMembers = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          created_at,
          parent_member_id,
          relationship_type,
          family_notes,
          memberships (
            status,
            membership_plans (
              name,
              price
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching members",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedMembers = data.map(member => ({
        ...member,
        membership: member.memberships?.[0] ? {
          status: member.memberships[0].status,
          plan: member.memberships[0].membership_plans
        } : undefined
      }));

      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name} ${member.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      inactive: { label: 'Inactive', variant: 'secondary' as const },
      frozen: { label: 'Frozen', variant: 'outline' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  };

  const getMemberInitials = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  };

  const getMemberName = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setIsDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Members</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Members</h1>
            <p className="text-muted-foreground">
              Manage your gym members and their memberships
            </p>
          </div>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{members.length}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {members.filter(m => m.membership?.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Memberships</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {members.filter(m => m.membership?.status === 'past_due').length}
            </div>
            <div className="text-sm text-muted-foreground">Past Due</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">
              {members.filter(m => !m.membership).length}
            </div>
            <div className="text-sm text-muted-foreground">No Membership</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Members List */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle>All Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first member'}
              </p>
              {!searchTerm && (
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => {
                const statusBadge = member.membership ? 
                  getStatusBadge(member.membership.status) : 
                  { label: 'No Membership', variant: 'outline' as const };
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-elevation-1 transition-smooth cursor-pointer"
                    onClick={() => handleMemberClick(member)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-gradient-secondary text-white">
                          {getMemberInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-foreground truncate">
                            {getMemberName(member)}
                          </h3>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                          {member.parent_member_id && (
                            <Badge variant="outline" className="text-xs">
                              <Users2 className="w-3 h-3 mr-1" />
                              Family
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Joined {new Date(member.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {member.membership && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {member.membership.plan.name} - ${member.membership.plan.price}/month
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberClick(member);
                        }}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more actions
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MemberDetailDialog
        member={selectedMember}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
}