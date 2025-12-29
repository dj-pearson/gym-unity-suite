import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent } from "./card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export interface Column<T> {
  /** Unique key for the column */
  key: string
  /** Header label */
  header: string
  /** Render function for cell content */
  render: (item: T, index: number) => React.ReactNode
  /** Priority for mobile display: 'primary' always shows, 'secondary' shows in expanded view */
  priority?: "primary" | "secondary"
  /** Custom className for this column */
  className?: string
  /** Whether this column should be hidden on mobile (defaults to false for primary, true for secondary) */
  hideOnMobile?: boolean
}

export interface ResponsiveTableProps<T> {
  /** Data to display */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Key extractor for each row */
  keyExtractor: (item: T, index: number) => string
  /** Optional className for the container */
  className?: string
  /** Empty state message */
  emptyMessage?: string
  /** Whether to show horizontal scroll indicator on mobile */
  showScrollHint?: boolean
  /** Mobile card title extractor */
  mobileTitle?: (item: T) => React.ReactNode
  /** Mobile card subtitle extractor */
  mobileSubtitle?: (item: T) => React.ReactNode
  /** Click handler for rows */
  onRowClick?: (item: T, index: number) => void
  /** Loading state */
  isLoading?: boolean
  /** Force card view even on desktop */
  forceCardView?: boolean
}

/**
 * ResponsiveTable - A mobile-optimized table component
 *
 * On desktop: Renders as a standard table with horizontal scroll
 * On mobile: Renders as cards with primary/secondary field organization
 */
export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = "No data available",
  showScrollHint = true,
  mobileTitle,
  mobileSubtitle,
  onRowClick,
  isLoading,
  forceCardView = false,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false)

  // Check if content overflows horizontally
  React.useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current
        setShowScrollIndicator(scrollWidth > clientWidth)
      }
    }
    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [data])

  // Get columns by priority
  const primaryColumns = columns.filter(
    (col) => col.priority === "primary" || (!col.priority && !col.hideOnMobile)
  )
  const secondaryColumns = columns.filter(
    (col) => col.priority === "secondary" || col.hideOnMobile
  )

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // Mobile Card View
  if (isMobile || forceCardView) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <Card
            key={keyExtractor(item, index)}
            className={cn(
              "transition-colors",
              onRowClick && "cursor-pointer active:bg-muted/50"
            )}
            onClick={() => onRowClick?.(item, index)}
          >
            <CardContent className="p-4">
              {/* Title/Subtitle from extractors */}
              {(mobileTitle || mobileSubtitle) && (
                <div className="mb-3 border-b border-border pb-3">
                  {mobileTitle && (
                    <div className="font-medium text-foreground">
                      {mobileTitle(item)}
                    </div>
                  )}
                  {mobileSubtitle && (
                    <div className="text-sm text-muted-foreground">
                      {mobileSubtitle(item)}
                    </div>
                  )}
                </div>
              )}

              {/* Primary fields - always visible */}
              <div className="grid gap-2">
                {primaryColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-muted-foreground shrink-0">
                      {col.header}
                    </span>
                    <span className={cn("text-sm text-right", col.className)}>
                      {col.render(item, index)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Secondary fields - shown below */}
              {secondaryColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="grid gap-2">
                    {secondaryColumns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="text-xs text-muted-foreground shrink-0">
                          {col.header}
                        </span>
                        <span className={cn("text-xs text-right", col.className)}>
                          {col.render(item, index)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop Table View with horizontal scroll
  return (
    <div className={cn("relative", className)}>
      {/* Scroll hint indicator */}
      {showScrollHint && showScrollIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-background to-transparent z-10" />
      )}

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={keyExtractor(item, index)}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * MobileTableCard - A simpler card wrapper for displaying single items on mobile
 */
export interface MobileTableCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function MobileTableCard({
  children,
  className,
  onClick,
}: MobileTableCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer active:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}

/**
 * MobileFieldRow - A row for displaying field label and value on mobile
 */
export interface MobileFieldRowProps {
  label: string
  value: React.ReactNode
  className?: string
  size?: "sm" | "default"
}

export function MobileFieldRow({
  label,
  value,
  className,
  size = "default",
}: MobileFieldRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span
        className={cn(
          "text-muted-foreground shrink-0",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {label}
      </span>
      <span className={cn("text-right", size === "sm" ? "text-xs" : "text-sm")}>
        {value}
      </span>
    </div>
  )
}

export default ResponsiveTable
