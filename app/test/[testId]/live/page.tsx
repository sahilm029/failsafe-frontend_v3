"use client";

import { useQuery } from "@tanstack/react-query";
import { getTestById } from "@/lib/api";
import type { Test } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";
import { useLiveLogs } from "@/hooks/useLiveLogs";
import { useRunTest, useStopTest } from "@/hooks/useTests";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { AlertCircle, Download, Activity, FileText } from "lucide-react";
import { Timeline } from "@/components/shared/Timeline";
import { MetricsChart } from "@/components/shared/MetricsChart";
import { LogViewer } from "@/components/shared/LogViewer";

export default function LiveTestPage({ params }: { params: { testId: string } }) {
  const { wsConnectionState } = useStore();
  const { logs: liveLogs } = useLiveLogs({ testId: params.testId });
  const { metrics: liveMetrics, timeline: liveTimeline } = useLiveMetrics({ testId: params.testId });

  const { mutate: runTest, isPending: isRunningTest } = useRunTest();
  const { mutate: stopTest, isPending: isStoppingTest } = useStopTest();

  const { data: test, isLoading, error } = useQuery<Test>({
    queryKey: ["test", params.testId],
    queryFn: () => getTestById(params.testId),
    refetchInterval: 5000, // fallback polling if WS drops
  });

  const handleRunTest = () => {
    runTest(params.testId);
  };

  const handleStopTest = () => {
    stopTest(params.testId);
  };

  const handleExport = () => {
    // TODO: Backend gap — missing endpoint for exporting PDF results
    console.warn("Backend gap: POST /reports/export not yet implemented");
    alert("Export functionality currently unavailable (awaiting backend integration).");
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-danger font-medium">Failed to load test</h3>
            <p className="text-danger/80 text-sm mt-1">{(error as Error)?.message || "Test not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = test.status === "running";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-text-primary">{test.name}</h1>
            <StatusBadge status={test.status} />
            {isRunning && (
              <span className={`text-xs px-2 py-1 rounded bg-surface border ${
                wsConnectionState === "connected" ? "border-success text-success" : 
                wsConnectionState === "connecting" ? "border-warning text-warning" : 
                "border-danger text-danger"
              }`}>
                WS: {wsConnectionState}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-text-secondary"><strong className="text-text-primary">Target:</strong> {test.target}</span>
            <span className="text-text-secondary"><strong className="text-text-primary">Fault:</strong> {test.fault}</span>
            {test.duration && <span className="text-text-secondary"><strong className="text-text-primary">Duration:</strong> {test.duration}s</span>}
            <span className="text-text-secondary"><strong className="text-text-primary">Started:</strong> {test.startTime ? new Date(test.startTime).toLocaleString() : "—"}</span>
          </div>
        </div>
        
        
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={handleStopTest}
              disabled={isStoppingTest}
              className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors font-medium cursor-pointer disabled:opacity-50"
            >
              {isStoppingTest ? "Aborting..." : "Abort Test"}
            </button>
          ) : (
            <>
              {test.status === "idle" && (
                <button
                  onClick={handleRunTest}
                  disabled={isRunningTest}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  {isRunningTest ? "Starting..." : "Run Test"}
                </button>
              )}
              {test.status !== "idle" && test.status !== "running" && (
                <button
                  onClick={handleRunTest}
                  disabled={isRunningTest}
                  className="px-4 py-2 bg-primary/20 text-primary border border-primary rounded-md hover:bg-primary/30 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  {isRunningTest ? "Restarting..." : "Restart Test"}
                </button>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary border border-border rounded-md hover:bg-surface-hover transition-colors font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </>
          )}
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Execution Timeline
            </h2>
            <Timeline events={liveTimeline || []} />
            {/* TODO: Backend gap — execution timeline array not fully rich. */}
          </div>
        </div>

        {/* Right Column: Live Metrics & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Metrics
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {liveMetrics.length > 0 ? (
                  <MetricsChart data={liveMetrics} metrics={["latency", "errorRate"]} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-muted border border-dashed border-border rounded-lg">
                  {isRunning ? "Waiting for metrics stream..." : "No metrics recorded for this test."}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Live Logs
              </h2>
            </div>
            <LogViewer logs={liveLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
