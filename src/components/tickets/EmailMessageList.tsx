import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox } from 'lucide-react';
import { format } from 'date-fns';

interface EmailMessageListProps {
  messages: any[];
  selectedMessage: string | null;
  onSelectMessage: (messageId: string) => void;
}

export function EmailMessageList({ messages, selectedMessage, onSelectMessage }: EmailMessageListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disregarded': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-1 p-4">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelectMessage(message.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedMessage === message.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{message.from_name || message.from_email}</div>
                    <div className="text-sm text-muted-foreground truncate">{message.subject}</div>
                  </div>
                  <Badge className={getStatusColor(message.status)}>
                    {message.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {format(new Date(message.received_date), 'MMM d, h:mm a')}
                </div>
                {message.assigned_user && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Assigned: {message.assigned_user.first_name} {message.assigned_user.last_name}
                  </div>
                )}
              </button>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages in this thread
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
