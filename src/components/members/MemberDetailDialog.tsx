import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePresence } from '@/hooks/usePresence';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import {
  User,
  Users,
  FileText,
  Activity,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  Upload,
  Plus
} from 'lucide-react';

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

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url?: string;
  notes?: string;
  created_at: string;
  uploaded_by?: string;
}

interface AttendanceStats {
  total_visits: number;
  visits_last_30_days: number;
  visits_last_7_days: number;
  last_visit?: string;
  avg_duration_minutes?: number;
}

interface FamilyMember {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  relationship_type?: string;
  avatar_url?: string;
}

interface MemberDetailDialogProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailDialog({ member, isOpen, onClose }: MemberDetailDialogProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Track who else is viewing this member
  const { viewers } = usePresence('member', member?.id, isOpen);

  useEffect(() => {
    if (member && isOpen) {
      fetchMemberDetails();
    }
  }, [member, isOpen]);

  const fetchMemberDetails = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchDocuments(),
        fetchAttendance(),
        fetchFamilyMembers()
      ]);
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!member) return;

    const { data, error } = await supabase
      .from('member_documents')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const fetchAttendance = async () => {
    if (!member) return;

    // Limit query to last 365 days for performance - covers all needed statistics
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await supabase
      .from('check_ins')
      .select('checked_in_at, checked_out_at')
      .eq('member_id', member.id)
      .eq('is_guest', false)
      .gte('checked_in_at', oneYearAgo.toISOString())
      .order('checked_in_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    if (data) {
      const now = new Date();
      const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

      // Single-pass processing for all statistics
      let visits30Days = 0;
      let visits7Days = 0;
      let totalDuration = 0;
      let completedVisitsCount = 0;

      for (const visit of data) {
        const checkInTime = new Date(visit.checked_in_at).getTime();

        if (checkInTime >= thirtyDaysAgo) {
          visits30Days++;
        }
        if (checkInTime >= sevenDaysAgo) {
          visits7Days++;
        }
        if (visit.checked_out_at) {
          const checkOutTime = new Date(visit.checked_out_at).getTime();
          totalDuration += checkOutTime - checkInTime;
          completedVisitsCount++;
        }
      }

      // Data is already sorted by checked_in_at desc, so first item is the latest
      const lastVisit = data.length > 0 ? data[0].checked_in_at : undefined;

      const avgDuration = completedVisitsCount > 0
        ? totalDuration / completedVisitsCount / (1000 * 60)
        : undefined;

      setAttendance({
        total_visits: data.length,
        visits_last_30_days: visits30Days,
        visits_last_7_days: visits7Days,
        last_visit: lastVisit,
        avg_duration_minutes: avgDuration
      });
    }
  };

  const fetchFamilyMembers = async () => {
    if (!member) return;

    // Get family members linked to this member
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, relationship_type, avatar_url')
      .or(`parent_member_id.eq.${member.id},id.eq.${member.parent_member_id}`)
      .neq('id', member.id);

    if (error) {
      console.error('Error fetching family members:', error);
      return;
    }

    setFamilyMembers(data || []);
  };

  const getMemberName = (member: Member | FamilyMember) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  const getMemberInitials = (member: Member | FamilyMember) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  };

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      waiver: 'bg-red-100 text-red-800',
      medical: 'bg-blue-100 text-blue-800',
      contract: 'bg-green-100 text-green-800',
      photo_id: 'bg-purple-100 text-purple-800',
      payment: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback className="bg-gradient-secondary text-white">
                {getMemberInitials(member)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{getMemberName(member)}</h2>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            {/* Show who else is viewing this member */}
            <PresenceIndicator viewers={viewers} size="sm" maxVisible={3} />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membership Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {member.membership ? (
                    <div className="space-y-2">
                      <Badge variant={member.membership.status === 'active' ? 'default' : 'secondary'}>
                        {member.membership.status}
                      </Badge>
                      <p className="text-sm">{member.membership.plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${member.membership.plan.price}/month
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline">No Active Membership</Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="family" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Family Members</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Link Family Member
              </Button>
            </div>
            
            {familyMembers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">No family members linked</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {familyMembers.map((familyMember) => (
                  <Card key={familyMember.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={familyMember.avatar_url} />
                          <AvatarFallback>{getMemberInitials(familyMember)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{getMemberName(familyMember)}</p>
                          <p className="text-sm text-muted-foreground">{familyMember.email}</p>
                        </div>
                        {familyMember.relationship_type && (
                          <Badge variant="outline">{familyMember.relationship_type}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                            {doc.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getDocumentTypeColor(doc.document_type)}>
                            {doc.document_type}
                          </Badge>
                          {doc.file_url && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            {attendance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{attendance.total_visits}</div>
                      <div className="text-sm text-muted-foreground">Total Visits</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-success">{attendance.visits_last_30_days}</div>
                      <div className="text-sm text-muted-foreground">Last 30 Days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-warning">{attendance.visits_last_7_days}</div>
                      <div className="text-sm text-muted-foreground">Last 7 Days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-secondary">
                        {attendance.avg_duration_minutes ? Math.round(attendance.avg_duration_minutes) : '-'}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Minutes</div>
                    </CardContent>
                  </Card>
                </div>

                {attendance.last_visit && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Last Visit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.last_visit).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}