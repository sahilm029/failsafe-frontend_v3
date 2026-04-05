"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { LogEntry, MetricPoint, WSEvent } from "@/lib/types";

interface UseWebSocketProps {
  testId?: string;
  global?: boolean;
}

export function useWebSocket({ testId, global }: UseWebSocketProps) {
  const { wsConnectionState, setWsConnectionState, setSelectedTestId } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsState = wsConnectionState; // Return current zustand connection state

  const connect = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    let url = baseUrl;
    if (global) {
      url += "/ws/global";
    } else if (testId) {
      url += `/ws/test/${testId}`;
    } else {
      return; 
    }

    setWsConnectionState("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setWsConnectionState("connected");
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setWsConnectionState("disconnected");
      // Attempt reconnect after 3 seconds
      connectionTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (e) => {
      console.error("WebSocket connection error:", e);
      // We do not disconnect here manually (let onclose handle it) but change the state
      setWsConnectionState("error");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSEvent;
        
        switch (data.type) {
          case "METRIC_UPDATE":
            setMetrics((prev) => {
              const next = [...prev, data.payload as MetricPoint];
              return next.length > 100 ? next.slice(next.length - 100) : next;
            });
            break;
            
          case "LOG":
            setLogs((prev) => {
              const next = [...prev, data.payload as LogEntry];
              return next.length > 200 ? next.slice(next.length - 200) : next;
            });
            break;
            
          case "STATE_CHANGE":
            // Assuming payload includes the testId
            if (data.payload?.testId) {
              setSelectedTestId(data.payload.testId as string);
            }
            break;
            
          case "TEST_STARTED":
          case "FAULT_INJECTED":
          case "ERROR_EVENT":
            // Optional: Handle other global events here or inside components
            break;
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };
  }, [testId, global, setWsConnectionState, setSelectedTestId]);

  useEffect(() => {
    connect();

    return () => {
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop on clean unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, metrics, logs, wsState };
}
