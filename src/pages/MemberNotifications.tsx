import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Settings, 
  AlertCircle,
  Calendar,
  Trophy,
  Users,
  Star,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  read_at?: string;
  metadata: any; // Using any to handle Supabase Json type
}

interface NotificationPreferences {
  id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  class_reminders: boolean;
  waitlist_updates: boolean;
  membership_updates: boolean;
  marketing_notifications: boolean;
}

export default function MemberNotifications() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [profile?.id]);

  const fetchNotifications = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('member_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    }
  };

  const fetchPreferences = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('member_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            member_id: profile.id
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingRead(prev => new Set(prev).add(notificationId));
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: 'read', read_at: new Date().toISOString() }
          : n
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setMarkingRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => n.status === 'unread')
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.status === 'unread' 
          ? { ...n, status: 'read', read_at: new Date().toISOString() }
          : n
      ));

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Deleted",
        description: "Notification removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('member_id', profile?.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      
      toast({
        title: "Updated",
        description: "Notification preference saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'class_reminder': return Calendar;
      case 'waitlist_promotion': return Users;
      case 'loyalty_reward': return Trophy;
      case 'membership_update': return Star;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-destructive';
    switch (type) {
      case 'class_reminder': return 'text-primary';
      case 'waitlist_promotion': return 'text-success';
      case 'loyalty_reward': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const allNotifications = notifications;
  const unreadNotifications = notifications.filter(n => n.status === 'unread');
  const readNotifications = notifications.filter(n => n.status === 'read');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with important information</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Badge className="bg-gradient-primary text-white">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="all">All ({allNotifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <TabsContent value="all" className="space-y-4">
          {allNotifications.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <BellOff className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! We'll notify you when there's something new.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const isUnread = notification.status === 'unread';
                const isMarkingAsRead = markingRead.has(notification.id);
                
                return (
                  <Card key={notification.id} className={`gym-card transition-all ${isUnread ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isUnread ? 'bg-gradient-primary text-white' : 'bg-muted'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`font-medium ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{format(new Date(notification.created_at), 'MMM d, h:mm a')}</span>
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="h-5 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {isUnread && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsRead(notification.id)}
                                  disabled={isMarkingAsRead}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="p-8 text-center">
                <Check className="mx-auto h-12 w-12 text-success opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  No unread notifications. Great job staying on top of things!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unreadNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                
                return (
                  <Card key={notification.id} className="gym-card border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-primary text-white rounded-full flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <span className="text-xs text-muted-foreground mt-2 block">
                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={markingRead.has(notification.id)}
                              className="bg-gradient-success hover:opacity-90"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {preferences && (
            <>
              {/* Delivery Methods */}
              <Card className="gym-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Delivery Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.email_enabled}
                      onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="sms-notifications" className="text-sm font-medium">SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive important updates via text</p>
                      </div>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={preferences.sms_enabled}
                      onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="push-notifications" className="text-sm font-medium">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">Browser and app notifications</p>
                      </div>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={preferences.push_enabled}
                      onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card className="gym-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Notification Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <Label htmlFor="class-reminders" className="text-sm font-medium">Class Reminders</Label>
                        <p className="text-xs text-muted-foreground">Get reminded about upcoming classes</p>
                      </div>
                    </div>
                    <Switch
                      id="class-reminders"
                      checked={preferences.class_reminders}
                      onCheckedChange={(checked) => updatePreference('class_reminders', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-success" />
                      <div>
                        <Label htmlFor="waitlist-updates" className="text-sm font-medium">Waitlist Updates</Label>
                        <p className="text-xs text-muted-foreground">Notifications when you move up the waitlist</p>
                      </div>
                    </div>
                    <Switch
                      id="waitlist-updates"
                      checked={preferences.waitlist_updates}
                      onCheckedChange={(checked) => updatePreference('waitlist_updates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-warning" />
                      <div>
                        <Label htmlFor="membership-updates" className="text-sm font-medium">Membership Updates</Label>
                        <p className="text-xs text-muted-foreground">Important membership and billing information</p>
                      </div>
                    </div>
                    <Switch
                      id="membership-updates"
                      checked={preferences.membership_updates}
                      onCheckedChange={(checked) => updatePreference('membership_updates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-secondary" />
                      <div>
                        <Label htmlFor="marketing-notifications" className="text-sm font-medium">Promotional Content</Label>
                        <p className="text-xs text-muted-foreground">Special offers and gym updates</p>
                      </div>
                    </div>
                    <Switch
                      id="marketing-notifications"
                      checked={preferences.marketing_notifications}
                      onCheckedChange={(checked) => updatePreference('marketing_notifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}