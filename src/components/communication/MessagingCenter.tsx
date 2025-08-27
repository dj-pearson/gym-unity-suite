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
import { MessageSquare, Send, Search, Filter, Plus, Reply } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
  sender_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  };
  recipient_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  };
}

export function MessagingCenter() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewMessage, setShowNewMessage] = useState(false);

  // New message form
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'general'
  });

  useEffect(() => {
    fetchMessages();
    fetchMembers();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('member_messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(first_name, last_name, avatar_url, role),
          recipient_profile:profiles!recipient_id(first_name, last_name, avatar_url, role)
        `)
        .or(`sender_id.eq.${profile?.id},recipient_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      const { error } = await supabase
        .from('member_messages')
        .insert([{
          sender_id: profile?.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content,
          message_type: newMessage.message_type,
          status: 'sent'
        }]);

      if (error) throw error;

      toast({
        title: "Message sent successfully"
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        message_type: 'general'
      });
      setShowNewMessage(false);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('member_messages')
        .update({ status: 'read' })
        .eq('id', messageId)
        .eq('recipient_id', profile?.id);
      
      fetchMessages();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.sender_profile.first_name + ' ' + message.sender_profile.last_name)
        .toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || message.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="animate-pulse">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Messages List */}
      <div className="space-y-2">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No messages found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search or filters' : 'Start a conversation by sending your first message'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => {
            const isReceived = message.recipient_id === profile?.id;
            const otherProfile = isReceived ? message.sender_profile : message.recipient_profile;
            const isUnread = isReceived && message.status === 'sent';
            
            return (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  isUnread ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => isUnread && markAsRead(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="flex-shrink-0">
                      <AvatarImage src={otherProfile?.avatar_url} />
                      <AvatarFallback>
                        {otherProfile?.first_name?.[0]}{otherProfile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-foreground truncate">
                            {otherProfile?.first_name} {otherProfile?.last_name}
                          </span>
                          <Badge variant="outline" size="sm">
                            {otherProfile?.role}
                          </Badge>
                          <Badge variant={message.message_type === 'support' ? 'destructive' : 'secondary'} size="sm">
                            {message.message_type}
                          </Badge>
                          {isUnread && (
                            <Badge variant="default" size="sm">New</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      
                      <h4 className={`text-sm mb-1 truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {isReceived ? '' : 'To: '}{message.subject}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isReceived 
                            ? message.status === 'read' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isReceived 
                            ? message.status === 'read' ? 'Read' : 'Delivered'
                            : 'Sent'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}