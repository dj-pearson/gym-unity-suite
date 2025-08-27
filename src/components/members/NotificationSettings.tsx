import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Loader2, Save } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];

interface NotificationSettingsProps {
  memberId: string;
}

export function NotificationSettings({ memberId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, [memberId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('member_id', memberId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            member_id: memberId,
            email_enabled: true,
            push_enabled: true,
            sms_enabled: false,
            class_reminders: true,
            waitlist_updates: true,
            membership_updates: true,
            marketing_notifications: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: 'Error loading preferences',
        description: 'Could not load your notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          email_enabled: preferences.email_enabled,
          push_enabled: preferences.push_enabled,
          sms_enabled: preferences.sms_enabled,
          class_reminders: preferences.class_reminders,
          waitlist_updates: preferences.waitlist_updates,
          membership_updates: preferences.membership_updates,
          marketing_notifications: preferences.marketing_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', memberId);

      if (error) throw error;

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving preferences',
        description: error.message || 'Could not save your notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const notificationGroups = [
    {
      title: 'Communication Channels',
      icon: Bell,
      items: [
        {
          key: 'email_enabled' as keyof NotificationPreferences,
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: Mail,
        },
        {
          key: 'push_enabled' as keyof NotificationPreferences,
          label: 'Push Notifications',
          description: 'Receive push notifications in the app',
          icon: Bell,
        },
        {
          key: 'sms_enabled' as keyof NotificationPreferences,
          label: 'SMS Notifications',
          description: 'Receive notifications via text message',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: 'Class & Activity Notifications',
      icon: Bell,
      items: [
        {
          key: 'class_reminders' as keyof NotificationPreferences,
          label: 'Class Reminders',
          description: 'Get reminded about upcoming classes you\'ve booked',
        },
        {
          key: 'waitlist_updates' as keyof NotificationPreferences,
          label: 'Waitlist Updates',
          description: 'Be notified about waitlist status changes',
        },
      ],
    },
    {
      title: 'Membership Updates',
      icon: Bell,
      items: [
        {
          key: 'membership_updates' as keyof NotificationPreferences,
          label: 'Membership Updates',
          description: 'Important updates about your membership',
        },
      ],
    },
    {
      title: 'Marketing Communications',
      icon: Bell,
      items: [
        {
          key: 'marketing_notifications' as keyof NotificationPreferences,
          label: 'Marketing Communications',
          description: 'Marketing newsletters and promotional communications',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {notificationGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <group.icon className="w-5 h-5" />
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-start justify-between space-y-0">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-base font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                <Switch
                  checked={preferences[item.key] as boolean}
                  onCheckedChange={(checked) => updatePreference(item.key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}