"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProject, useDeleteProject } from "@/hooks";
import { MetricCard, SkeletonCard, SkeletonTable } from "@/components/shared";
import { METRIC_COLORS } from "@/lib/constants";
import {
  Pencil1Icon,
  TrashIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    if (confirm("Delete this project? This action cannot be undone.")) {
      deleteProject.mutate(projectId, {
        onSuccess: () => router.push("/projects"),
      });
    }
  };

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getFailureRateColor = (rate?: number) => {
    if (rate === undefined) return METRIC_COLORS.memory;
    if (rate < 5) return METRIC_COLORS.throughput;
    if (rate < 20) return METRIC_COLORS.cpu;
    return METRIC_COLORS.errors;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
        <SkeletonCard />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={3} columns={4} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
        <div className="text-center py-16">
          <p className="text-text-secondary">Project not found</p>
          <Link href="/projects" className="text-primary hover:text-primary-hover mt-2 inline-block">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-text-secondary mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3 py-2 bg-card hover:bg-card/80 text-text-primary rounded border border-border transition-colors">
            <Pencil1Icon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded border border-danger/20 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Environments"
          value={project.environments?.length ?? 0}
          color={METRIC_COLORS.memory}
        />
        <MetricCard
          label="Last Test Run"
          value={formatRelativeTime(project.lastRun)}
          color={METRIC_COLORS.latency}
        />
        <MetricCard
          label="Failure Rate"
          value={project.failureRate !== undefined ? project.failureRate : "—"}
          unit={project.failureRate !== undefined ? "%" : ""}
          color={getFailureRateColor(project.failureRate)}
        />
      </div>

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Link
          href={`/projects/${projectId}/environments`}
          className="w-full sm:w-auto text-center px-4 py-2 bg-card hover:bg-card/80 text-text-primary rounded border border-border transition-colors"
        >
          Manage Environments
        </Link>
        <Link
          href={`/projects/${projectId}/tests`}
          className="w-full sm:w-auto text-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded transition-colors"
        >
          View Tests
        </Link>
        <Link
          href={`/projects/${projectId}/results`}
          className="w-full sm:w-auto text-center px-4 py-2 bg-card hover:bg-card/80 text-text-primary rounded border border-border transition-colors"
        >
          View Results
        </Link>
      </div>

      {/* Environments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Environments
          </h2>
          <Link
            href={`/projects/${projectId}/environments`}
            className="text-sm text-primary hover:text-primary-hover"
          >
            Manage →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.environments?.map((env) => (
            <EnvironmentCard key={env.id} environment={env} />
          ))}
          <Link
            href={`/projects/${projectId}/environments`}
            className="flex items-center justify-center gap-2 p-4 sm:p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors text-text-muted hover:text-primary"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Environment</span>
          </Link>
        </div>
      </div>

      {/* Test History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Recent Tests
          </h2>
          <Link
            href={`/projects/${projectId}/tests`}
            className="text-sm text-primary hover:text-primary-hover"
          >
            View All →
          </Link>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Test</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td colSpan={5} className="px-4 py-8 text-text-muted">
                  No recent tests
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnvironmentCard({ environment }: { environment: { id: string; name: string; type: string; services: { backendUrl?: string; frontendUrl?: string; deviceId?: string } } }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const getTypeBadge = () => {
    const colors = {
      backend: "bg-secondary/20 text-secondary",
      frontend: "bg-info/20 text-info",
      android: "bg-warning/20 text-warning",
    };
    return colors[environment.type as keyof typeof colors] || "bg-text-muted/20 text-text-muted";
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-text-primary">{environment.name}</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge()}`}>
          {environment.type}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        {environment.services.backendUrl && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted truncate flex-1">
              {environment.services.backendUrl}
            </span>
            <button
              onClick={() => copyToClipboard(environment.services.backendUrl!, "backend")}
              className="p-1 hover:bg-surface rounded"
            >
              {copied === "backend" ? (
                <CheckIcon className="w-3.5 h-3.5 text-success" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-text-muted" />
              )}
            </button>
          </div>
        )}
        {environment.services.frontendUrl && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted truncate flex-1">
              {environment.services.frontendUrl}
            </span>
            <button
              onClick={() => copyToClipboard(environment.services.frontendUrl!, "frontend")}
              className="p-1 hover:bg-surface rounded"
            >
              {copied === "frontend" ? (
                <CheckIcon className="w-3.5 h-3.5 text-success" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-text-muted" />
              )}
            </button>
          </div>
        )}
        {environment.services.deviceId && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Device: {environment.services.deviceId}</span>
            <button
              onClick={() => copyToClipboard(environment.services.deviceId!, "device")}
              className="p-1 hover:bg-surface rounded"
            >
              {copied === "device" ? (
                <CheckIcon className="w-3.5 h-3.5 text-success" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-text-muted" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
