import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * Toaster Component
 *
 * Accessible toast notification container.
 * Uses ARIA live regions to announce notifications to screen readers.
 * WCAG 2.1 Level A - Success Criterion 4.1.3 (Status Messages)
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {/* ARIA live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {toasts.map(({ id, title, description, variant }) => (
          <div key={`announce-${id}`}>
            {variant === 'destructive' ? 'Error: ' : ''}
            {title}
            {description && `: ${description}`}
          </div>
        ))}
      </div>

      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            role={props.variant === 'destructive' ? 'alert' : 'status'}
            aria-live={props.variant === 'destructive' ? 'assertive' : 'polite'}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
