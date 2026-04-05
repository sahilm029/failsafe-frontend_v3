"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen } = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(!commandBarOpen);
      }
      if (e.key === "Escape" && commandBarOpen) {
        setCommandBarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandBarOpen, setCommandBarOpen]);

  if (!commandBarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
        <input
          type="text"
          placeholder="Type a command or search..."
          className="w-full bg-card text-text-primary border-b border-border p-4 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="p-2 flex flex-col gap-1">
          <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
            Navigation
          </div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-text-secondary hover:bg-border hover:text-primary rounded transition-colors"
            onClick={() => setCommandBarOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            href="/projects" 
            className="px-4 py-2 text-text-secondary hover:bg-border hover:text-primary rounded transition-colors"
            onClick={() => setCommandBarOpen(false)}
          >
            Projects
          </Link>
          <Link 
            href="/settings/integrations" 
            className="px-4 py-2 text-text-secondary hover:bg-border hover:text-primary rounded transition-colors"
            onClick={() => setCommandBarOpen(false)}
          >
            Settings
          </Link>

          <div className="px-4 py-2 mt-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
            Quick Actions
          </div>
          <Link 
            href="/projects" 
            className="px-4 py-2 text-text-secondary hover:bg-border hover:text-primary rounded transition-colors"
            onClick={() => setCommandBarOpen(false)}
          >
            Create Test
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-text-secondary hover:bg-border hover:text-primary rounded transition-colors"
            onClick={() => setCommandBarOpen(false)}
          >
            View Active Tests
          </Link>
        </div>
      </div>
    </div>
  );
}
