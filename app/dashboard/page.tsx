"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/api";
import { getWebSocketClient } from "@/lib/websocket";
import type { WSEvent, Test } from "@/lib/types";
import { useStore } from "@/lib/store";
import { MetricCard, StatusBadge, SkeletonCard } from "@/components/shared";
import {
  PlayIcon,
  LightningBoltIcon,
  CrossCircledIcon,
  StopIcon,
  PlusIcon,
  UploadIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { Activity, AlertCircle, Timer, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Color constants
const COLORS = {
  teal: "#14B8A6",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
  muted: "#6B7280",
};

export default function DashboardPage() {
  const { setWsConnectionState } = useStore();
  const [activityFeed, setActivityFeed] = useState<WSEvent[]>([]);
  const [activeTests, setActiveTests] = useState<Test[]>([]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // WebSocket for live activity feed
  useEffect(() => {
    const wsClient = getWebSocketClient("/ws/global");

    // Subscribe to connection state
    const unsubscribeState = wsClient.onConnectionStateChange((state) => {
      setWsConnectionState(state);
      if (state === "connected") {
        toast.success("Live stream connected");
      } else if (state === "error") {
        toast.error("Stream disconnected");
      }
    });

    // Subscribe to all event types
    const unsubscribeEvents = [
      wsClient.on("TEST_STARTED", handleEvent),
      wsClient.on("TEST_STOPPED", handleEvent),
      wsClient.on("FAULT_INJECTED", handleEvent),
      wsClient.on("ERROR_EVENT", handleEvent),
      wsClient.on("STATE_CHANGE", handleEvent),
    ];

    wsClient.connect();

    return () => {
      unsubscribeState();
      unsubscribeEvents.forEach((unsub) => unsub());
      wsClient.disconnect();
    };
  }, [setWsConnectionState]);

  const handleEvent = (event: WSEvent) => {
    setActivityFeed((prev) => {
      const updated = [event, ...prev];
      return updated.slice(0, 50); // Keep max 50 items
    });

    // Update active tests based on events
    if (event.type === "TEST_STARTED" && event.payload.test) {
      setActiveTests((prev) => [...prev, event.payload.test as Test]);
    } else if (event.type === "TEST_STOPPED" && event.payload.testId) {
      setActiveTests((prev) =>
        prev.filter((t) => t.id !== event.payload.testId)
      );
    }
  };

  const handleRerunLast = async () => {
    if (!confirm("Rerun the last test?")) return;

    try {
      // This would call the API - for now just show toast
      toast.success("Test queued for execution");
    } catch {
      toast.error("Failed to rerun test");
    }
  };

  // Get Active Tests color
  const getActiveTestsColor = (count: number) => {
    return count > 0 ? COLORS.teal : COLORS.muted;
  };

  // Get Failed Last 24h color
  const getFailedColor = (count: number) => {
    if (count === 0) return COLORS.green;
    if (count < 5) return COLORS.amber;
    return COLORS.red;
  };

  // Get latency color based on thresholds
  const getLatencyColor = (latency: number) => {
    if (latency === 0) return COLORS.muted;
    if (latency < 200) return COLORS.green;
    if (latency < 500) return COLORS.amber;
    return COLORS.red;
  };

  // Get health color and text
  const getHealthColor = (health: string) => {
    switch (health) {
      case "Healthy":
        return COLORS.green;
      case "Degraded":
        return COLORS.amber;
      case "Critical":
        return COLORS.red;
      default:
        return COLORS.muted;
    }
  };

  const activeTestsValue = stats?.activeTests ?? 0;
  const failedValue = stats?.failedLast24h ?? 0;
  const latencyValue = stats?.avgLatency ?? 0;
  const healthValue = stats?.systemHealth ?? "Unknown";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Global Status Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Active Tests"
              value={activeTestsValue}
              color={getActiveTestsColor(activeTestsValue)}
              borderColor={getActiveTestsColor(activeTestsValue)}
              icon={Activity}
            />
            <MetricCard
              label="Failed Last 24h"
              value={failedValue}
              color={getFailedColor(failedValue)}
              borderColor={getFailedColor(failedValue)}
              icon={AlertCircle}
            />
            <MetricCard
              label="Avg Latency"
              value={latencyValue}
              unit="ms"
              color={getLatencyColor(latencyValue)}
              borderColor={getLatencyColor(latencyValue)}
              icon={Timer}
            />
            <MetricCard
              label="System Health"
              value={healthValue}
              color={getHealthColor(healthValue)}
              borderColor={getHealthColor(healthValue)}
              icon={Shield}
              showDot={true}
            />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Live Activity Feed (65%) */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">
                Live Activity Feed
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {activityFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4">
                    <PlayIcon className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-text-secondary text-sm">
                    No activity. System idle.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {activityFeed.map((event, index) => (
                    <ActivityFeedItem key={`${event.timestamp}-${index}`} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Active Tests Panel (35%) */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">
                Active Tests
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {activeTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4">
                    <StopIcon className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-text-secondary text-sm">No tests running</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTests.map((test) => (
                    <ActiveTestItem key={test.id} test={test} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <button className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors">
          <PlusIcon className="w-4 h-4" />
          Create Test
        </button>
        <button className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 text-text-primary rounded font-medium border border-border transition-colors">
          <UploadIcon className="w-4 h-4" />
          Import Config
        </button>
        <button
          onClick={handleRerunLast}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 text-text-primary rounded font-medium border border-border transition-colors"
        >
          <ReloadIcon className="w-4 h-4" />
          Trigger Last Run
        </button>
      </div>
    </div>
  );
}

// Activity Feed Item Component
function ActivityFeedItem({ event }: { event: WSEvent }) {
  const getEventIcon = () => {
    switch (event.type) {
      case "TEST_STARTED":
        return <PlayIcon className="w-4 h-4 text-primary" />;
      case "FAULT_INJECTED":
        return <LightningBoltIcon className="w-4 h-4 text-warning" />;
      case "ERROR_EVENT":
        return <CrossCircledIcon className="w-4 h-4 text-danger" />;
      case "TEST_STOPPED":
        return <StopIcon className="w-4 h-4 text-text-muted" />;
      default:
        return <PlayIcon className="w-4 h-4 text-info" />;
    }
  };

  const getEventLabel = () => {
    return event.type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-surface/50 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded bg-surface">
        {getEventIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            {getEventLabel()}
          </span>
          {typeof event.payload.service === "string" && (
            <span className="text-xs text-text-muted">
              {event.payload.service}
            </span>
          )}
        </div>
        {typeof event.payload.message === "string" && (
          <p className="text-xs text-text-secondary truncate">
            {event.payload.message}
          </p>
        )}
      </div>
      <span className="text-xs text-text-muted shrink-0">
        {formatTime(event.timestamp)}
      </span>
    </div>
  );
}

// Active Test Item Component
function ActiveTestItem({ test }: { test: Test }) {
  const getTargetBadge = () => {
    const colors = {
      backend: "bg-secondary/20 text-secondary",
      frontend: "bg-info/20 text-info",
      android: "bg-warning/20 text-warning",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${colors[test.target]}`}
      >
        {test.target}
      </span>
    );
  };

  return (
    <div className="p-3 rounded border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-text-primary">{test.name}</h3>
        <StatusBadge status={test.status} showDot={true} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        {getTargetBadge()}
        <span className="text-xs text-text-muted">{test.fault}</span>
      </div>
      <Link
        href={`/test/${test.id}/live`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
      >
        View Live →
      </Link>
    </div>
  );
}
