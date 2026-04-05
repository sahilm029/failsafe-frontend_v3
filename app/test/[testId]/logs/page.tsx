"use client";

import { useQuery } from "@tanstack/react-query";
import { getTestById } from "@/lib/api";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { AlertCircle, Download, FileText } from "lucide-react";
import { LogViewer } from "@/components/shared/LogViewer";
import type { LogEntry } from "@/lib/types";

export default function TestLogsPage({ params }: { params: { testId: string } }) {
  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", params.testId],
    queryFn: () => getTestById(params.testId),
  });

  const { data: historicalLogs, isLoading: isLogsLoading, error: logsError } = useQuery({
    queryKey: ["test-logs", params.testId],
    queryFn: async () => {
      // TODO: Backend gap — missing endpoint to fetch complete historical logs
      throw new Error("Backend gap: GET /tests/:id/logs not yet implemented");
      return [] as LogEntry[];
    },
  });

  const handleExport = () => {
    // TODO: Backend gap — missing endpoint for exporting raw logs
    console.warn("Backend gap: POST /reports/export (logs) not yet implemented");
    alert("Log export currently unavailable (awaiting backend integration).");
  };

  if (isLoading || isLogsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
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
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Historical Logs
          </h1>
          <p className="text-text-secondary mt-1">Complete system logs for test: <span className="font-semibold">{test.name}</span></p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary border border-border rounded-md hover:bg-surface-hover transition-colors font-medium cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Raw Logs
        </button>
      </div>

      {logsError ? (
        <div className="bg-warning/10 border border-warning p-4 rounded-lg flex items-start gap-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="text-warning font-medium">Log retrieval pending backend</h3>
            <p className="text-warning/80 text-sm mt-1">{(logsError as Error).message}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-0 overflow-hidden flex-1 min-h-[500px] flex flex-col">
          <LogViewer logs={historicalLogs || []} />
        </div>
      )}
    </div>
  );
}
