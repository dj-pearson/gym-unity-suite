import { forwardRef, type ComponentProps } from "react"

import { cn } from "@/lib/utils"

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, type, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        type={type}
        aria-invalid={ariaInvalid}
        className={cn(
          // Base styles with mobile-first approach
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
          // Text size: 16px on mobile (prevents iOS zoom), 14px on desktop
          "text-base md:text-sm",
          // Ring and focus styles
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder and disabled states
          "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          // Touch-friendly tap highlight removal
          "[-webkit-tap-highlight-color:transparent]",
          // Error state styling - red border and subtle background tint
          ariaInvalid && "border-destructive bg-destructive/5 focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
