"use client";

import { memo, useEffect, useRef } from "react";
import type { WSEvent } from "@/lib/types";
import { WS_EVENT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  PlayIcon,
  StopIcon,
  LightningBoltIcon,
  CrossCircledIcon,
  ActivityLogIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

interface TimelineProps {
  events: WSEvent[];
  autoScroll?: boolean;
  className?: string;
}

const EVENT_ICONS = {
  TEST_STARTED: PlayIcon,
  TEST_STOPPED: StopIcon,
  FAULT_INJECTED: LightningBoltIcon,
  ERROR_EVENT: CrossCircledIcon,
  METRIC_UPDATE: ActivityLogIcon,
  LOG: InfoCircledIcon,
  STATE_CHANGE: ActivityLogIcon,
};

export const Timeline = memo(function Timeline({
  events,
  autoScroll = true,
  className,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevEventsLengthRef = useRef(events.length);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && events.length > prevEventsLengthRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length, autoScroll]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getEventLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No events yet
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto space-y-3 pr-2", className)}
    >
      {events.map((event, index) => {
        const Icon = EVENT_ICONS[event.type] || InfoCircledIcon;
        const color = WS_EVENT_COLORS[event.type] || "#6B7280";

        return (
          <div key={`${event.timestamp}-${index}`} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              {index < events.length - 1 && (
                <div className="w-px h-full min-h-[20px] bg-border mt-1" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {getEventLabel(event.type)}
                </span>
                <span className="text-xs text-text-muted">
                  {formatTime(event.timestamp)}
                </span>
              </div>
              {event.payload && Object.keys(event.payload).length > 0 && (
                <div className="text-xs text-text-secondary mt-1">
                  {typeof event.payload.message === "string" && (
                    <p>{event.payload.message}</p>
                  )}
                  {typeof event.payload.service === "string" && (
                    <p className="mt-0.5">
                      Service: {event.payload.service}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
