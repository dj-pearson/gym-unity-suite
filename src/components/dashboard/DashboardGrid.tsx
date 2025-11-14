import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type WidgetConfig, getWidgetGridColumns } from '@/lib/dashboardWidgets';
import { DashboardWidget, WidgetPlaceholder } from './DashboardWidget';
import { WidgetRenderer } from './WidgetRenderer';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus, Settings, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAvailableWidgetsForRole } from '@/lib/dashboardWidgets';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardGridProps {
  widgets: WidgetConfig[];
  stats?: any;
  onReorder: (widgets: WidgetConfig[]) => void;
  onRemove: (widgetId: string) => void;
  onAdd: (widgetType: string) => void;
  onReset: () => void;
}

/**
 * SortableWidget - Individual draggable widget
 */
function SortableWidget({
  widget,
  stats,
  onRemove,
}: {
  widget: WidgetConfig;
  stats?: any;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={getWidgetGridColumns(widget.size)}
    >
      <DashboardWidget
        widget={widget}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        <WidgetRenderer type={widget.type} stats={stats} />
      </DashboardWidget>
    </div>
  );
}

/**
 * DashboardGrid - Drag-and-drop dashboard with customizable widgets
 *
 * Allows users to:
 * - Drag and drop widgets to reorder
 * - Add new widgets from available options
 * - Remove widgets they don't need
 * - Reset to default layout
 */
export function DashboardGrid({
  widgets,
  stats,
  onReorder,
  onRemove,
  onAdd,
  onReset,
}: DashboardGridProps) {
  const { profile } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const newOrder = arrayMove(widgets, oldIndex, newIndex);
      onReorder(newOrder);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const availableWidgets = getAvailableWidgetsForRole(profile?.role || 'member');
  const enabledWidgetIds = new Set(widgets.map((w) => w.id));

  return (
    <div className="space-y-6">
      {/* Header with customize button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Customize Dashboard
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Customize Your Dashboard</SheetTitle>
                <SheetDescription>
                  Add or remove widgets to personalize your dashboard
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Reset button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    onReset();
                    setCustomizeOpen(false);
                  }}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>

                {/* Available widgets */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Available Widgets</h4>
                  {availableWidgets.map((widget) => {
                    const isEnabled = enabledWidgetIds.has(widget.id);

                    return (
                      <div
                        key={widget.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <widget.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <h5 className="font-medium text-sm">{widget.title}</h5>
                            {isEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          {widget.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {widget.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isEnabled ? 'outline' : 'default'}
                          onClick={() => {
                            if (isEnabled) {
                              onRemove(widget.id);
                            } else {
                              onAdd(widget.type);
                            }
                          }}
                          className="flex-shrink-0"
                        >
                          {isEnabled ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <p className="text-sm text-muted-foreground">
          Drag widgets to reorder
        </p>
      </div>

      {/* Widget grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-12">
          <WidgetPlaceholder text="No widgets added yet. Click 'Customize Dashboard' to add widgets." />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-6">
              {widgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  stats={stats}
                  onRemove={() => onRemove(widget.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
