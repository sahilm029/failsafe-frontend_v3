"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useStore();

  return (
    <div
      className={cn(
        "flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300 min-w-0 w-full",
        sidebarCollapsed ? "pl-[60px]" : "pl-[60px] md:pl-[240px]"
      )}
    >
      {children}
    </div>
  );
}
