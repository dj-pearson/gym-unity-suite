import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Wrench,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotifications,
  useUnreadCount,
  useNotificationMutations,
  type Notification,
  type NotificationType,
  type NotificationPriority,
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  payment_failed: DollarSign,
  payment_past_due: AlertCircle,
  class_full: Calendar,
  member_inactive: Users,
  membership_expiring: Users,
  equipment_maintenance: Wrench,
  staff_certification_expiring: Award,
  general: Bell,
};

// Color mapping for priority levels
const priorityColors: Record<NotificationPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(
    profile?.organization_id,
    profile?.id
  );
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationMutations(
    profile?.organization_id
  );

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      onOpenChange(false);
      navigate(notification.action_url);
    }
  };

  const handleActionClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();

    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to action URL
    if (notification.action_url) {
      onOpenChange(false);
      navigate(notification.action_url);
    }
  };

  const handleDeleteClick = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  // Sort by priority (urgent > high > medium > low) and then by date
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadNotifications = sortedNotifications.filter(n => !n.is_read);
  const readNotifications = sortedNotifications.filter(n => n.is_read);

  return (
    <PopoverContent className="w-96 p-0" align="end">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Badge variant="default" className="ml-1">
              {unreadNotifications.length}
            </Badge>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onActionClick={(e) => handleActionClick(notification, e)}
                    onDeleteClick={(e) => handleDeleteClick(notification.id, e)}
                  />
                ))}
              </div>
            )}

            {/* Read Notifications */}
            {readNotifications.length > 0 && (
              <div className="opacity-60">
                {unreadNotifications.length > 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    Earlier
                  </div>
                )}
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onActionClick={(e) => handleActionClick(notification, e)}
                    onDeleteClick={(e) => handleDeleteClick(notification.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </PopoverContent>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onActionClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

function NotificationItem({
  notification,
  onClick,
  onActionClick,
  onDeleteClick,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type];
  const priorityColor = priorityColors[notification.priority];

  return (
    <div
      className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-accent/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${priorityColor}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">
              {notification.title}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteClick}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground leading-tight">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </span>

            {notification.action_label && (
              <Button
                variant="outline"
                size="sm"
                onClick={onActionClick}
                className="h-7 text-xs"
              >
                {notification.action_label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Badge - Shows unread count
 */
interface NotificationBadgeProps {
  organizationId: string | undefined;
  userId?: string;
}

export function NotificationBadge({ organizationId, userId }: NotificationBadgeProps) {
  const unreadCount = useUnreadCount(organizationId, userId);

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-[10px]"
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}
