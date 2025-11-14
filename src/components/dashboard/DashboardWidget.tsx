import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, X } from 'lucide-react';
import { type WidgetConfig } from '@/lib/dashboardWidgets';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  onRemove?: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  className?: string;
}

/**
 * DashboardWidget - Base wrapper for all dashboard widgets
 *
 * Provides consistent styling, drag handle, and remove functionality
 */
export function DashboardWidget({
  widget,
  children,
  onRemove,
  isDragging,
  dragHandleProps,
  className = '',
}: DashboardWidgetProps) {
  const Icon = widget.icon;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        isDragging && 'opacity-50 scale-95',
        className
      )}
    >
      {/* Drag handle and actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <div
          {...dragHandleProps}
          className="p-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRemove && (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Remove Widget
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Widget header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base pr-16">
          {widget.gradient ? (
            <div
              className={cn(
                'p-1.5 rounded-lg mr-2',
                widget.gradient === 'primary' && 'bg-gradient-primary',
                widget.gradient === 'secondary' && 'bg-gradient-secondary',
                widget.gradient === 'success' && 'bg-gradient-success',
                widget.gradient === 'warning' && 'bg-gradient-warning',
                widget.gradient === 'info' && 'bg-gradient-info'
              )}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
          ) : (
            <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
          )}
          {widget.title}
        </CardTitle>
      </CardHeader>

      {/* Widget content */}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * WidgetPlaceholder - Shows when dragging or empty state
 */
export function WidgetPlaceholder({ text = 'Drop widget here' }: { text?: string }) {
  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
