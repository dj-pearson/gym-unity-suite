import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export type NotificationType =
  | 'payment_failed'
  | 'payment_past_due'
  | 'class_full'
  | 'member_inactive'
  | 'membership_expiring'
  | 'equipment_maintenance'
  | 'staff_certification_expiring'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  organization_id: string;
  member_id?: string; // Member the notification is about
  type: NotificationType | string;
  priority: NotificationPriority | string;
  title: string;
  message: string;
  metadata?: Record<string, any> | null; // Additional data (member_id, class_id, etc.)
  status: string;
  is_read: boolean; // Derived from read_at
  created_at: string;
  read_at?: string | null;
  scheduled_for?: string | null;
  sent_at?: string | null;
}

/**
 * Hook to fetch notifications for current user/organization
 */
export function useNotifications(organizationId: string | undefined, userId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['notifications', organizationId, userId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      // Query real notifications from the database
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      // Transform database rows to include is_read derived field
      const notifications: Notification[] = (data || []).map((row) => ({
        id: row.id,
        organization_id: row.organization_id,
        member_id: row.member_id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        metadata: row.metadata as Record<string, any> | null,
        status: row.status,
        is_read: !!row.read_at, // Derive from read_at timestamp
        created_at: row.created_at,
        read_at: row.read_at,
        scheduled_for: row.scheduled_for,
        sent_at: row.sent_at,
      }));

      return notifications;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds - notifications should be fairly fresh
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount(organizationId: string | undefined, userId?: string) {
  const { data: notifications = [] } = useNotifications(organizationId, userId);

  return notifications.filter(n => !n.is_read).length;
}

/**
 * Hook for notification mutations (mark as read, delete)
 */
export function useNotificationMutations(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .is('read_at', null);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'All notifications marked as read',
      });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
