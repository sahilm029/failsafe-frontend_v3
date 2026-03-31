"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks";
import { DataTable, SkeletonTable } from "@/components/shared";
import type { Column } from "@/components/shared/DataTable";
import type { Project } from "@/lib/types";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";

// Color constants
const COLORS = {
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
  muted: "#6B7280",
  teal: "#14B8A6",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  // Filter projects by search (Name column only)
  const filteredProjects = (projects ?? []).filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this project? This action cannot be undone.")) {
      deleteProject.mutate(id);
    }
  };

  // Get health status based on failure rate
  const getHealthStatus = (failureRate?: number): { label: string; color: string } => {
    if (failureRate === undefined) return { label: "Unknown", color: COLORS.muted };
    if (failureRate < 5) return { label: "Healthy", color: COLORS.green };
    if (failureRate < 20) return { label: "Degraded", color: COLORS.amber };
    return { label: "Critical", color: COLORS.red };
  };

  // Get failure rate color
  const getFailureRateColor = (rate?: number): string => {
    if (rate === undefined || rate === 0) return COLORS.green;
    if (rate <= 20) return COLORS.amber;
    return COLORS.red;
  };

  // Format relative time using date-fns
  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return "Never";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const columns: Column<Project>[] = [
    {
      key: "name",
      label: "Name",
      render: (project) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/projects/${project.id}`);
          }}
          className="text-left group"
        >
          <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
            {project.name}
          </span>
          {project.description && (
            <p className="text-xs text-text-muted truncate max-w-xs">
              {project.description}
            </p>
          )}
        </button>
      ),
    },
    {
      key: "environments",
      label: "Environments",
      render: (project) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-surface rounded text-xs font-medium text-text-secondary">
          {project.environments?.length ?? 0}
        </span>
      ),
    },
    {
      key: "lastRun",
      label: "Last Run",
      render: (project) => (
        <span className="text-text-secondary text-sm">
          {formatRelativeTime(project.lastRun)}
        </span>
      ),
    },
    {
      key: "failureRate",
      label: "Failure Rate",
      render: (project) => {
        const rate = project.failureRate;
        const color = getFailureRateColor(rate);
        return (
          <span className="text-sm font-medium" style={{ color }}>
            {rate !== undefined ? `${rate}%` : "—"}
          </span>
        );
      },
    },
    {
      key: "health",
      label: "Health",
      render: (project) => {
        const health = getHealthStatus(project.failureRate);
        return (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: health.color }}
            />
            <span className="text-sm" style={{ color: health.color }}>
              {health.label}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (project) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/projects/${project.id}`);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded transition-colors hover:bg-primary/10"
            style={{ color: COLORS.teal }}
          >
            View
          </button>
          <button
            onClick={(e) => handleDelete(project.id, e)}
            className="p-1.5 rounded hover:bg-danger/10 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  // Check if we have projects at all
  const hasProjects = (projects ?? []).length > 0;
  const hasFilteredProjects = filteredProjects.length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search - only show if there are projects */}
      {hasProjects && (
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-2 bg-card border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : !hasProjects ? (
        // Empty state - no projects at all
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No projects yet
          </h3>
          <p className="text-text-secondary text-sm mb-6 max-w-sm">
            Create your first project to start running chaos tests
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        </div>
      ) : !hasFilteredProjects ? (
        // Empty state - search returned nothing
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm">
            No projects match your search
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredProjects}
            onRowClick={(project) => router.push(`/projects/${project.id}`)}
            emptyMessage="No projects found"
          />
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Create Project
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="My Project"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createProject.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors disabled:opacity-50"
            >
              {createProject.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
