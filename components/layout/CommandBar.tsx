"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useStore } from "@/lib/store";
import {
  HomeIcon,
  ComponentInstanceIcon,
  GearIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

export function CommandBar() {
  const router = useRouter();
  const { commandBarOpen, setCommandBarOpen } = useStore();
  const [search, setSearch] = useState("");

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(!commandBarOpen);
      }
      if (e.key === "Escape") {
        setCommandBarOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandBarOpen, setCommandBarOpen]);

  const runCommand = (command: () => void) => {
    setCommandBarOpen(false);
    setSearch("");
    command();
  };

  if (!commandBarOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCommandBarOpen(false)}
      />

      {/* Command Dialog */}
      <div className="absolute left-1/2 top-[10%] sm:top-[20%] -translate-x-1/2 w-full max-w-xl px-4">
        <Command
          className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-border px-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-text-muted mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 py-4 bg-transparent text-text-primary placeholder:text-text-muted outline-none"
            />
            <kbd className="px-2 py-1 text-xs bg-card rounded border border-border text-text-muted">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-text-muted">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2">
              <CommandItem
                icon={<HomeIcon />}
                onSelect={() => runCommand(() => router.push("/dashboard"))}
              >
                Go to Dashboard
              </CommandItem>
              <CommandItem
                icon={<ComponentInstanceIcon />}
                onSelect={() => runCommand(() => router.push("/projects"))}
              >
                Go to Projects
              </CommandItem>
              <CommandItem
                icon={<GearIcon />}
                onSelect={() => runCommand(() => router.push("/settings/integrations"))}
              >
                Open Settings
              </CommandItem>
            </Command.Group>

            <Command.Group heading="Actions" className="px-2 mt-2">
              <CommandItem
                icon={<PlusIcon />}
                onSelect={() => runCommand(() => router.push("/projects?create=true"))}
              >
                Create New Project
              </CommandItem>
              <CommandItem
                icon={<PlusIcon />}
                onSelect={() => runCommand(() => {
                  // Could open a modal or navigate
                  router.push("/projects");
                })}
              >
                Create New Test
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function CommandItem({
  children,
  icon,
  onSelect,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-text-secondary data-[selected=true]:bg-card data-[selected=true]:text-primary transition-colors"
    >
      {icon && <span className="text-text-muted">{icon}</span>}
      <span>{children}</span>
    </Command.Item>
  );
}
