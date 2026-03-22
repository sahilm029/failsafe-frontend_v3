"use client";

import { useEffect, useState, useCallback } from "react";
import { getWebSocketClient } from "@/lib/websocket";
import type { MetricPoint } from "@/lib/types";
import { useStore } from "@/lib/store";

interface UseLiveMetricsOptions {
  testId: string;
  maxDataPoints?: number;
  enabled?: boolean;
}

export function useLiveMetrics({
  testId,
  maxDataPoints = 60,
  enabled = true,
}: UseLiveMetricsOptions) {
  const { setWsConnectionState } = useStore();
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const addMetricPoint = useCallback(
    (point: MetricPoint) => {
      setMetrics((prev) => {
        const updated = [...prev, point];
        // Keep only the last maxDataPoints
        if (updated.length > maxDataPoints) {
          return updated.slice(updated.length - maxDataPoints);
        }
        return updated;
      });
    },
    [maxDataPoints]
  );

  useEffect(() => {
    if (!enabled || !testId) return;

    const wsClient = getWebSocketClient(`/ws/test/${testId}`);

    const unsubscribeState = wsClient.onConnectionStateChange((state) => {
      setWsConnectionState(state);
      setIsConnected(state === "connected");
    });

    const unsubscribeMetrics = wsClient.on("METRIC_UPDATE", (event) => {
      const payload = event.payload as Partial<MetricPoint>;
      addMetricPoint({
        timestamp: event.timestamp,
        latency: payload.latency,
        errorRate: payload.errorRate,
        throughput: payload.throughput,
        cpu: payload.cpu,
        memory: payload.memory,
      });
    });

    wsClient.connect();

    return () => {
      unsubscribeState();
      unsubscribeMetrics();
      wsClient.disconnect();
    };
  }, [testId, enabled, setWsConnectionState, addMetricPoint]);

  // Get current values (last point)
  const currentValues = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return {
    metrics,
    currentValues,
    isConnected,
    clearMetrics: () => setMetrics([]),
  };
}
