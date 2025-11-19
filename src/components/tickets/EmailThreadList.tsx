import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail } from 'lucide-react';

interface EmailThreadListProps {
  threads: any[];
  activeThread: string | null;
  onSelectThread: (threadId: string) => void;
}

export function EmailThreadList({ threads, activeThread, onSelectThread }: EmailThreadListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Threads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-1 p-4">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeThread === thread.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{thread.display_name}</span>
                  <div className="flex items-center gap-1">
                    {thread.is_active && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-70">{thread.domain}</div>
              </button>
            ))}
            {threads.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No email threads yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
