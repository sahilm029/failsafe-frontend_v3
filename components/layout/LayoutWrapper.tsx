"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useStore();

  return (
    <div
      className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "ml-[60px]" : "ml-[240px]"
      )}
    >
      {children}
    </div>
  );
}
