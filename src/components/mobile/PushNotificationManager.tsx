import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  BellOff,
  MessageSquare,
  Calendar,
  CreditCard,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Settings,
  Smartphone,
  RefreshCw,
  Inbox
} from 'lucide-react';

interface NotificationSettings {
  enabled: boolean;
  classReminders: boolean;
  paymentReminders: boolean;
  announcements: boolean;
  checkInConfirmation: boolean;
  marketingMessages: boolean;
  systemAlerts: boolean;
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'clicked';
}

export default function PushNotificationManager() {
  const { profile } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    classReminders: true,
    paymentReminders: true,
    announcements: true,
    checkInConfirmation: false,
    marketingMessages: false,
    systemAlerts: true
  });
  const [loading, setLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Fetch real notification history from Supabase
  const { data: notificationHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['push-notification-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, status, sent_at, read_at, created_at')
        .eq('member_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      // Transform to NotificationHistory format
      return (data || []).map((notification): NotificationHistory => ({
        id: notification.id,
        title: notification.title,
        body: notification.message,
        type: notification.type || 'system',
        timestamp: new Date(notification.sent_at || notification.created_at),
        status: notification.read_at ? 'clicked' : notification.sent_at ? 'delivered' : 'sent'
      }));
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    checkNotificationSupport();
    loadSettings();
  }, []);

  const checkNotificationSupport = () => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const requestPermission = async () => {
    if (!isSupported) return;

    setLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        setSettings(prev => ({ ...prev, enabled: true }));
        saveSettings({ ...settings, enabled: true });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // In a real implementation, you'd get this from your server
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(subscription);
      
      // Send subscription to server
      await sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    // In a real implementation, send subscription to your server
    console.log('Subscription:', subscription);
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
      }
      setSettings(prev => ({ ...prev, enabled: false }));
      saveSettings({ ...settings, enabled: false });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') return;

    try {
      new Notification('RepClub Test', {
        body: 'Push notifications are working correctly!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'test-notification'
      });
      
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'class_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment_confirmation':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default">Delivered</Badge>;
      case 'clicked':
        return <Badge variant="secondary">Clicked</Badge>;
      default:
        return <Badge variant="outline">Sent</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in this browser.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Push Notifications</h2>
          <p className="text-muted-foreground">
            Manage notification preferences and history
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <BellOff className="w-3 h-3" />
              Disabled
            </Badge>
          )}
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Notification Status
          </CardTitle>
          <CardDescription>
            Current permission status and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'default' && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Enable push notifications to receive updates about classes, payments, and announcements.
              </AlertDescription>
            </Alert>
          )}

          {permission === 'denied' && (
            <Alert>
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked. Please enable them in your browser settings to receive updates.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for important updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission === 'granted' ? (
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      subscribeToPush();
                    } else {
                      unsubscribeFromPush();
                    }
                  }}
                />
              ) : (
                <Button onClick={requestPermission} disabled={loading}>
                  {loading ? 'Requesting...' : 'Enable Notifications'}
                </Button>
              )}
            </div>
          </div>

          {permission === 'granted' && settings.enabled && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={sendTestNotification}
                className="flex-1"
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Test Notification
              </Button>
              {testNotificationSent && (
                <Badge variant="default" className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Test Sent
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <Label>Class Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded before your scheduled classes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.classReminders}
                  onCheckedChange={(checked) => updateSetting('classReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-green-500" />
                  <div>
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about payments and billing
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.paymentReminders}
                  onCheckedChange={(checked) => updateSetting('paymentReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <div>
                    <Label>Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Important gym announcements and updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.announcements}
                  onCheckedChange={(checked) => updateSetting('announcements', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  <div>
                    <Label>Check-in Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirm successful gym check-ins
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.checkInConfirmation}
                  onCheckedChange={(checked) => updateSetting('checkInConfirmation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => updateSetting('systemAlerts', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                History of notifications sent to you
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : notificationHistory.length === 0 ? (
            <div className="py-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Notifications Yet</h3>
              <p className="text-sm text-muted-foreground">
                You'll see your notification history here once you start receiving notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationHistory.map((notification) => (
                <div key={notification.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(notification.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}