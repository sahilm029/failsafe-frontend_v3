"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTests, getTestResult, exportTestPDF } from "@/lib/api";
import type { Test } from "@/lib/types";
import { DataTable, StatusBadge, Timeline, SkeletonTable } from "@/components/shared";
import type { Column } from "@/components/shared/DataTable";
import { DownloadIcon, Cross2Icon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests", projectId],
    queryFn: () => getTests(projectId),
  });

  const completedTests = (tests ?? []).filter(
    (t) => t.status === "completed" || t.status === "failed"
  );

  const handleExportJSON = (test: Test) => {
    const blob = new Blob([JSON.stringify(test, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${test.name.replace(/\s+/g, "-")}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  };

  const handleExportPDF = async (testId: string) => {
    try {
      const blob = await exportTestPDF(testId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-result-${testId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start) return "—";
    const endTime = end || Date.now();
    const diff = Math.floor((endTime - start) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: Column<Test>[] = [
    { key: "name", label: "Test Name" },
    {
      key: "target",
      label: "Target",
      render: (test) => {
        const colors = {
          backend: "bg-secondary/20 text-secondary",
          frontend: "bg-info/20 text-info",
          android: "bg-warning/20 text-warning",
        };
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[test.target]}`}>
            {test.target}
          </span>
        );
      },
    },
    { key: "fault", label: "Fault" },
    {
      key: "status",
      label: "Status",
      render: (test) => <StatusBadge status={test.status} />,
    },
    {
      key: "duration",
      label: "Duration",
      render: (test) => (
        <span className="text-text-secondary">
          {formatDuration(test.startTime, test.endTime)}
        </span>
      ),
    },
    {
      key: "startTime",
      label: "Started",
      render: (test) => (
        <span className="text-text-secondary">{formatDate(test.startTime)}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (test) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTest(test);
            }}
            className="text-xs text-primary hover:text-primary-hover"
          >
            View Detail
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExportJSON(test);
            }}
            className="p-1.5 rounded hover:bg-surface transition-colors"
            title="Export JSON"
          >
            <DownloadIcon className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full">
      {/* Main Table */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          Test Results
        </h1>
        {isLoading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : (
          <DataTable
            columns={columns}
            data={completedTests}
            onRowClick={(test) => setSelectedTest(test)}
            emptyMessage="No test results yet"
          />
        )}
      </div>

      {/* Detail Panel */}
      {selectedTest && (
        <ResultDetailPanel
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
          onExportPDF={() => handleExportPDF(selectedTest.id)}
        />
      )}
    </div>
  );
}

function ResultDetailPanel({
  test,
  onClose,
  onExportPDF,
}: {
  test: Test;
  onClose: () => void;
  onExportPDF: () => void;
}) {
  const { data: result } = useQuery({
    queryKey: ["test-result", test.id],
    queryFn: () => getTestResult(test.id),
  });

  // Mock comparison data
  const comparison = {
    baseline: { latencyAvg: 150, errorRate: 0.5, throughput: 1000 },
    current: result?.metrics || { latencyAvg: 200, errorRate: 2.5, throughput: 850 },
  };

  return (
    <div className="w-[450px] border-l border-border bg-surface h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Result Detail</h2>
          <button onClick={onClose} className="p-1 hover:bg-card rounded">
            <Cross2Icon className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <div className={`text-center p-6 rounded-lg mb-4 ${
            test.status === "completed" ? "bg-success/10" : "bg-danger/10"
          }`}>
            <StatusBadge status={test.status} className="text-lg" />
            <p className="text-xs text-text-muted mt-2">
              Duration: {test.startTime && test.endTime
                ? `${Math.floor((test.endTime - test.startTime) / 1000)}s`
                : "—"}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Target</span>
              <span className="text-text-primary">{test.target}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Fault Applied</span>
              <span className="text-text-primary">{test.fault}</span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Comparison vs Baseline
          </h3>
          <div className="space-y-3">
            <ComparisonRow
              label="Latency Avg"
              baseline={comparison.baseline.latencyAvg}
              current={comparison.current.latencyAvg}
              unit="ms"
              higherIsBad
            />
            <ComparisonRow
              label="Error Rate"
              baseline={comparison.baseline.errorRate}
              current={comparison.current.errorRate}
              unit="%"
              higherIsBad
            />
            <ComparisonRow
              label="Throughput"
              baseline={comparison.baseline.throughput}
              current={comparison.current.throughput}
              unit="req/s"
              higherIsBad={false}
            />
          </div>
        </div>

        {/* Root Cause (if failed) */}
        {test.status === "failed" && (
          <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-lg">
            <h3 className="text-sm font-semibold text-danger mb-2">Root Cause Analysis</h3>
            <p className="text-sm text-text-secondary">
              Latency spike detected 2.3s after fault injection. Service response degradation
              correlated with memory pressure at 85% threshold.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Timeline</h3>
          <Timeline events={result?.timeline || []} className="max-h-[200px]" />
        </div>

        {/* Export */}
        <div className="flex gap-2">
          <button
            onClick={onExportPDF}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  baseline,
  current,
  unit,
  higherIsBad,
}: {
  label: string;
  baseline: number;
  current: number;
  unit: string;
  higherIsBad: boolean;
}) {
  const diff = ((current - baseline) / baseline) * 100;
  const isUp = diff > 0;
  const isBad = higherIsBad ? isUp : !isUp;

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-xs text-text-muted">Baseline</span>
          <p className="text-sm text-text-primary">{baseline}{unit}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-muted">Current</span>
          <p className="text-sm text-text-primary">{current}{unit}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm ${isBad ? "text-danger" : "text-success"}`}>
          {isUp ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {Math.abs(diff).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
