"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTestLogs } from "@/lib/api";
import type { LogEntry, LogLevel } from "@/lib/types";
import { LOG_LEVEL_COLORS, LOG_LEVEL_BG, SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export default function LogsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = use(params);
  const [services, setServices] = useState<string[]>([]);
  const [levels, setLevels] = useState<LogLevel[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", testId, services, levels, debouncedSearch, page],
    queryFn: () =>
      getTestLogs(testId, {
        service: services.length > 0 ? services : undefined,
        level: levels.length > 0 ? levels : undefined,
        search: debouncedSearch || undefined,
        page,
      }),
  });

  const logs = data?.logs ?? [];
  const totalCount = data?.total ?? 0;

  const toggleLevel = (level: LogLevel) => {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setServices([]);
    setLevels([]);
    setSearch("");
    setPage(1);
  };

  // Count by level (from current page data)
  const counts = {
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    info: logs.filter((l) => l.level === "info").length,
    debug: logs.filter((l) => l.level === "debug").length,
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Stats Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-card flex flex-wrap items-center gap-4 md:gap-6">
        <div>
          <span className="text-xs text-text-muted">Total</span>
          <span className="ml-2 text-sm font-medium text-text-primary">{totalCount}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted">Errors</span>
          <span className="ml-2 text-sm font-medium text-danger">{counts.error}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted">Warnings</span>
          <span className="ml-2 text-sm font-medium text-warning">{counts.warn}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted">Filtered</span>
          <span className="ml-2 text-sm font-medium text-text-primary">{logs.length}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-surface sticky top-0 z-10 w-full overflow-x-auto">
        <div className="flex flex-wrap items-center gap-4">
          {/* Level Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Level:</span>
            {(["error", "warn", "info", "debug"] as LogLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                  levels.includes(level)
                    ? LOG_LEVEL_BG[level]
                    : "bg-card text-text-secondary hover:text-text-primary"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", {
                  "bg-danger": level === "error",
                  "bg-warning": level === "warn",
                  "bg-info": level === "info",
                  "bg-text-muted": level === "debug",
                })} />
                {level}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Clear Filters */}
          {(levels.length > 0 || services.length > 0 || search) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 bg-card animate-pulse rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-text-muted">No logs found</p>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-xs font-medium text-text-secondary w-28">Time</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-secondary w-20">Level</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-secondary w-32">Service</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-secondary">Message</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {logs.map((log, index) => (
                <LogRow key={log.id || index} log={log} formatTimestamp={formatTimestamp} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 100 && (
        <div className="px-4 sm:px-6 py-3 border-t border-border bg-card flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <span className="text-sm text-text-muted">
            Page {page} of {Math.ceil(totalCount / 100)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-surface hover:bg-surface/80 rounded border border-border disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / 100)}
              className="px-3 py-1.5 text-sm bg-surface hover:bg-surface/80 rounded border border-border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogRow({
  log,
  formatTimestamp,
}: {
  log: LogEntry;
  formatTimestamp: (ts: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "border-b border-border cursor-pointer transition-colors hover:bg-card/50",
          `border-l-2 ${LOG_LEVEL_BG[log.level].split(" ")[1]}`
        )}
      >
        <td className="px-4 py-2 text-text-muted">{formatTimestamp(log.timestamp)}</td>
        <td className="px-4 py-2">
          <span className={cn("uppercase font-semibold", LOG_LEVEL_COLORS[log.level])}>
            {log.level}
          </span>
        </td>
        <td className="px-4 py-2 text-text-secondary">{log.service}</td>
        <td className="px-4 py-2 text-text-primary truncate max-w-xl">{log.message}</td>
      </tr>
      {expanded && log.metadata && (
        <tr className="border-b border-border bg-surface/50">
          <td colSpan={4} className="px-4 py-3">
            <pre className="text-xs text-text-secondary overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
