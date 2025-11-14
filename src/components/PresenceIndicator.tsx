import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { type PresenceUser } from '@/hooks/usePresence';

interface PresenceIndicatorProps {
  viewers: PresenceUser[];
  className?: string;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PresenceIndicator - Shows avatars of users currently viewing a resource
 *
 * Displays up to maxVisible avatars, with a +N badge for additional viewers
 *
 * @param viewers - Array of users currently viewing the resource
 * @param className - Additional CSS classes
 * @param maxVisible - Maximum number of avatars to show (default: 3)
 * @param size - Avatar size (default: 'md')
 *
 * @example
 * ```tsx
 * const { viewers } = usePresence('member', memberId);
 *
 * <PresenceIndicator viewers={viewers} maxVisible={3} />
 * ```
 */
export function PresenceIndicator({
  viewers,
  className = '',
  maxVisible = 3,
  size = 'md',
}: PresenceIndicatorProps) {
  if (viewers.length === 0) return null;

  const visibleViewers = viewers.slice(0, maxVisible);
  const remainingCount = viewers.length - maxVisible;

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const avatarSize = sizeClasses[size];

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Eye icon indicator */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span className="text-xs">Viewing:</span>
        </div>

        {/* Avatar stack */}
        <div className="flex items-center -space-x-2">
          {visibleViewers.map((viewer) => (
            <Tooltip key={viewer.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={`${avatarSize} border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110`}
                    style={{ borderColor: viewer.color }}
                  >
                    <AvatarImage src={viewer.avatar_url} alt={viewer.name} />
                    <AvatarFallback
                      className="text-white font-medium"
                      style={{ backgroundColor: viewer.color }}
                    >
                      {getInitials(viewer.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Active indicator dot */}
                  <div
                    className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background"
                    style={{ backgroundColor: viewer.color }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs">
                  <p className="font-medium">{viewer.name}</p>
                  <p className="text-muted-foreground">{viewer.email}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Remaining count badge */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className={`${avatarSize} rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                >
                  +{remainingCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs space-y-1">
                  {viewers.slice(maxVisible).map((viewer) => (
                    <div key={viewer.id}>
                      <p className="font-medium">{viewer.name}</p>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version - just shows count without avatars
 */
export function PresenceCount({ viewers }: { viewers: PresenceUser[] }) {
  if (viewers.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 cursor-pointer">
            <Eye className="h-3 w-3" />
            <span className="text-xs">{viewers.length}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-1">
            {viewers.map((viewer) => (
              <div key={viewer.id}>
                <p className="font-medium">{viewer.name}</p>
                <p className="text-muted-foreground">{viewer.email}</p>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Full presence panel - shows list of viewers with details
 */
export function PresencePanel({ viewers }: { viewers: PresenceUser[] }) {
  if (viewers.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Eye className="h-3 w-3" />
        <span>Only you are viewing</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Eye className="h-3 w-3" />
        <span>{viewers.length} other{viewers.length !== 1 ? 's' : ''} viewing</span>
      </div>

      <div className="space-y-1">
        {viewers.map((viewer) => (
          <div
            key={viewer.id}
            className="flex items-center gap-2 p-2 rounded-md bg-accent/50"
          >
            <Avatar className="h-6 w-6 border-2" style={{ borderColor: viewer.color }}>
              <AvatarImage src={viewer.avatar_url} alt={viewer.name} />
              <AvatarFallback
                className="text-white text-[10px]"
                style={{ backgroundColor: viewer.color }}
              >
                {getInitials(viewer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{viewer.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {viewer.email}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
