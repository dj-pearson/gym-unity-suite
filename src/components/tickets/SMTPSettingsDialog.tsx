import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SMTPSettingsDialogProps {
  threadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SMTPSettingsDialog({ threadId, open, onOpenChange }: SMTPSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open, threadId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (data) {
      setSettings(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('smtp_settings')
        .upsert({
          thread_id: threadId,
          ...settings
        });

      if (error) throw error;

      toast.success('SMTP settings saved successfully');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>SMTP Settings</DialogTitle>
          <DialogDescription>
            Configure SMTP settings to send email replies
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              value={settings.smtp_host}
              onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              value={settings.smtp_port}
              onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
              placeholder="587"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_username">Username</Label>
            <Input
              id="smtp_username"
              value={settings.smtp_username}
              onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
              placeholder="your-email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_password">Password</Label>
            <Input
              id="smtp_password"
              type="password"
              value={settings.smtp_password}
              onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
              placeholder="Your SMTP password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_email">From Email</Label>
            <Input
              id="from_email"
              value={settings.from_email}
              onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              placeholder="support@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              value={settings.from_name}
              onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              placeholder="Support Team"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="use_tls"
              checked={settings.use_tls}
              onCheckedChange={(checked) => setSettings({ ...settings, use_tls: checked })}
            />
            <Label htmlFor="use_tls">Use TLS</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
