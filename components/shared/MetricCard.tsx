"use client";

import { memo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaType?: "up" | "down" | "neutral";
  sparklineData?: Array<{ value: number }>;
  color?: string;
  borderColor?: string;
  icon?: LucideIcon;
  showDot?: boolean;
  className?: string;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaType = "neutral",
  sparklineData,
  color = "#14B8A6",
  borderColor,
  icon: Icon,
  showDot = false,
  className,
}: MetricCardProps) {
  // Determine if delta is good or bad based on metric type
  const getDeltaColor = () => {
    if (deltaType === "neutral" || delta === undefined) return "text-text-muted";

    // For most metrics, up is bad (latency, errors, CPU, memory)
    // down is good
    const isGood = deltaType === "down";
    return isGood ? "text-success" : "text-danger";
  };

  return (
    <div
      className={cn(
        "bg-card rounded-lg p-4 border border-border relative overflow-hidden",
        className
      )}
      style={{
        borderLeftWidth: borderColor ? "3px" : undefined,
        borderLeftColor: borderColor,
      }}
    >
      {/* Icon in top-right */}
      {Icon && (
        <div className="absolute top-4 right-4">
          <Icon
            size={16}
            style={{ color, opacity: 0.7 }}
          />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-text-secondary mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            {showDot && (
              <span
                className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
            <span
              className="text-2xl font-semibold"
              style={{ color }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm text-text-muted">{unit}</span>
            )}
          </div>
          {delta !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs", getDeltaColor())}>
              {deltaType === "up" && <ArrowUpIcon className="w-3 h-3" />}
              {deltaType === "down" && <ArrowDownIcon className="w-3 h-3" />}
              <span>
                {Math.abs(delta)}% {deltaType === "neutral" ? "change" : ""}
              </span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});
