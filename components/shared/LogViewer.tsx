"use client";

import { memo, useRef, useEffect, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { LOG_LEVEL_COLORS, LOG_LEVEL_BG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons";

interface LogViewerProps {
  logs: LogEntry[];
  isStreaming?: boolean;
  onFilterChange?: (filters: { service: string[]; level: string[] }) => void;
  maxHeight?: string;
  className?: string;
}

export const LogViewer = memo(function LogViewer({
  logs,
  isStreaming = false,
  maxHeight = "600px",
  className,
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevLogsLengthRef = useRef(logs.length);

  // Auto-scroll when new logs arrive and autoScroll is enabled
  useEffect(() => {
    if (autoScroll && isStreaming && logs.length > prevLogsLengthRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length, autoScroll, isStreaming]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false,
    });
  };

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        No logs available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Auto-scroll toggle */}
      {isStreaming && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors",
              autoScroll
                ? "bg-primary/20 text-primary"
                : "bg-card text-text-muted border border-border"
            )}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            {autoScroll ? (
              <LockOpen1Icon className="w-3 h-3" />
            ) : (
              <LockClosedIcon className="w-3 h-3" />
            )}
          </button>
        </div>
      )}

      {/* Log entries */}
      <div
        ref={containerRef}
        className="overflow-y-auto font-mono text-xs"
        style={{ maxHeight }}
      >
        {logs.map((log, index) => (
          <div
            key={log.id || index}
            className={cn(
              "flex items-start gap-3 px-3 py-2 border-l-2 hover:bg-card/30 transition-colors",
              LOG_LEVEL_BG[log.level]
            )}
          >
            {/* Timestamp */}
            <span className="text-text-muted shrink-0 w-24">
              {formatTime(log.timestamp)}
            </span>

            {/* Level */}
            <span
              className={cn(
                "shrink-0 w-12 font-semibold uppercase",
                LOG_LEVEL_COLORS[log.level]
              )}
            >
              {log.level}
            </span>

            {/* Service */}
            <span className="text-text-secondary shrink-0 w-24 truncate">
              {log.service}
            </span>

            {/* Message */}
            <span className="text-text-primary flex-1 break-words">
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
