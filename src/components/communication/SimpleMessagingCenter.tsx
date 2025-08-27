import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Send, Search, Plus, Reply } from 'lucide-react';

export function SimpleMessagingCenter() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // New message form
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'general'
  });

  useEffect(() => {
    fetchMembers();
    setLoading(false);
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, avatar_url')
        .eq('organization_id', profile?.organization_id)
        .neq('id', profile?.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // For now, we'll just show a success message since the table structure is being updated
      toast({
        title: "Message functionality coming soon",
        description: "The messaging system is being set up. This feature will be available shortly."
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        message_type: 'general'
      });
      setShowNewMessage(false);
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading messaging center...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Member Communication</h2>
          <p className="text-muted-foreground">Send messages and communicate with your members</p>
        </div>
        
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient *</label>
                <Select value={newMessage.recipient_id} onValueChange={(value) => 
                  setNewMessage({...newMessage, recipient_id: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select value={newMessage.message_type} onValueChange={(value) => 
                  setNewMessage({...newMessage, message_type: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Message subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  placeholder="Type your message here..."
                  rows={5}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Placeholder for Messages */}
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Messaging System Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're setting up the communication infrastructure. In-app messaging, announcements, and support tickets will be available shortly.
          </p>
          <Badge variant="secondary" className="text-xs">Feature In Development</Badge>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Direct Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Send private messages to members and staff
            </p>
            <Button variant="outline" className="w-full" onClick={() => setShowNewMessage(true)}>
              Compose Message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Broadcast important news to all members
            </p>
            <Button variant="outline" className="w-full" disabled>
              Create Announcement
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Reply className="w-4 h-4" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage member support requests and issues
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}