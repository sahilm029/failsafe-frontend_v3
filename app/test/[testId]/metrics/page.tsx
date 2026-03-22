"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTestMetrics } from "@/lib/api";
import type { MetricPoint, MetricsParams } from "@/lib/types";
import { METRIC_COLORS, TIME_WINDOWS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";

type MetricType = "latency" | "errorRate" | "throughput" | "cpu" | "memory" | "all";

export default function MetricsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = use(params);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("all");
  const [timeWindow, setTimeWindow] = useState<MetricsParams["window"]>("1h");
  const [compareTestId, setCompareTestId] = useState<string | null>(null);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["metrics", testId, timeWindow, selectedMetric],
    queryFn: () =>
      getTestMetrics(testId, {
        window: timeWindow,
        type: selectedMetric === "all" ? undefined : selectedMetric,
      }),
  });

  const { data: compareMetrics } = useQuery({
    queryKey: ["metrics", compareTestId, timeWindow, selectedMetric],
    queryFn: () =>
      getTestMetrics(compareTestId!, {
        window: timeWindow,
        type: selectedMetric === "all" ? undefined : selectedMetric,
      }),
    enabled: !!compareTestId,
  });

  // Calculate stats from metrics
  const calculateStats = (data: MetricPoint[], key: keyof MetricPoint) => {
    const values = data.map((d) => d[key]).filter((v): v is number => typeof v === "number");
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    };
  };

  const formatTimestamp = (value: unknown) => {
    const timestamp = typeof value === "number" ? value : 0;
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getMetricsToShow = (): Array<keyof Omit<MetricPoint, "timestamp">> => {
    if (selectedMetric === "all") {
      return ["latency", "errorRate", "throughput", "cpu", "memory"];
    }
    return [selectedMetric as keyof Omit<MetricPoint, "timestamp">];
  };

  const metricsToShow = getMetricsToShow();
  const statsMetric = selectedMetric === "all" ? "latency" : selectedMetric;
  const stats = metrics ? calculateStats(metrics, statsMetric as keyof MetricPoint) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Metrics</h1>
      </div>

      {/* Metric Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "latency", "errorRate", "throughput", "cpu", "memory"] as MetricType[]).map(
          (metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              {metric === "errorRate" ? "Error Rate" : metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Time Window */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Time window:</span>
        {TIME_WINDOWS.filter((w) => w.value !== "custom").map((window) => (
          <button
            key={window.value}
            onClick={() => setTimeWindow(window.value)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              timeWindow === window.value
                ? "bg-secondary/20 text-secondary"
                : "bg-surface text-text-secondary hover:text-text-primary"
            }`}
          >
            {window.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-lg border border-border p-6">
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-text-muted">Loading metrics...</div>
          </div>
        ) : !metrics || metrics.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-text-muted">No metrics data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metrics} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
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
              <Brush
                dataKey="timestamp"
                height={30}
                stroke="#14B8A6"
                fill="#11161C"
                tickFormatter={formatTimestamp}
              />
              {metricsToShow.map((metric) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={METRIC_COLORS[metric as keyof typeof METRIC_COLORS] || "#14B8A6"}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
              {/* Comparison line */}
              {compareMetrics && metricsToShow.length === 1 && (
                <Line
                  data={compareMetrics}
                  type="monotone"
                  dataKey={metricsToShow[0]}
                  stroke={METRIC_COLORS[metricsToShow[0] as keyof typeof METRIC_COLORS] || "#14B8A6"}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                  opacity={0.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Min", value: stats.min },
            { label: "Max", value: stats.max },
            { label: "Avg", value: stats.avg },
            { label: "P95", value: stats.p95 },
            { label: "P99", value: stats.p99 },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-lg font-semibold text-text-primary">
                {stat.value.toFixed(2)}
                {statsMetric === "latency" && "ms"}
                {(statsMetric === "errorRate" || statsMetric === "cpu" || statsMetric === "memory") && "%"}
                {statsMetric === "throughput" && "req/s"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Compare Toggle */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={!!compareTestId}
            onChange={(e) => setCompareTestId(e.target.checked ? "baseline" : null)}
            className="rounded border-border"
          />
          Compare with baseline
        </label>
      </div>
    </div>
  );
}
