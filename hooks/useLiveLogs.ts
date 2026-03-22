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

    const wsClient = getWebSocketClient(`/ws/test/${testId}`);

    const unsubscribeState = wsClient.onConnectionStateChange((state) => {
      setWsConnectionState(state);
      setIsConnected(state === "connected");
    });

    const unsubscribeLogs = wsClient.on("LOG", (event) => {
      const payload = event.payload;
      addLog({
        id: `${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: event.timestamp,
        level: (payload.level as LogLevel) || "info",
        service: (payload.service as string) || "unknown",
        message: (payload.message as string) || "",
        metadata: payload.metadata as Record<string, unknown> | undefined,
      });
    });

    wsClient.connect();

    return () => {
      unsubscribeState();
      unsubscribeLogs();
      wsClient.disconnect();
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
