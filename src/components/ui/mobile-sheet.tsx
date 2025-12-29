import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * MobileSheet - A responsive dialog/sheet component
 *
 * On mobile: Renders as a bottom sheet that slides up
 * On desktop: Renders as a centered dialog
 *
 * Provides a native-feeling experience on mobile devices with:
 * - Bottom sheet positioning
 * - Drag handle for visual affordance
 * - Touch-optimized padding and sizing
 * - Safe area inset support
 */

const MobileSheet = DialogPrimitive.Root

const MobileSheetTrigger = DialogPrimitive.Trigger

const MobileSheetClose = DialogPrimitive.Close

const MobileSheetPortal = DialogPrimitive.Portal

const MobileSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
MobileSheetOverlay.displayName = "MobileSheetOverlay"

export interface MobileSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Whether to show the drag handle on mobile */
  showDragHandle?: boolean
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Maximum height on mobile (percentage or px) */
  mobileMaxHeight?: string
}

const MobileSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MobileSheetContentProps
>(
  (
    {
      className,
      children,
      showDragHandle = true,
      showCloseButton = true,
      mobileMaxHeight = "85vh",
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()

    if (isMobile) {
      // Mobile: Bottom sheet
      return (
        <MobileSheetPortal>
          <MobileSheetOverlay />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 bg-background",
              "rounded-t-2xl shadow-lg",
              "flex flex-col",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "data-[state=closed]:duration-300 data-[state=open]:duration-300",
              "pb-safe", // Safe area support
              className
            )}
            style={{ maxHeight: mobileMaxHeight }}
            {...props}
          >
            {/* Drag handle */}
            {showDragHandle && (
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              {children}
            </div>

            {/* Close button */}
            {showCloseButton && (
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted/50">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Content>
        </MobileSheetPortal>
      )
    }

    // Desktop: Centered dialog
    return (
      <MobileSheetPortal>
        <MobileSheetOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
            "gap-4 border bg-background p-6 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "sm:rounded-lg",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </MobileSheetPortal>
    )
  }
)
MobileSheetContent.displayName = "MobileSheetContent"

const MobileSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
MobileSheetHeader.displayName = "MobileSheetHeader"

const MobileSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2",
      "pt-4 mt-auto",
      // On mobile, make buttons full-width and stacked
      "[&>button]:w-full sm:[&>button]:w-auto",
      className
    )}
    {...props}
  />
)
MobileSheetFooter.displayName = "MobileSheetFooter"

const MobileSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
MobileSheetTitle.displayName = "MobileSheetTitle"

const MobileSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
MobileSheetDescription.displayName = "MobileSheetDescription"

export {
  MobileSheet,
  MobileSheetTrigger,
  MobileSheetClose,
  MobileSheetPortal,
  MobileSheetOverlay,
  MobileSheetContent,
  MobileSheetHeader,
  MobileSheetFooter,
  MobileSheetTitle,
  MobileSheetDescription,
}
