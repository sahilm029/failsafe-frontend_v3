import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "card" | "table" | "circular";
}

export function LoadingSkeleton({
  className,
  variant = "text",
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-card";

  const variantClasses = {
    text: "h-4 rounded",
    card: "h-32 rounded-lg",
    table: "h-12 rounded",
    circular: "rounded-full aspect-square",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-label="Loading"
    />
  );
}

// Skeleton card layout
export function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <LoadingSkeleton className="w-24 mb-3" />
      <LoadingSkeleton className="w-32 h-8 mb-2" />
      <LoadingSkeleton className="w-16" />
    </div>
  );
}

// Skeleton table rows
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 bg-card rounded p-3 border border-border"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton
              key={colIndex}
              className={cn(
                "h-4",
                colIndex === 0 ? "w-32" : "w-24"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton list
interface SkeletonListProps {
  items?: number;
}

export function SkeletonList({ items = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <LoadingSkeleton variant="circular" className="w-8 h-8" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="w-3/4 h-4" />
            <LoadingSkeleton className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
