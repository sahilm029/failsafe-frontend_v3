"use client";

import { useQuery } from "@tanstack/react-query";
import { getTests } from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { Search, Filter, Download } from "lucide-react";
import { AlertCircle } from "lucide-react";
import type { Test } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectResultsPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tests, isLoading, error } = useQuery({
    queryKey: ["project-tests-results", params.projectId],
    queryFn: async () => {
      // TODO: Backend gap — no dedicated endpoint for listing all tests in a project or filtering endpoints.
      throw new Error("Backend gap: GET /projects/:id/tests and filtered listings not yet implemented");
      return [] as Test[];
    },
  });

  const handleExport = () => {
    // TODO: Backend gap — missing endpoint for exporting PDF results
    console.warn("Backend gap: POST /reports/export not yet implemented");
    alert("Export functionality currently unavailable (awaiting backend integration).");
  };

  const filteredTests = tests?.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase()) || test.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTests = tests?.length || 0;
  const passedTests = tests?.filter(t => t.status === "completed").length || 0;
  const failedTests = tests?.filter(t => t.status === "failed").length || 0;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Test Results</h1>
          <p className="text-text-secondary mt-1">View and filter historical test runs for this project.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary border border-border rounded-md hover:bg-surface-hover transition-colors"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-danger font-medium">Failed to load results</h3>
            <p className="text-danger/80 text-sm mt-1">{(error as Error).message}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border p-4 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Total Runs</p>
              <p className="text-2xl font-bold text-text-primary">{totalTests}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Passed</p>
              <p className="text-2xl font-bold text-success">{passedTests}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Failed</p>
              <p className="text-2xl font-bold text-danger">{failedTests}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Pass Rate</p>
              <p className="text-2xl font-bold text-primary">{passRate}%</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search tests by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface text-text-primary border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface text-text-primary border border-border rounded-md appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:bg-surface-hover"
              >
                <option value="all">All Statuses</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <DataTable
              columns={[
                { key: "name", label: "Name", render: (t: Test) => <span className="font-medium text-text-primary">{t.name}</span> },
                { key: "target", label: "Target", className: "capitalize text-text-secondary" },
                { key: "fault", label: "Fault", className: "capitalize text-text-secondary" },
                { key: "status", label: "Status", render: (t: Test) => <StatusBadge status={t.status} /> },
                { key: "duration", label: "Duration", render: (t: Test) => <span className="text-text-secondary">{t.duration ? `${t.duration}s` : "—"}</span> },
                { key: "startTime", label: "Started At", render: (t: Test) => <span className="text-text-secondary">{t.startTime ? new Date(t.startTime).toLocaleString() : "—"}</span> }
              ]}
              data={filteredTests || []}
              loading={isLoading}
              onRowClick={(item) => router.push(`/test/${item.id}/live`)}
              emptyMessage={totalTests === 0 ? "No test runs found." : "No tests match the current filters."}
            />
          </div>
        </>
      )}
    </div>
  );
}
