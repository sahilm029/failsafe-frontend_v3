"use client";

import { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MetricPoint } from "@/lib/types";
import { METRIC_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MetricsChartProps {
  data: MetricPoint[];
  metrics: Array<keyof Omit<MetricPoint, "timestamp">>;
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showLegend?: boolean;
  className?: string;
}

export const MetricsChart = memo(function MetricsChart({
  data,
  metrics,
  height = 200,
  showGrid = true,
  showAxes = true,
  showLegend = false,
  className,
}: MetricsChartProps) {
  const formatTimestamp = (value: unknown) => {
    const timestamp = typeof value === "number" ? value : 0;
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getMetricColor = (metric: string): string => {
    const colorMap: Record<string, string> = {
      latency: METRIC_COLORS.latency,
      errorRate: METRIC_COLORS.errors,
      throughput: METRIC_COLORS.throughput,
      cpu: METRIC_COLORS.cpu,
      memory: METRIC_COLORS.memory,
    };
    return colorMap[metric] || "#14B8A6";
  };

  const getMetricLabel = (metric: string): string => {
    const labelMap: Record<string, string> = {
      latency: "Latency (ms)",
      errorRate: "Error Rate (%)",
      throughput: "Throughput (req/s)",
      cpu: "CPU (%)",
      memory: "Memory (%)",
    };
    return labelMap[metric] || metric;
  };

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface rounded border border-border",
          className
        )}
        style={{ height }}
      >
        <p className="text-text-muted text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          )}
          {showAxes && (
            <>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke="#6B7280"
                style={{ fontSize: "10px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "10px" }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A212B",
              border: "1px solid #1F2937",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            labelFormatter={formatTimestamp}
            labelStyle={{ color: "#E5E7EB" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              iconType="line"
            />
          )}
          {metrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={getMetricColor(metric)}
              strokeWidth={2}
              dot={false}
              name={getMetricLabel(metric)}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
