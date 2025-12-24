import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
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
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MemberDetailDialog } from '@/components/members/MemberDetailDialog';
import { AddMemberDialog } from '@/components/members/AddMemberDialog';
import { VirtualList } from '@/components/ui/VirtualList';
import { useMembers, type Member } from '@/hooks/useMembers';
import ImportButton from '@/components/imports/ImportButton';

export default function MembersPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Use React Query for data fetching with automatic caching and pagination
  const { data, isLoading: loading } = useMembers(profile?.organization_id, { page: currentPage, pageSize });
  const members = data?.members || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  // Refresh members list after import
  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  // Memoize filtered members to avoid recalculation on every render
  const filteredMembers = useMemo(() => {
    return members.filter(member =>
      `${member.first_name || ''} ${member.last_name || ''} ${member.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  // Memoize stats calculations to avoid recalculation on every render
  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.membership?.status === 'active').length,
    pastDue: members.filter(m => m.membership?.status === 'past_due').length,
    noMembership: members.filter(m => !m.membership).length,
  }), [members]);

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

  // Memoize helper functions to prevent recreation on every render
  const getMemberInitials = useCallback((member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  }, []);

  const getMemberName = useCallback((member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  }, []);

  const handleMemberClick = useCallback((member: Member) => {
    setSelectedMember(member);
    setIsDetailDialogOpen(true);
  }, []);

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
        <div className="flex items-center gap-2">
          <ImportButton module="members" onImportComplete={handleImportComplete} />
          <Button
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setIsAddMemberDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stats Cards - Using memoized stats to avoid recalculation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active Memberships</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.pastDue}</div>
            <div className="text-sm text-muted-foreground">Past Due</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">{stats.noMembership}</div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
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
                <Button
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => setIsAddMemberDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="h-[600px]">
              <VirtualList
                items={filteredMembers}
                estimateSize={120}
                overscan={5}
                itemKey={(member) => member.id}
                renderItem={(member) => {
                  const statusBadge = member.membership ?
                    getStatusBadge(member.membership.status) :
                    { label: 'No Membership', variant: 'outline' as const };

                  return (
                    <div
                      className="flex items-center justify-between p-4 mb-4 border border-border rounded-lg hover:shadow-elevation-1 transition-smooth cursor-pointer"
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
                }}
              />
            </div>
          )}

          {/* Pagination Controls */}
          {filteredMembers.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
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

      <AddMemberDialog
        isOpen={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        onSuccess={handleImportComplete}
      />
    </div>
  );
}