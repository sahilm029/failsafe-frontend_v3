"use client";

import { useQuery } from "@tanstack/react-query";
import { getTestById } from "@/lib/api";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { AlertCircle, Download, Activity, BarChart2 } from "lucide-react";
import { MetricsChart } from "@/components/shared/MetricsChart";
import type { MetricPoint } from "@/lib/types";

export default function TestMetricsPage({ params }: { params: { testId: string } }) {
  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", params.testId],
    queryFn: () => getTestById(params.testId),
  });

  const { data: historicalMetrics, isLoading: isMetricsLoading, error: metricsError } = useQuery({
    queryKey: ["test-metrics", params.testId],
    queryFn: async () => {
      // TODO: Backend gap — missing endpoint to fetch complete historical metrics arrays
      throw new Error("Backend gap: GET /tests/:id/metrics not yet implemented");
      return [] as MetricPoint[];
    },
  });

  const handleExport = () => {
    // TODO: Backend gap — missing endpoint for exporting raw metrics CSV
    console.warn("Backend gap: POST /reports/export (metrics) not yet implemented");
    alert("Metrics CSV export currently unavailable (awaiting backend integration).");
  };

  if (isLoading || isMetricsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-danger font-medium">Failed to load test context</h3>
            <p className="text-danger/80 text-sm mt-1">{(error as Error)?.message || "Test not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Historical Metrics
          </h1>
          <p className="text-text-secondary mt-1">Complete system performance logs for test: <span className="font-semibold">{test.name}</span></p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary border border-border rounded-md hover:bg-surface-hover transition-colors font-medium cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Raw CSV
        </button>
      </div>

      {metricsError ? (
        <div className="bg-warning/10 border border-warning p-4 rounded-lg flex items-start gap-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="text-warning font-medium">Metrics retrieval pending backend</h3>
            <p className="text-warning/80 text-sm mt-1">{(metricsError as Error).message}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main CPU/Memory Chart */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 overflow-hidden">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              Resource Utilization
            </h2>
            <div className="h-[400px]">
              {historicalMetrics && historicalMetrics.length > 0 ? (
                <MetricsChart data={historicalMetrics} metrics={["cpu", "memory"]} />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted border border-dashed border-border rounded-lg">
                  No historical metrics recorded for this test.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
