"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { MagnifyingGlassIcon, BellIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function TopBar() {
  const pathname = usePathname();
  const { wsConnectionState, setCommandBarOpen } = useStore();

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { label, path: "/" + segments.slice(0, index + 1).join("/") };
  });

  // Connection status indicator
  const getConnectionStatus = () => {
    switch (wsConnectionState) {
      case "connected":
        return { color: "bg-success", label: "Connected" };
      case "connecting":
        return { color: "bg-warning", label: "Connecting" };
      case "disconnected":
        return { color: "bg-text-muted", label: "Disconnected" };
      case "error":
        return { color: "bg-danger", label: "Error" };
      default:
        return { color: "bg-text-muted", label: "Disconnected" };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="text-text-primary">Dashboard</span>
        ) : (
          breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span className="text-text-muted">/</span>}
              <span
                className={cn(
                  index === breadcrumbs.length - 1
                    ? "text-text-primary"
                    : "text-text-secondary"
                )}
              >
                {crumb.label}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Command bar trigger */}
        <button
          onClick={() => setCommandBarOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-card rounded border border-border hover:border-primary transition-colors"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-muted">Search</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-surface rounded border border-border text-text-muted">
            ⌘K
          </kbd>
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus.color,
              wsConnectionState === "connected" && "animate-pulse"
            )}
          />
          <span className="text-xs text-text-secondary">
            {connectionStatus.label}
          </span>
        </div>

        {/* Notification bell */}
        <button className="p-2 rounded hover:bg-card transition-colors relative">
          <BellIcon className="w-5 h-5 text-text-secondary" />
          {/* Optional notification badge */}
          {/* <div className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" /> */}
        </button>
      </div>
    </header>
  );
}
