"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, revokeSession } from "@/lib/api";
import { DataTable, SkeletonTable } from "@/components/shared";
import type { Column } from "@/components/shared/DataTable";
import type { AuthSession } from "@/lib/types";
import { toast } from "sonner";
import { TrashIcon } from "@radix-ui/react-icons";

export default function AuthSettingsPage() {
  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Authentication</h1>
      <LoginMethodsCard />
      <ActiveSessionsCard />
      <SecuritySettingsCard />
    </div>
  );
}

function LoginMethodsCard() {
  const [magicLink, setMagicLink] = useState(true);
  const [googleAuth, setGoogleAuth] = useState(false);
  const [githubAuth, setGithubAuth] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [githubClientId, setGithubClientId] = useState("");

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Login Methods</h2>
      <div className="space-y-4">
        {/* Magic Link */}
        <div className="flex items-center justify-between p-4 bg-surface rounded">
          <div>
            <h3 className="font-medium text-text-primary">Email Magic Link</h3>
            <p className="text-sm text-text-muted">Passwordless email authentication</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={magicLink}
              onChange={(e) => setMagicLink(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Google OAuth */}
        <div className="p-4 bg-surface rounded space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Google OAuth</h3>
              <p className="text-sm text-text-muted">Sign in with Google accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={googleAuth}
                onChange={(e) => setGoogleAuth(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {googleAuth && (
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="Google Client ID"
              className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* GitHub OAuth */}
        <div className="p-4 bg-surface rounded space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">GitHub OAuth</h3>
              <p className="text-sm text-text-muted">Sign in with GitHub accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={githubAuth}
                onChange={(e) => setGithubAuth(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {githubAuth && (
            <input
              type="text"
              value={githubClientId}
              onChange={(e) => setGithubClientId(e.target.value)}
              placeholder="GitHub Client ID"
              className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function ActiveSessionsCard() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session revoked");
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const columns: Column<AuthSession>[] = [
    { key: "device", label: "Device" },
    { key: "ip", label: "IP Address" },
    {
      key: "lastActive",
      label: "Last Active",
      render: (session) => (
        <span className="text-text-secondary">{formatLastActive(session.lastActive)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (session) => (
        <button
          onClick={() => {
            if (confirm("Revoke this session?")) {
              revokeMutation.mutate(session.id);
            }
          }}
          className="p-1.5 rounded hover:bg-danger/10 transition-colors"
          title="Revoke"
        >
          <TrashIcon className="w-4 h-4 text-danger" />
        </button>
      ),
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Active Sessions</h2>
      {isLoading ? (
        <SkeletonTable rows={3} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          data={sessions ?? []}
          emptyMessage="No active sessions"
        />
      )}
    </div>
  );
}

function SecuritySettingsCard() {
  const [sessionTimeout, setSessionTimeout] = useState("24h");

  const handleSave = () => {
    toast.success("Security settings saved");
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Security</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Session Timeout</label>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="w-full max-w-xs px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1h">1 hour</option>
            <option value="8h">8 hours</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors"
        >
          Save Security Settings
        </button>
      </div>
    </div>
  );
}
