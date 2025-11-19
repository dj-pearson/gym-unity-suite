import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Send, 
  User,
  Calendar,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailMessageDetailProps {
  messageId: string;
  onUpdateStatus: (messageId: string, status: string) => void;
  onAssignMember: (messageId: string, userId: string) => void;
  onClose: () => void;
}

export function EmailMessageDetail({ messageId, onUpdateStatus, onAssignMember, onClose }: EmailMessageDetailProps) {
  const [message, setMessage] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMessage();
    fetchResponses();
    fetchTeamMembers();
  }, [messageId]);

  const fetchMessage = async () => {
    const { data, error } = await supabase
      .from('email_messages')
      .select(`
        *,
        assigned_user:profiles!email_messages_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching message:', error);
    } else {
      setMessage(data);
    }
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('email_responses')
      .select(`
        *,
        sender:profiles!email_responses_sent_by_fkey(first_name, last_name, email)
      `)
      .eq('message_id', messageId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
    } else {
      setResponses(data || []);
    }
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('role', ['owner', 'staff'])
      .limit(50);

    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      setTeamMembers(data || []);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-response', {
        body: { messageId, responseBody: replyBody }
      });

      if (error) throw error;

      toast.success('Reply sent successfully via Amazon SES');
      setReplyBody('');
      fetchResponses();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'disregarded': return 'outline';
      default: return 'default';
    }
  };

  if (!message) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading message...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2">{message.subject}</CardTitle>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>From: {message.from_name || message.from_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(message.received_date), 'PPpp')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(message.status)}>
                  {message.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(messageId, 'closed')}
            disabled={message.status === 'closed'}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(messageId, 'disregarded')}
            disabled={message.status === 'disregarded'}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Disregard
          </Button>
          <Select
            value={message.assigned_to || ''}
            onValueChange={(value) => onAssignMember(messageId, value)}
          >
            <SelectTrigger className="w-[200px]">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Body */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <ScrollArea className="h-[200px]">
            <div className="whitespace-pre-wrap text-sm">{message.body}</div>
          </ScrollArea>
        </div>

        {/* Previous Responses */}
        {responses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Response History</h4>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {responses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">
                        {response.sender?.first_name} {response.sender?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(response.sent_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{response.response_body}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Reply Form */}
        {message.status === 'open' && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">Send Reply via Amazon SES</h4>
            <Textarea
              placeholder="Type your reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button 
              onClick={handleSendReply} 
              disabled={sending || !replyBody.trim()}
              className="w-full sm:w-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        )}
        
        {message.status !== 'open' && (
          <div className="text-sm text-muted-foreground text-center p-4 border rounded-lg bg-muted/30">
            This ticket is {message.status}. Reopen it to send replies.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
