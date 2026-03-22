import type { WSEvent, WSEventType } from "./types";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";
type EventListener = (event: WSEvent) => void;
type ConnectionStateListener = (state: ConnectionState) => void;
type AnyListener = EventListener | ConnectionStateListener;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<WSEventType | "connection_state", Set<AnyListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionState: ConnectionState = "disconnected";
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  // Connect to WebSocket
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionState("connecting");

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnectionState("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = () => {
        this.setConnectionState("error");
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.setConnectionState("disconnected");
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.setConnectionState("error");
      this.attemptReconnect();
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState("disconnected");
  }

  // Send message to WebSocket
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", data);
    }
  }

  // Subscribe to specific event type
  on(eventType: WSEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  // Subscribe to connection state changes
  onConnectionStateChange(listener: ConnectionStateListener): () => void {
    if (!this.listeners.has("connection_state")) {
      this.listeners.set("connection_state", new Set());
    }
    this.listeners.get("connection_state")!.add(listener as AnyListener);

    // Return unsubscribe function
    return () => {
      this.listeners.get("connection_state")?.delete(listener as AnyListener);
    };
  }

  // Emit event to all listeners
  private emit(eventType: WSEventType, event: WSEvent): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => (listener as EventListener)(event));
    }
  }

  // Set connection state and notify listeners
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    const listeners = this.listeners.get("connection_state");
    if (listeners) {
      listeners.forEach((listener) => (listener as ConnectionStateListener)(state));
    }
  }

  // Get current connection state
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      this.setConnectionState("error");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  // Reset reconnection attempts (useful after manual reconnect)
  resetReconnection(): void {
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Singleton instances for different WebSocket endpoints
const wsInstances = new Map<string, WebSocketClient>();

export function getWebSocketClient(endpoint: string): WebSocketClient {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
  const fullUrl = `${wsUrl}${endpoint}`;

  if (!wsInstances.has(fullUrl)) {
    wsInstances.set(fullUrl, new WebSocketClient(fullUrl));
  }

  return wsInstances.get(fullUrl)!;
}

// Clean up all WebSocket connections
export function cleanupWebSockets(): void {
  wsInstances.forEach((client) => {
    client.disconnect();
  });
  wsInstances.clear();
}
