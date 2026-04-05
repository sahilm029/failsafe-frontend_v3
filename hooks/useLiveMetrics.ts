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
  const [timeline, setTimeline] = useState<any[]>([]);
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

    // Use regular polling for metrics because backend WS is currently not bridging to frontend mock
    setIsConnected(true);
    setWsConnectionState("connected");

    const fetchMetrics = async () => {
      try {
        const { getTestById, getExperimentMetrics } = await import("@/lib/api");
        const test = await getTestById(testId);
        if (!test) return;

        const platform = test.targetId?.includes("android") ? "android" : (test.targetId?.includes("frontend") ? "frontend" : "backend");
        const backendId = test.backendId || testId;
        const newMetrics = await getExperimentMetrics(platform, backendId) as any;

        if (newMetrics && !Array.isArray(newMetrics) && newMetrics.endpoints) {
          // Backend format dict
          const endpoints = newMetrics.endpoints || {};
          const epKeys = Object.keys(endpoints);
          let avgLatency = 0;
          let totalErrors = 0;
          let avgCpu = 0;
          let avgMemory = 0;

          if (epKeys.length > 0) {
            epKeys.forEach(k => {
              avgLatency += endpoints[k].latency?.current_ms !== undefined ? endpoints[k].latency.current_ms : (endpoints[k].latency?.avg_ms || 0);
              totalErrors += endpoints[k].errors?.current_error ? 1 : 0;
              avgCpu += endpoints[k].container?.current_cpu !== undefined ? endpoints[k].container.current_cpu : (endpoints[k].container?.avg_cpu_percent || 0);
              avgMemory += endpoints[k].container?.current_memory !== undefined ? endpoints[k].container.current_memory : (endpoints[k].container?.avg_memory_mb || 0);
            });
            avgLatency /= epKeys.length;
            totalErrors = (totalErrors / epKeys.length) * 100; // Live error rate as percentage
            avgCpu /= epKeys.length;
            avgMemory /= epKeys.length;
          }

          const point: MetricPoint = {
            timestamp: new Date().toISOString(),
            latency: avgLatency,
            errorRate: totalErrors, // Overwritten calculation
            throughput: newMetrics.total_requests || 0,
            cpu: avgCpu,
            memory: avgMemory
          };

          setMetrics(prev => {
            const updated = [...prev, point];
            return updated.length > maxDataPoints ? updated.slice(-maxDataPoints) : updated;
          });

          // Translate backend timeline object into Timeline component WSEvent array format
          let timelineEvents: any[] = [];
          if (newMetrics.timeline && typeof newMetrics.timeline === 'object' && !Array.isArray(newMetrics.timeline)) {
            const tl = newMetrics.timeline;
            if (tl.fault_start) {
              timelineEvents.push({
                type: "FAULT_INJECTED",
                timestamp: new Date(tl.fault_start).valueOf() || Date.now(),
                payload: { message: "Fault injected into system" }
              });
            }
            if (tl.first_impact) {
              Object.keys(tl.first_impact).forEach(ep => {
                timelineEvents.push({
                  type: "ERROR_EVENT",
                  timestamp: new Date(tl.first_impact[ep]).valueOf() || Date.now(),
                  payload: { message: `First impact detected on ${ep}`, service: ep }
                });
              });
            }
            if (tl.recovery) {
              Object.keys(tl.recovery).forEach(ep => {
                timelineEvents.push({
                  type: "STATE_CHANGE",
                  timestamp: new Date(tl.recovery[ep]).valueOf() || Date.now(),
                  payload: { message: `Recovery detected on ${ep}`, service: ep }
                });
              });
            }
            timelineEvents.sort((a, b) => a.timestamp - b.timestamp);
          } else if (Array.isArray(newMetrics.timeline)) {
            timelineEvents = newMetrics.timeline;
          }
          setTimeline(timelineEvents);
        } else if (newMetrics && Array.isArray(newMetrics)) {
          // Frontend array format
          setMetrics(prev => {
            const fresh = newMetrics.slice(-maxDataPoints);
            return fresh.length > 0 ? fresh : prev;
          });
        }
      } catch (err) {
        console.error("Failed to poll live metrics:", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
      setWsConnectionState("disconnected");
    };
  }, [testId, enabled, setWsConnectionState, maxDataPoints]);

  // Get current values (last point)
  const currentValues = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return {
    metrics,
    timeline,
    currentValues,
    isConnected,
    clearMetrics: () => setMetrics([]),
  };
}
