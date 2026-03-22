"use client";

import { useEffect, useState } from "react";
import { getWebSocketClient } from "@/lib/websocket";
import type { WSEvent, WSEventType } from "@/lib/types";
import { useStore } from "@/lib/store";

interface UseWebSocketOptions {
  endpoint: string;
  eventTypes: WSEventType[];
  onEvent?: (event: WSEvent) => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  endpoint,
  eventTypes,
  onEvent,
  autoConnect = true,
}: UseWebSocketOptions) {
  const { setWsConnectionState } = useStore();
  const [events, setEvents] = useState<WSEvent[]>([]);

  useEffect(() => {
    if (!autoConnect) return;

    const wsClient = getWebSocketClient(endpoint);

    // Subscribe to connection state changes
    const unsubscribeState = wsClient.onConnectionStateChange((state) => {
      setWsConnectionState(state);
    });

    // Subscribe to event types
    const unsubscribeEvents = eventTypes.map((eventType) =>
      wsClient.on(eventType, (event) => {
        setEvents((prev) => [event, ...prev]);
        onEvent?.(event);
      })
    );

    // Connect
    wsClient.connect();

    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeEvents.forEach((unsub) => unsub());
      wsClient.disconnect();
    };
  }, [endpoint, autoConnect, setWsConnectionState, onEvent]);

  return { events, setEvents };
}
