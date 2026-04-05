import { memo } from "react";
import type { TestStatus } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TestStatus;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || { bg: "bg-surface text-text-secondary", text: "text-text-secondary", dot: "bg-text-muted" };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {showDot && (
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            colors.dot,
            status === "running" && "animate-pulse"
          )}
        />
      )}
      <span className="capitalize">{status}</span>
    </div>
  );
});
