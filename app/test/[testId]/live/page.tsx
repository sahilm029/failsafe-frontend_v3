"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "@/lib/store";
import { getWebSocketClient } from "@/lib/websocket";
import type { WSEvent, Test, LogEntry, MetricPoint, LogLevel } from "@/lib/types";
import { METRIC_COLORS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PlayIcon,
  StopIcon,
  ReloadIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

// Constants
const MAX_EVENTS = 100;
const MAX_LOGS = 500;
const MAX_METRICS = 60;
const LOG_ROW_HEIGHT = 32;

// Color constants
const COLORS = {
  teal: "#14B8A6",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#38BDF8",
  gray: "#6B7280",
};

// Connection state indicator
function ConnectionIndicator({ state }: { state: string }) {
  const getColor = () => {
    switch (state) {
      case "connected":
        return COLORS.teal;
      case "connecting":
        return COLORS.amber;
      case "error":
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${state === "connecting" ? "animate-pulse" : ""}`}
        style={{ backgroundColor: getColor() }}
      />
      <span className="text-xs text-text-muted capitalize">{state}</span>
    </div>
  );
}

export default function LiveTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = use(params);
  const { wsConnectionState, setWsConnectionState } = useStore();

  // State
  const [test, setTest] = useState<Test | null>(null);
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [duration, setDuration] = useState(0);
  const [faultInfo, setFaultInfo] = useState<{ type: string; remaining: number } | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Log filters
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [levelFilters, setLevelFilters] = useState<Set<LogLevel>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);

  // Duration counter
  useEffect(() => {
    if (test?.status !== "running" || !test.startTime) return;

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - test.startTime!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [test?.status, test?.startTime]);

  // WebSocket connection
  useEffect(() => {
    const wsClient = getWebSocketClient(`/ws/test/${testId}`);

    const unsubscribeState = wsClient.onConnectionStateChange((state) => {
      setWsConnectionState(state);
      if (state === "connected") {
        toast.success("Stream reconnected", { duration: 2000 });
        setReconnectAttempts(0);
      } else if (state === "error") {
        setReconnectAttempts((prev) => prev + 1);
      }
    });

    const handleTestEvent = (event: WSEvent) => {
      // Add to events timeline
      setEvents((prev) => {
        const updated = [...prev, event].slice(-MAX_EVENTS);
        return updated;
      });

      // Handle specific events
      if (event.type === "TEST_STARTED" && event.payload.test) {
        setTest(event.payload.test as Test);
      }
      if (event.type === "TEST_STOPPED") {
        setTest((prev) => (prev ? { ...prev, status: "completed" } : null));
      }
      if (event.type === "STATE_CHANGE" && event.payload.status) {
        setTest((prev) =>
          prev ? { ...prev, status: event.payload.status as Test["status"] } : null
        );
      }
      if (event.type === "FAULT_INJECTED") {
        setFaultInfo({
          type: (event.payload.faultType as string) || "unknown",
          remaining: (event.payload.remainingDuration as number) || 0,
        });
      }
    };

    const handleMetricEvent = (event: WSEvent) => {
      const { latency, errorRate, throughput, cpu, memory, timestamp } = event.payload as Record<string, unknown>;
      setMetrics((prev) => {
        const newPoint: MetricPoint = {
          timestamp: (timestamp as number) || Date.now(),
          latency: latency as number,
          errorRate: errorRate as number,
          throughput: throughput as number,
          cpu: cpu as number,
          memory: memory as number,
        };
        return [...prev, newPoint].slice(-MAX_METRICS);
      });
    };

    const handleLogEvent = (event: WSEvent) => {
      const { id, timestamp, level, service, message } = event.payload as Record<string, unknown>;
      setLogs((prev) => {
        const newLog: LogEntry = {
          id: (id as string) || `log-${Date.now()}`,
          timestamp: (timestamp as number) || Date.now(),
          level: (level as LogLevel) || "info",
          service: (service as string) || "unknown",
          message: (message as string) || "",
        };
        return [...prev, newLog].slice(-MAX_LOGS);
      });
    };

    const unsubscribeEvents = [
      wsClient.on("TEST_STARTED", handleTestEvent),
      wsClient.on("TEST_STOPPED", handleTestEvent),
      wsClient.on("FAULT_INJECTED", handleTestEvent),
      wsClient.on("ERROR_EVENT", handleTestEvent),
      wsClient.on("STATE_CHANGE", handleTestEvent),
      wsClient.on("METRIC_UPDATE", handleMetricEvent),
      wsClient.on("LOG", handleLogEvent),
    ];

    wsClient.connect();

    return () => {
      unsubscribeState();
      unsubscribeEvents.forEach((unsub) => unsub());
      wsClient.disconnect();
    };
  }, [testId, setWsConnectionState]);

  // Mock data for demo
  useEffect(() => {
    if (!test) {
      setTest({
        id: testId,
        name: "API Latency Test",
        status: "idle",
        target: "backend",
        fault: "latency",
        parameters: { value: "3000ms", duration: "60s" },
        projectId: "demo",
        createdAt: Date.now(),
      });
    }
  }, [testId, test]);

  // Action handlers
  const handleStart = async () => {
    try {
      // POST /api/tests/:id/start
      toast.success("Test started");
      setTest((prev) => (prev ? { ...prev, status: "running", startTime: Date.now() } : null));
    } catch {
      toast.error("Failed to start test");
    }
  };

  const handleStop = async () => {
    try {
      // POST /api/tests/:id/stop
      toast.success("Test stopped");
      setTest((prev) => (prev ? { ...prev, status: "completed" } : null));
    } catch {
      toast.error("Failed to stop test");
    }
  };

  const handleRestart = async () => {
    try {
      // POST /api/tests/:id/restart
      toast.success("Test restarted");
      setTest((prev) => (prev ? { ...prev, status: "running", startTime: Date.now() } : null));
      setEvents([]);
      setLogs([]);
      setMetrics([]);
      setDuration(0);
    } catch {
      toast.error("Failed to restart test");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get unique services from logs
  const uniqueServices = Array.from(new Set(logs.map((l) => l.service)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (serviceFilter && log.service !== serviceFilter) return false;
    if (levelFilters.size > 0 && !levelFilters.has(log.level)) return false;
    return true;
  });

  // Toggle level filter
  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Disconnect banner
  const getBanner = () => {
    if (wsConnectionState === "connected") return null;

    if (reconnectAttempts >= 5) {
      return (
        <div className="bg-danger/10 border-b border-danger/20 px-4 py-2 text-sm text-danger flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4" />
          Stream unavailable. Refresh to retry.
        </div>
      );
    }

    if (wsConnectionState === "connecting") {
      return (
        <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-sm text-warning flex items-center gap-2">
          <ReloadIcon className="w-4 h-4 animate-spin" />
          Connecting to live stream...
        </div>
      );
    }

    return (
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-sm text-warning flex items-center gap-2">
        <ExclamationTriangleIcon className="w-4 h-4" />
        Stream disconnected — reconnecting...
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Disconnect Banner */}
      {getBanner()}

      {/* Top Control Bar */}
      <div className="px-4 md:px-6 py-4 border-b border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Test Info */}
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {test?.name || "Loading..."}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {test && (
                <>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary/20 text-secondary">
                    {test.target}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                    {test.fault}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status Badge with pulsing dot */}
          {test && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface">
              <span
                className={`w-2 h-2 rounded-full ${test.status === "running" ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor:
                    test.status === "running"
                      ? COLORS.teal
                      : test.status === "completed"
                        ? COLORS.green
                        : test.status === "failed"
                          ? COLORS.red
                          : COLORS.gray,
                }}
              />
              <span className="text-sm text-text-primary capitalize">{test.status}</span>
            </div>
          )}

          {/* Connection Indicator */}
          <ConnectionIndicator state={wsConnectionState} />
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-6">
          {/* Duration */}
          <div className="text-right">
            <p className="text-xs text-text-muted">Duration</p>
            <p className="text-lg font-mono text-text-primary">{formatDuration(duration)}</p>
          </div>

          {/* Current Fault Info */}
          {faultInfo && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Current Fault</p>
              <p className="text-sm text-warning">
                {faultInfo.type} | Remaining: {faultInfo.remaining}s
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleStart}
              disabled={test?.status === "running"}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded transition-colors disabled:opacity-50"
            >
              <PlayIcon className="w-4 h-4" />
              Start
            </button>
            <button
              onClick={handleStop}
              disabled={test?.status !== "running"}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded transition-colors disabled:opacity-50"
            >
              <StopIcon className="w-4 h-4" />
              Stop
            </button>
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface/80 text-text-primary rounded border border-border transition-colors"
            >
              <ReloadIcon className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-y-hidden">
        {/* LEFT: Event Timeline (35%) */}
        <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-border flex flex-col min-h-[300px] md:min-h-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Event Timeline</h2>
          </div>
          <EventTimeline events={events} />
        </div>

        {/* CENTER: Metrics (40%) */}
        <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-border flex flex-col min-h-[400px] md:min-h-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Live Metrics</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <MetricChart
              label="Latency"
              value={metrics[metrics.length - 1]?.latency}
              unit="ms"
              data={metrics}
              dataKey="latency"
              color={METRIC_COLORS.latency}
            />
            <MetricChart
              label="Error Rate"
              value={metrics[metrics.length - 1]?.errorRate}
              unit="%"
              data={metrics}
              dataKey="errorRate"
              color={METRIC_COLORS.errors}
            />
            <MetricChart
              label="Throughput"
              value={metrics[metrics.length - 1]?.throughput}
              unit="req/s"
              data={metrics}
              dataKey="throughput"
              color={METRIC_COLORS.throughput}
            />
            <MetricChartDual
              label="CPU / Memory"
              cpuValue={metrics[metrics.length - 1]?.cpu}
              memValue={metrics[metrics.length - 1]?.memory}
              data={metrics}
            />
          </div>
        </div>

        {/* RIGHT: Live Logs (25%) */}
        <div className="w-full md:w-[25%] flex flex-col min-h-[400px] md:min-h-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Live Log Stream</h2>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1.5 rounded transition-colors ${autoScroll ? "text-primary" : "text-text-muted"}`}
                title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
              >
                {autoScroll ? (
                  <LockClosedIcon className="w-4 h-4" />
                ) : (
                  <LockOpen1Icon className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <select
                value={serviceFilter || ""}
                onChange={(e) => setServiceFilter(e.target.value || null)}
                className="px-2 py-1 bg-surface border border-border rounded text-xs text-text-primary"
              >
                <option value="">All Services</option>
                {uniqueServices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {(["error", "warn", "info", "debug"] as LogLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevelFilter(level)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    levelFilters.has(level)
                      ? level === "error"
                        ? "bg-danger text-white"
                        : level === "warn"
                          ? "bg-warning text-white"
                          : level === "info"
                            ? "bg-info text-white"
                            : "bg-text-muted text-white"
                      : "bg-surface text-text-muted"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <VirtualizedLogList logs={filteredLogs} autoScroll={autoScroll} />
        </div>
      </div>

      {/* Footer Links */}
      <div className="px-4 sm:px-6 py-3 border-t border-border bg-card flex flex-col sm:flex-row gap-4">
        <Link
          href={`/test/${testId}/logs`}
          className="text-sm text-primary hover:text-primary-hover"
        >
          Full Logs →
        </Link>
        <Link
          href={`/test/${testId}/metrics`}
          className="text-sm text-primary hover:text-primary-hover"
        >
          Full Metrics →
        </Link>
      </div>
    </div>
  );
}

// Event Timeline Component
function EventTimeline({ events }: { events: WSEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventConfig = (type: string) => {
    switch (type) {
      case "TEST_STARTED":
        return { color: COLORS.teal, label: "Test Started" };
      case "FAULT_INJECTED":
        return { color: COLORS.amber, label: "Fault Injected" };
      case "ERROR_EVENT":
        return { color: COLORS.red, label: "Error Detected" };
      case "METRIC_UPDATE":
        return { color: COLORS.gray, label: "Metrics Updated" };
      case "TEST_STOPPED":
        return { color: COLORS.gray, label: "Test Stopped" };
      case "STATE_CHANGE":
        return { color: COLORS.blue, label: "State Changed" };
      default:
        return { color: COLORS.gray, label: type };
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-text-muted/50 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-text-muted">Waiting for events...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {events.map((event, index) => {
          const config = getEventConfig(event.type);
          const service =
            typeof event.payload.service === "string" ? event.payload.service : "";

          return (
            <div
              key={`${event.timestamp}-${index}`}
              className="flex items-center gap-3 py-1.5"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-sm text-text-primary flex-1 truncate">
                {config.label}
              </span>
              {service && (
                <span className="text-xs text-text-muted">{service}</span>
              )}
              <span className="text-xs text-text-muted font-mono">
                {formatTime(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Metric Chart Component
function MetricChart({
  label,
  value,
  unit,
  data,
  dataKey,
  color,
}: {
  label: string;
  value?: number;
  unit: string;
  data: MetricPoint[];
  dataKey: keyof MetricPoint;
  color: string;
}) {
  return (
    <div className="bg-surface rounded border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-lg font-semibold" style={{ color }}>
          {value !== undefined ? value.toFixed(1) : "—"}
          <span className="text-xs text-text-muted ml-1">{unit}</span>
        </span>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="timestamp" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A212B",
                border: "1px solid #2D3748",
                borderRadius: "4px",
              }}
              labelFormatter={(ts) =>
                new Date(ts as number).toLocaleTimeString()
              }
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Dual Metric Chart (CPU + Memory)
function MetricChartDual({
  label,
  cpuValue,
  memValue,
  data,
}: {
  label: string;
  cpuValue?: number;
  memValue?: number;
  data: MetricPoint[];
}) {
  return (
    <div className="bg-surface rounded border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">{label}</span>
        <div className="flex gap-4">
          <span className="text-sm font-semibold" style={{ color: METRIC_COLORS.cpu }}>
            CPU: {cpuValue !== undefined ? cpuValue.toFixed(0) : "—"}%
          </span>
          <span className="text-sm font-semibold" style={{ color: METRIC_COLORS.memory }}>
            Mem: {memValue !== undefined ? memValue.toFixed(0) : "—"}%
          </span>
        </div>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="timestamp" hide />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A212B",
                border: "1px solid #2D3748",
                borderRadius: "4px",
              }}
              labelFormatter={(ts) =>
                new Date(ts as number).toLocaleTimeString()
              }
            />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke={METRIC_COLORS.cpu}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke={METRIC_COLORS.memory}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Virtualized Log List Component
function VirtualizedLogList({
  logs,
  autoScroll,
}: {
  logs: LogEntry[];
  autoScroll: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LOG_ROW_HEIGHT,
    overscan: 10,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logs.length > 0 && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "bg-danger";
      case "warn":
        return "bg-warning";
      case "info":
        return "bg-info";
      default:
        return "bg-text-muted";
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-muted">No logs yet</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const log = logs[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${LOG_ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center gap-2 px-3 text-xs font-mono border-b border-border/50"
            >
              <span className="text-text-muted w-16 flex-shrink-0">
                {formatTime(log.timestamp)}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-white text-[10px] uppercase ${getLevelColor(log.level)}`}
              >
                {log.level}
              </span>
              <span className="text-text-secondary w-20 truncate flex-shrink-0">
                {log.service}
              </span>
              <span className="text-text-primary truncate flex-1">
                {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
