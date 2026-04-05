"use client";

import { useEffect, useState, useCallback } from "react";
import { getWebSocketClient } from "@/lib/websocket";
import type { LogEntry, LogLevel } from "@/lib/types";
import { useStore } from "@/lib/store";
import { MAX_LOG_ENTRIES_IN_MEMORY } from "@/lib/constants";

interface UseLiveLogsOptions {
  testId: string;
  enabled?: boolean;
  maxEntries?: number;
}

interface LogFilters {
  services: string[];
  levels: LogLevel[];
  search: string;
}

export function useLiveLogs({
  testId,
  enabled = true,
  maxEntries = MAX_LOG_ENTRIES_IN_MEMORY,
}: UseLiveLogsOptions) {
  const { setWsConnectionState } = useStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilters>({
    services: [],
    levels: [],
    search: "",
  });
  const [isConnected, setIsConnected] = useState(false);

  const addLog = useCallback(
    (log: LogEntry) => {
      setLogs((prev) => {
        const updated = [...prev, log];
        // FIFO - keep only last maxEntries
        if (updated.length > maxEntries) {
          return updated.slice(updated.length - maxEntries);
        }
        return updated;
      });
    },
    [maxEntries]
  );

  useEffect(() => {
    if (!enabled || !testId) return;

    setIsConnected(true);
    setWsConnectionState("connected");

    const pollLogs = async () => {
      try {
        const { getTestById, getExperimentMetrics } = await import("@/lib/api");
        const test = await getTestById(testId);
        if (!test) return;
        
        let platform = test.targetId?.includes("android") ? "android" : (test.targetId?.includes("frontend") ? "frontend" : "backend");
        const backendId = test.backendId || testId;
        const metrics = await getExperimentMetrics(platform, backendId) as any;
        
        if (metrics && !Array.isArray(metrics) && metrics.endpoints) {
          const eps = Object.keys(metrics.endpoints);
          eps.forEach(ep => {
              const data = metrics.endpoints[ep];
              if (data.degraded) {
                  addLog({
                      id: Date.now().toString() + Math.random().toString(),
                      timestamp: new Date().toISOString(),
                      level: "warn",
                      service: ep,
                      message: `[DEGRADED] ${ep} | Avg Latency ${data.latency?.avg_ms}ms | Errors ${data.errors?.rate_percent}%`
                  });
              } else if (data.errors && data.errors.total > 0) {
                  addLog({
                      id: Date.now().toString() + Math.random().toString(),
                      timestamp: new Date().toISOString(),
                      level: "warn",
                      service: ep,
                      message: `[WARN] ${ep} | ${data.errors.total} errors recorded.`
                  });
              } else {
                  if (Math.random() > 0.6) {
                    addLog({
                        id: Date.now().toString() + Math.random().toString(),
                        timestamp: new Date().toISOString(),
                        level: "info",
                        service: ep,
                        message: `Endpoint ${ep} response: ${data.latency?.avg_ms}ms`
                    });
                  }
              }
          });
        } else if (metrics && Array.isArray(metrics) && metrics.length > 0) {
            // Simple array metrics
            const latest = metrics[metrics.length - 1];
            addLog({
                id: Date.now().toString() + Math.random().toString(),
                timestamp: new Date().toISOString(),
                level: latest.errorRate > 5 ? "error" : "info",
                service: platform,
                message: `Status from ${platform} | Latency: ${latest.latency}ms | Errors: ${latest.errorRate}%`
            });
        }
      } catch (err) {
        console.error("logs HTTP fallback fail", err);
      }
    };
    
    pollLogs();
    const interval = setInterval(pollLogs, 3000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
      setWsConnectionState("disconnected");
    };
  }, [testId, enabled, setWsConnectionState, addLog]);

  // Filter logs based on current filters
  const filteredLogs = logs.filter((log) => {
    if (filters.services.length > 0 && !filters.services.includes(log.service)) {
      return false;
    }
    if (filters.levels.length > 0 && !filters.levels.includes(log.level)) {
      return false;
    }
    if (
      filters.search &&
      !log.message.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Get unique services from logs
  const availableServices = Array.from(new Set(logs.map((log) => log.service)));

  // Get log counts by level
  const counts = {
    total: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    debug: logs.filter((l) => l.level === "debug").length,
  };

  return {
    logs: filteredLogs,
    allLogs: logs,
    filters,
    setFilters,
    isConnected,
    availableServices,
    counts,
    clearLogs: () => setLogs([]),
  };
}
