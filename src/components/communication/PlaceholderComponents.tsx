import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Megaphone, 
  Mail, 
  Headphones, 
  Trophy, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Send,
  Eye,
  MessageSquare,
  Calendar,
  Target
} from 'lucide-react';

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'all_members',
    priority: 'normal',
    scheduled_for: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          ...newAnnouncement,
          organization_id: profile?.organization_id,
          created_by: profile?.id,
          scheduled_for: newAnnouncement.scheduled_for || null,
          expires_at: newAnnouncement.expires_at || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully"
      });

      setShowCreateDialog(false);
      setNewAnnouncement({
        title: '',
        content: '',
        target_audience: 'all_members',
        priority: 'normal',
        scheduled_for: '',
        expires_at: ''
      });
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive"
      });
    }
  };

  const publishAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement published successfully"
      });

      fetchAnnouncements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish announcement",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading announcements...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Announcements
            </CardTitle>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target Audience</label>
                    <Select
                      value={newAnnouncement.target_audience}
                      onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, target_audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_members">All Members</SelectItem>
                        <SelectItem value="active_members">Active Members</SelectItem>
                        <SelectItem value="new_members">New Members</SelectItem>
                        <SelectItem value="staff">Staff Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={newAnnouncement.priority}
                      onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Schedule For (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newAnnouncement.scheduled_for}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, scheduled_for: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expires At (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newAnnouncement.expires_at}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAnnouncement}>
                    Create Announcement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No announcements yet. Create your first announcement!</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{announcement.title}</h3>
                          <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {announcement.priority}
                          </Badge>
                          {announcement.is_published ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Target: {announcement.target_audience.replace('_', ' ')}</span>
                          <span>Created: {format(new Date(announcement.created_at), 'MMM dd, yyyy')}</span>
                          {announcement.scheduled_for && (
                            <span>Scheduled: {format(new Date(announcement.scheduled_for), 'MMM dd, yyyy HH:mm')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!announcement.is_published && (
                          <Button size="sm" onClick={() => publishAnnouncement(announcement.id)}>
                            <Send className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading email templates...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input placeholder="Search templates..." className="w-64" />
              <Button size="sm" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No email templates yet. Create your first template!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium mb-1">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.template_type}</Badge>
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
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

export function SupportTickets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="w-5 h-5" />
          Support Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input placeholder="Search tickets..." className="w-64" />
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">#001</TableCell>
                <TableCell>John Doe</TableCell>
                <TableCell>Equipment Issue</TableCell>
                <TableCell>
                  <Badge variant="destructive">High</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Open</Badge>
                </TableCell>
                <TableCell>2 hours ago</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#002</TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>Class Booking Issue</TableCell>
                <TableCell>
                  <Badge variant="secondary">Normal</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">In Progress</Badge>
                </TableCell>
                <TableCell>1 day ago</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MilestoneTracking() {
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
              <Input placeholder="Search members..." className="w-64" />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Milestones</SelectItem>
                  <SelectItem value="visits">Visit Milestones</SelectItem>
                  <SelectItem value="classes">Class Milestones</SelectItem>
                  <SelectItem value="referrals">Referral Milestones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          <div className="grid gap-4">
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">50 Visit Milestone</h3>
                    <p className="text-sm text-muted-foreground">Sarah Johnson reached 50 gym visits!</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Visit Milestone</Badge>
                      <span className="text-xs text-muted-foreground">Achieved today</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm">
                      <Trophy className="w-4 h-4 mr-1" />
                      Celebrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">First Class Completed</h3>
                    <p className="text-sm text-muted-foreground">Mike Wilson completed his first fitness class</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Class Milestone</Badge>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm">
                      <Trophy className="w-4 h-4 mr-1" />
                      Celebrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">First Referral</h3>
                    <p className="text-sm text-muted-foreground">Amy Davis referred her first new member</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Referral Milestone</Badge>
                      <span className="text-xs text-muted-foreground">Yesterday</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm">
                      <Trophy className="w-4 h-4 mr-1" />
                      Celebrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}