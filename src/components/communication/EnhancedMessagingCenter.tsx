import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Phone, 
  Users, 
  Filter,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageHistory {
  id: string;
  recipient_type: 'member' | 'staff' | 'lead';
  recipient_id: string;
  message_type: 'sms' | 'email' | 'push';
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

interface Recipient {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role?: string;
  type: 'member' | 'staff' | 'lead';
}

interface Template {
  id: string;
  name: string;
  template_type: 'sms' | 'email';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
}

export default function EnhancedMessagingCenter() {
  const { profile } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientFilter, setRecipientFilter] = useState('all');

  // Form state
  const [messageForm, setMessageForm] = useState({
    message_type: 'email' as 'sms' | 'email',
    template_id: '',
    subject: '',
    content: '',
    recipient_ids: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, [profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchRecipients(),
        fetchTemplates(),
        fetchMessageHistory()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      // Fetch members and staff
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, role')
        .eq('organization_id', profile?.organization_id)
        .neq('id', profile?.id);

      if (profilesError) throw profilesError;

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', profile?.organization_id);

      if (leadsError) throw leadsError;

      const allRecipients: Recipient[] = [
        ...(profiles || []).map(p => ({
          ...p,
          type: (p.role === 'member' ? 'member' : 'staff') as 'member' | 'staff'
        })),
        ...(leads || []).map(l => ({
          ...l,
          type: 'lead' as const
        }))
      ];

      setRecipients(allRecipients);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_templates' as any)
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('message_history' as any)
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessageHistory((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching message history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!messageForm.content) {
      toast.error('Please enter message content');
      return;
    }

    if (messageForm.message_type === 'email' && !messageForm.subject) {
      toast.error('Please enter email subject');
      return;
    }

    try {
      setLoading(true);

      // Create message history entries for each recipient
      const messagePromises = selectedRecipients.map(async (recipientId) => {
        const recipient = recipients.find(r => r.id === recipientId);
        if (!recipient) return;

        const messageData = {
          organization_id: profile?.organization_id,
          recipient_type: recipient.type,
          recipient_id: recipientId,
          message_type: messageForm.message_type,
          template_id: messageForm.template_id || null,
          subject: messageForm.subject,
          content: processMessageContent(messageForm.content, recipient),
          status: 'pending',
          sent_by: profile?.id
        };

        const { error } = await supabase
          .from('message_history' as any)
          .insert([messageData]);

        if (error) throw error;
      });

      await Promise.all(messagePromises);

      toast.success(`Message queued for ${selectedRecipients.length} recipient(s)`);
      
      // Reset form
      setMessageForm({
        message_type: 'email',
        template_id: '',
        subject: '',
        content: '',
        recipient_ids: []
      });
      setSelectedRecipients([]);
      setShowSendDialog(false);
      fetchMessageHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const processMessageContent = (content: string, recipient: Recipient) => {
    return content
      .replace(/\{\{first_name\}\}/g, recipient.first_name || 'Member')
      .replace(/\{\{last_name\}\}/g, recipient.last_name || '')
      .replace(/\{\{full_name\}\}/g, `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim())
      .replace(/\{\{email\}\}/g, recipient.email)
      .replace(/\{\{phone\}\}/g, recipient.phone || '')
      .replace(/\{\{gym_name\}\}/g, 'Your Gym'); // This should come from organization settings
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageForm(prev => ({
        ...prev,
        template_id: templateId,
        message_type: template.template_type,
        subject: template.subject || prev.subject,
        content: template.content
      }));
    }
  };

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectAllRecipients = () => {
    const filteredRecipients = getFilteredRecipients();
    setSelectedRecipients(filteredRecipients.map(r => r.id));
  };

  const clearSelectedRecipients = () => {
    setSelectedRecipients([]);
  };

  const getFilteredRecipients = () => {
    return recipients.filter(recipient => {
      if (recipientFilter === 'all') return true;
      return recipient.type === recipientFilter;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'sent':
        return <Send className="w-4 h-4 text-info" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRecipientName = (recipient: Recipient) => {
    if (recipient.first_name && recipient.last_name) {
      return `${recipient.first_name} ${recipient.last_name}`;
    }
    return recipient.email;
  };

  if (loading && recipients.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Messaging Center</h2>
          <p className="text-muted-foreground">Send messages to members, staff, and leads</p>
        </div>
        
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Recipients */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Recipients</Label>
                  <div className="flex items-center justify-between mt-2">
                    <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="member">Members</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="lead">Leads</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={selectAllRecipients}>
                        Select All
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearSelectedRecipients}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedRecipients.length} selected
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {getFilteredRecipients().map(recipient => (
                    <div key={recipient.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.id)}
                        onCheckedChange={() => handleRecipientToggle(recipient.id)}
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{getRecipientName(recipient)}</div>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{recipient.type}</Badge>
                          {recipient.role && (
                            <Badge variant="secondary" className="text-xs">{recipient.role}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="message_type">Message Type</Label>
                    <Select 
                      value={messageForm.message_type} 
                      onValueChange={(value: 'sms' | 'email') => setMessageForm(prev => ({...prev, message_type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template_id">Template (Optional)</Label>
                    <Select 
                      value={messageForm.template_id} 
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No template</SelectItem>
                        {templates
                          .filter(t => t.template_type === messageForm.message_type)
                          .map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {messageForm.message_type === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm(prev => ({...prev, subject: e.target.value}))}
                      placeholder="Enter email subject"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Message Content {messageForm.message_type === 'sms' && '(160 chars recommended)'}
                  </Label>
                  <Textarea
                    id="content"
                    value={messageForm.content}
                    onChange={(e) => setMessageForm(prev => ({...prev, content: e.target.value}))}
                    rows={8}
                    placeholder="Enter your message..."
                  />
                  {messageForm.message_type === 'sms' && (
                    <div className="text-xs text-muted-foreground">
                      Character count: {messageForm.content.length}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Available variables: {`{{first_name}}, {{last_name}}, {{email}}, {{phone}}`}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowSendDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={selectedRecipients.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedRecipients.length} recipient(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messageHistory.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Messages Sent Yet</h3>
              <p className="text-muted-foreground">
                Start communicating with your members, staff, and leads
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messageHistory.map((message) => {
                const recipient = recipients.find(r => r.id === message.recipient_id);
                return (
                  <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {message.message_type === 'sms' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      <div>
                        <div className="font-medium">
                          {message.subject || message.content.substring(0, 50) + '...'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {recipient ? getRecipientName(recipient) : 'Unknown'} • 
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <Badge 
                        variant={
                          message.status === 'delivered' ? 'default' : 
                          message.status === 'failed' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {recipients.filter(r => r.type === 'member').length}
            </div>
            <div className="text-sm text-muted-foreground">Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {recipients.filter(r => r.type === 'staff').length}
            </div>
            <div className="text-sm text-muted-foreground">Staff</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {recipients.filter(r => r.type === 'lead').length}
            </div>
            <div className="text-sm text-muted-foreground">Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-info">
              {messageHistory.filter(m => m.status === 'delivered').length}
            </div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}