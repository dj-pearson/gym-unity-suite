import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  Reply, 
  MoreVertical,
  Phone,
  Video,
  Archive,
  Star,
  Paperclip
} from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
    role: string;
  };
  recipient_profile?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function MessagingCenter() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });

  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchConversations();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          subject,
          content,
          is_read,
          created_at,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name, role),
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name, role)
        `)
        .or(`sender_id.eq.${profile?.id},recipient_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map();
      data?.forEach((message: any) => {
        const partnerId = message.sender_id === profile?.id ? message.recipient_id : message.sender_id;
        if (!conversationMap.has(partnerId) || new Date(message.created_at) > new Date(conversationMap.get(partnerId).created_at)) {
          conversationMap.set(partnerId, message);
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          subject,
          content,
          is_read,
          created_at,
          sender_profile:profiles!messages_sender_id_fkey(first_name, last_name, role),
          recipient_profile:profiles!messages_recipient_id_fkey(first_name, last_name, role)
        `)
        .or(`and(sender_id.eq.${profile?.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${profile?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', profile?.id)
        .eq('sender_id', partnerId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile?.organization_id)
        .neq('id', profile?.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const sendMessage = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: profile?.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully"
      });

      setShowNewMessage(false);
      setNewMessage({ recipient_id: '', subject: '', content: '' });
      fetchConversations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const sendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: profile?.id,
          recipient_id: selectedConversation,
          subject: 'Re: ' + (messages[0]?.subject || 'Message'),
          content: replyMessage
        }]);

      if (error) throw error;

      setReplyMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    }
  };

  const getConversationPartner = (message: Message) => {
    if (message.sender_id === profile?.id) {
      return message.recipient_profile;
    }
    return message.sender_profile;
  };

  const filteredConversations = conversations.filter(conversation => {
    const partner = getConversationPartner(conversation);
    const fullName = `${partner?.first_name} ${partner?.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           conversation.subject.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <Card><CardContent className="p-6">Loading conversations...</CardContent></Card>;
  }

  return (
    <div className="h-[600px] flex border rounded-lg">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Messages</h2>
            <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <Select
                      value={newMessage.recipient_id}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient_id: value }))}
                    >
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
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Message subject"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Type your message here..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                      Cancel
                    </Button>
                    <Button onClick={sendMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const partner = getConversationPartner(conversation);
                const isSelected = selectedConversation === (conversation.sender_id === profile?.id ? conversation.recipient_id : conversation.sender_id);
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.sender_id === profile?.id ? conversation.recipient_id : conversation.sender_id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {partner?.first_name?.[0]}{partner?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {partner?.first_name} {partner?.last_name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.created_at), 'MMM dd')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.content}
                        </p>
                      </div>
                      {!conversation.is_read && conversation.recipient_id === profile?.id && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {messages.length > 0 && 
                        getConversationPartner(messages[0])?.first_name?.[0]
                      }
                      {messages.length > 0 && 
                        getConversationPartner(messages[0])?.last_name?.[0]
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {messages.length > 0 && getConversationPartner(messages[0]) &&
                        `${getConversationPartner(messages[0])?.first_name} ${getConversationPartner(messages[0])?.last_name}`
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {messages.length > 0 && getConversationPartner(messages[0])?.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === profile?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Textarea
                  placeholder="Type a message..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[40px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button onClick={sendReply} disabled={!replyMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}