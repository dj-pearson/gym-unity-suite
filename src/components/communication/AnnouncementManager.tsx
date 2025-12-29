import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Megaphone, Plus, Edit, Send } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  is_published: boolean;
  published_at: string | null;
  scheduled_for: string | null;
  expires_at: string | null;
  created_at: string;
}

interface NewAnnouncement {
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  scheduled_for: string;
  expires_at: string;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
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
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      // Error handled silently - empty state shown
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
      if (!profile?.organization_id) {
        throw new Error('No organization ID');
      }

      const { error } = await supabase
        .from('announcements')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', profile.organization_id);

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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnnouncement(announcement)}
                        >
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

export default AnnouncementManager;
