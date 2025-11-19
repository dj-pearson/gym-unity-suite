import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Mail, 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  Send,
  Settings,
  Users,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { EmailThreadList } from './EmailThreadList';
import { EmailMessageList } from './EmailMessageList';
import { EmailMessageDetail } from './EmailMessageDetail';
import { SMTPSettingsDialog } from './SMTPSettingsDialog';
import { toast } from 'sonner';

export default function EmailTicketManager() {
  const { profile } = useAuth();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalThreads: 0,
    openTickets: 0,
    closedTickets: 0,
    disregardedTickets: 0
  });
  const [showSMTPDialog, setShowSMTPDialog] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [currentThreadHasSMTP, setCurrentThreadHasSMTP] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchThreads();
      fetchStats();
      generateWebhookUrl();
    }
  }, [profile]);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread);
      checkSMTPSettings(activeThread);
    }
  }, [activeThread]);

  const generateWebhookUrl = () => {
    const projectRef = 'nerqstezuygviutluslt';
    const url = `https://${projectRef}.supabase.co/functions/v1/receive-email`;
    setWebhookUrl(url);
  };

  const checkSMTPSettings = async (threadId: string) => {
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('id')
      .eq('thread_id', threadId)
      .single();

    setCurrentThreadHasSMTP(!!data);
  };

  const fetchThreads = async () => {
    // Fetch threads with SMTP status
    const { data: threadsData, error: threadsError } = await supabase
      .from('email_threads')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('updated_at', { ascending: false });

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      toast.error('Failed to load email threads');
      return;
    }

    // Check SMTP settings for each thread
    const threadsWithSMTP = await Promise.all(
      (threadsData || []).map(async (thread) => {
        const { data: smtp } = await supabase
          .from('smtp_settings')
          .select('id')
          .eq('thread_id', thread.id)
          .single();
        
        return { ...thread, has_smtp: !!smtp };
      })
    );

    setThreads(threadsWithSMTP);
    if (threadsWithSMTP && threadsWithSMTP.length > 0 && !activeThread) {
      setActiveThread(threadsWithSMTP[0].id);
    }
  };

  const fetchMessages = async (threadId: string) => {
    const { data, error } = await supabase
      .from('email_messages')
      .select(`
        *,
        assigned_user:profiles!email_messages_assigned_to_fkey(first_name, last_name, email)
      `)
      .eq('thread_id', threadId)
      .order('received_date', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } else {
      setMessages(data || []);
    }
  };

  const fetchStats = async () => {
    const { data: allMessages } = await supabase
      .from('email_messages')
      .select('status, thread_id')
      .in('thread_id', threads.map(t => t.id));

    if (allMessages) {
      setStats({
        totalThreads: threads.length,
        openTickets: allMessages.filter(m => m.status === 'open').length,
        closedTickets: allMessages.filter(m => m.status === 'closed').length,
        disregardedTickets: allMessages.filter(m => m.status === 'disregarded').length
      });
    }
  };

  const handleUpdateMessageStatus = async (messageId: string, status: string) => {
    const { error } = await supabase
      .from('email_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Ticket ${status}`);
      fetchMessages(activeThread!);
      fetchStats();
    }
  };

  const handleAssignMember = async (messageId: string, userId: string) => {
    const { error } = await supabase
      .from('email_messages')
      .update({ assigned_to: userId })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to assign member');
    } else {
      toast.success('Member assigned');
      fetchMessages(activeThread!);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard!');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Ticket System</h2>
          <p className="text-muted-foreground">Manage incoming support emails</p>
        </div>
        <Button onClick={() => setShowSMTPDialog(true)} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          SMTP Settings
        </Button>
      </div>

      {/* Webhook URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Webhook URL for Make.com
          </CardTitle>
          <CardDescription>
            Use this URL in your Make.com HTTP request module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded text-sm">
              {webhookUrl}
            </code>
            <Button onClick={copyWebhookUrl} variant="outline">
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disregarded</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disregardedTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* SMTP Warning Alert */}
      {activeThread && !currentThreadHasSMTP && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>SMTP Not Configured</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You need to configure SMTP settings for this thread to send email replies.</span>
            <Button 
              onClick={() => setShowSMTPDialog(true)} 
              variant="outline" 
              size="sm"
              className="ml-4"
            >
              Configure Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Thread List */}
        <div className="md:col-span-3">
          <EmailThreadList 
            threads={threads}
            activeThread={activeThread}
            onSelectThread={setActiveThread}
          />
        </div>

        {/* Message List */}
        <div className="md:col-span-4">
          {activeThread && (
            <EmailMessageList 
              messages={messages}
              selectedMessage={selectedMessage}
              onSelectMessage={setSelectedMessage}
            />
          )}
        </div>

        {/* Message Detail */}
        <div className="md:col-span-5">
          {selectedMessage && (
            <EmailMessageDetail 
              messageId={selectedMessage}
              onUpdateStatus={handleUpdateMessageStatus}
              onAssignMember={handleAssignMember}
              onClose={() => setSelectedMessage(null)}
            />
          )}
        </div>
      </div>

      {showSMTPDialog && activeThread && (
        <SMTPSettingsDialog 
          threadId={activeThread}
          open={showSMTPDialog}
          onOpenChange={(open) => {
            setShowSMTPDialog(open);
            if (!open) {
              checkSMTPSettings(activeThread);
              fetchThreads();
            }
          }}
        />
      )}
    </div>
  );
}
