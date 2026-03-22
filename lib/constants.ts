import type { TestStatus, TargetType, FaultType, LogLevel } from "./types";

// Status badge colors
export const STATUS_COLORS: Record<TestStatus, { bg: string; text: string; dot?: string }> = {
  running: { bg: "bg-primary", text: "text-primary-foreground", dot: "bg-primary" },
  completed: { bg: "bg-success", text: "text-white", dot: "bg-success" },
  failed: { bg: "bg-danger", text: "text-white", dot: "bg-danger" },
  queued: { bg: "bg-warning", text: "text-white", dot: "bg-warning" },
  idle: { bg: "bg-text-muted", text: "text-white", dot: "bg-text-muted" },
};

// Log level colors
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  error: "text-danger",
  warn: "text-warning",
  info: "text-info",
  debug: "text-text-muted",
};

export const LOG_LEVEL_BG: Record<LogLevel, string> = {
  error: "bg-danger/10 border-danger",
  warn: "bg-warning/10 border-warning",
  info: "bg-info/10 border-info",
  debug: "bg-text-muted/10 border-text-muted",
};

// Metric colors (from design system)
export const METRIC_COLORS = {
  latency: "#0EA5E9",
  errors: "#EF4444",
  throughput: "#22C55E",
  cpu: "#F59E0B",
  memory: "#14B8A6",
} as const;

// Target type badges
export const TARGET_LABELS: Record<TargetType, string> = {
  backend: "Backend",
  frontend: "Frontend",
  android: "Android",
};

// Fault type labels
export const FAULT_LABELS: Record<FaultType, string> = {
  latency: "Latency",
  cpu: "CPU",
  memory: "Memory",
  network: "Network",
  ui: "UI",
  android: "Android",
};

// Fault types by target
export const FAULT_TYPES_BY_TARGET: Record<TargetType, FaultType[]> = {
  backend: ["latency", "cpu", "memory", "network"],
  frontend: ["latency", "ui"],
  android: ["cpu", "memory", "android"],
};

// Time windows for metrics
export const TIME_WINDOWS = [
  { label: "5m", value: "5m" as const },
  { label: "15m", value: "15m" as const },
  { label: "1h", value: "1h" as const },
  { label: "6h", value: "6h" as const },
  { label: "24h", value: "24h" as const },
  { label: "Custom", value: "custom" as const },
];

// WebSocket event icons (using Radix icons, will be mapped in components)
export const WS_EVENT_COLORS = {
  TEST_STARTED: "#14B8A6", // teal
  FAULT_INJECTED: "#F59E0B", // amber
  ERROR_EVENT: "#EF4444", // red
  TEST_STOPPED: "#6B7280", // gray
  METRIC_UPDATE: "#0EA5E9", // blue
  LOG: "#38BDF8", // sky
  STATE_CHANGE: "#14B8A6", // teal
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const LOGS_PAGE_SIZE = 100;
export const MAX_LOG_ENTRIES_IN_MEMORY = 500;

// Debounce delays
export const SEARCH_DEBOUNCE_MS = 300;
export const FILTER_DEBOUNCE_MS = 300;

// Connection status
export const CONNECTION_STATE_LABELS = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
} as const;

// System health thresholds
export const LATENCY_THRESHOLDS = {
  good: 200, // ms
  warning: 500, // ms
  // above 500 is critical
} as const;
