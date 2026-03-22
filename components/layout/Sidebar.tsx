"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  HomeIcon,
  ComponentInstanceIcon,
  GearIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: ComponentInstanceIcon },
  { divider: true },
  { label: "Settings", href: "/settings/integrations", icon: GearIcon },
  { label: "Auth", href: "/settings/auth", icon: LockClosedIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useStore();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-surface border-r border-border transition-all duration-300 z-40",
        sidebarCollapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold text-primary">FailSafe</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-card transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="mx-4 my-2 border-t border-border"
                />
              );
            }

            const Icon = item.icon!;
            const active = isActive(item.href!);

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center h-10 mx-2 px-3 rounded transition-colors relative group",
                  active
                    ? "bg-card/50 text-text-primary"
                    : "text-text-secondary hover:bg-card/30 hover:text-text-primary"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm">{item.label}</span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-card rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-xs">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
