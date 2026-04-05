/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// Core status and type enums
export type TestStatus = "running" | "failed" | "completed" | "queued" | "idle" | "stopped";
export type TargetType = "backend" | "frontend" | "android";
export type FaultType = "latency" | "cpu" | "memory" | "network" | "ui" | "android" | "kill" | "kill_app" | "network_disable" | "network_enable" | "network_flaky" | "network_latency" | "network_packet_loss" | "revoke_camera" | "revoke_storage" | "revoke_location" | "background_app" | "foreground_app" | "clear_data" | "network_delay" | "packet_loss" | "cpu_stress" | "memory_stress";
export type LogLevel = "debug" | "info" | "warn" | "error";

// Test entity
export interface Test {
  id: string;
  backendId?: string;
  name: string;
  status: TestStatus;
  target: TargetType;
  fault: FaultType;
  parameters: {
    value?: string;
    duration?: string;
    intensity?: string;
  };
  projectId: string;
  createdAt: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// Project and environment entities
export interface Project {
  id: string;
  name: string;
  description: string;
  environments: Environment[];
  lastRun?: number;
  failureRate?: number;
  environmentCount?: number;
  lastRunAt?: string;
  healthStatus?: "healthy" | "degraded" | "failing";
}

export interface Environment {
  id: string;
  name: string;
  type: TargetType;
  services: {
    backendUrl?: string;
    frontendUrl?: string;
    deviceId?: string;
  };
}

// Log entry
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Metrics
export interface MetricPoint {
  timestamp: number;
  latency?: number;
  errorRate?: number;
  throughput?: number;
  cpu?: number;
  memory?: number;
}

// WebSocket events
export type WSEventType =
  | "TEST_STARTED"
  | "TEST_STOPPED"
  | "FAULT_INJECTED"
  | "METRIC_UPDATE"
  | "LOG"
  | "STATE_CHANGE"
  | "ERROR_EVENT";

export interface WSEvent {
  type: WSEventType;
  timestamp: number;
  payload: Record<string, any>;
}

// Dashboard stats
export interface DashboardStats {
  activeTests: number;
  failedLast24h: number;
  avgLatency: number;
  systemHealth: "Healthy" | "Degraded" | "Critical";
}

// Test result
export interface TestResult {
  id: string;
  testId: string;
  testName: string;
  target: TargetType;
  fault: FaultType;
  status: TestStatus;
  duration: number;
  startedAt: number;
  endedAt?: number;
  metrics: {
    latencyAvg: number;
    errorRate: number;
    throughput: number;
  };
  impactedServices: string[];
  timeline: WSEvent[];
}

// Fault schema
export interface FaultSchema {
  faultType: FaultType;
  parameters: {
    name: string;
    type: "string" | "number" | "select";
    required: boolean;
    options?: string[];
    default?: string | number;
    unit?: string;
  }[];
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateEnvironmentRequest {
  name: string;
  type: TargetType;
  services: Environment["services"];
}

export interface CreateTestRequest {
  name: string;
  target: TargetType;
  fault: FaultType;
  parameters: Test["parameters"];
  steps?: {
    fault: FaultType;
    parameters: Test["parameters"];
    delayMs: number;
  }[];
}

export interface LogFilters {
  service?: string[];
  level?: LogLevel[];
  search?: string;
  from?: number;
  to?: number;
  page?: number;
}

export interface MetricsParams {
  window?: "5m" | "15m" | "1h" | "6h" | "24h" | "custom";
  type?: "latency" | "errorRate" | "throughput" | "cpu" | "memory" | "all";
  from?: number;
  to?: number;
}

// Settings
export interface SlackSettings {
  webhookUrl: string;
  channel: string;
  events: {
    testStarted: boolean;
    testFailed: boolean;
    testCompleted: boolean;
    faultInjected: boolean;
  };
}

export interface EmailSettings {
  provider: "smtp" | "sendgrid" | "resend";
  smtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  apiKey?: string;
  recipients: string[];
  events: SlackSettings["events"];
}

export interface AuthSession {
  id: string;
  device: string;
  ip: string;
  lastActive: number;
}

// API Error
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}
