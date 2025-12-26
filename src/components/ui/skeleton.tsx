import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Text skeleton with multiple lines
 */
function SkeletonText({
  lines = 3,
  className
}: {
  lines?: number;
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton with header and content
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

/**
 * Avatar skeleton - circular placeholder
 */
function SkeletonAvatar({
  size = "md"
}: {
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  }
  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />
}

/**
 * Button skeleton placeholder
 */
function SkeletonButton({
  size = "default"
}: {
  size?: "sm" | "default" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32"
  }
  return <Skeleton className={cn("rounded-md", sizeClasses[size])} />
}

/**
 * Table row skeleton
 */
function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-12" : "flex-1"
          )}
        />
      ))}
    </div>
  )
}

/**
 * Generic page loader with centered spinner
 */
function PageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-t-primary animate-spin" />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Dashboard page skeleton for consistent loading UX
 */
function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <SkeletonButton />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={4} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Blog page skeleton optimized for SEO - shows page structure immediately
 */
function BlogPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero header skeleton - maintains page structure */}
      <header className="bg-gradient-primary text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton className="h-12 w-2/3 mx-auto mb-4 bg-white/20" />
          <Skeleton className="h-6 w-3/4 mx-auto bg-white/20" />
        </div>
      </header>

      {/* Grid skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="rounded-lg border bg-card overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <SkeletonText lines={2} />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Blog article skeleton for individual post pages
 */
function BlogArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Article header */}
      <header className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-4 w-20 mb-4 bg-white/20" />
          <Skeleton className="h-12 w-full mb-4 bg-white/20" />
          <Skeleton className="h-12 w-3/4 mb-6 bg-white/20" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-4 w-24 bg-white/20" />
          </div>
        </div>
      </header>

      {/* Article content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-80 w-full mb-8 rounded-lg" />
        <div className="space-y-6">
          <SkeletonText lines={4} />
          <Skeleton className="h-6 w-1/2" />
          <SkeletonText lines={5} />
          <Skeleton className="h-6 w-2/3" />
          <SkeletonText lines={4} />
        </div>
      </article>
    </div>
  )
}

/**
 * List skeleton with items
 */
function ListSkeleton({
  items = 5,
  showAvatar = true,
  className
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          {showAvatar && <SkeletonAvatar size="lg" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonTableRow,
  PageLoader,
  DashboardPageSkeleton,
  BlogPageSkeleton,
  BlogArticleSkeleton,
  ListSkeleton
}
