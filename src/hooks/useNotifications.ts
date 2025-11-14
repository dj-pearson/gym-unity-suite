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
  user_id?: string; // If null, notification is for all org staff
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string; // Where to navigate when clicked
  action_label?: string; // Label for action button
  metadata?: Record<string, any>; // Additional data (member_id, class_id, etc.)
  is_read: boolean;
  created_at: string;
  read_at?: string;
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

      // For now, return mock data since we haven't created the Supabase table yet
      // TODO: Replace with actual Supabase query once table is created
      const mockNotifications: Notification[] = [
        {
          id: '1',
          organization_id: organizationId,
          type: 'payment_failed',
          priority: 'high',
          title: 'Payment Failed',
          message: 'John Doe\'s payment of $99.00 failed',
          action_url: '/members?selected=member-123',
          action_label: 'View Member',
          metadata: { member_id: 'member-123', amount: 99.00 },
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '2',
          organization_id: organizationId,
          type: 'class_full',
          priority: 'medium',
          title: 'Class Full',
          message: 'Yoga - Morning Flow is now full (20/20)',
          action_url: '/classes?selected=class-456',
          action_label: 'View Class',
          metadata: { class_id: 'class-456', capacity: 20 },
          is_read: false,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        },
        {
          id: '3',
          organization_id: organizationId,
          type: 'member_inactive',
          priority: 'low',
          title: 'Member Inactive',
          message: 'Jane Smith hasn\'t checked in for 30 days',
          action_url: '/members?selected=member-789',
          action_label: 'Follow Up',
          metadata: { member_id: 'member-789', days_inactive: 30 },
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          organization_id: organizationId,
          type: 'membership_expiring',
          priority: 'medium',
          title: 'Membership Expiring Soon',
          message: '5 memberships expiring in the next 7 days',
          action_url: '/members?filter=expiring',
          action_label: 'View All',
          metadata: { count: 5 },
          is_read: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        },
        {
          id: '5',
          organization_id: organizationId,
          type: 'payment_past_due',
          priority: 'urgent',
          title: 'Payment Past Due',
          message: 'Mike Johnson has an overdue payment of $149.00',
          action_url: '/billing?member=member-321',
          action_label: 'Send Reminder',
          metadata: { member_id: 'member-321', amount: 149.00, days_overdue: 7 },
          is_read: false,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
      ];

      // Actual implementation would be:
      /*
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
      */

      return mockNotifications;
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
      // TODO: Implement actual Supabase update
      /*
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      */

      // Mock implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // TODO: Implement actual Supabase update
      /*
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('is_read', false);

      if (error) throw error;
      */

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
      // TODO: Implement actual Supabase delete
      /*
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      */

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
