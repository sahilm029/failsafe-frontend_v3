"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEnvironments, createEnvironment, updateEnvironment, deleteEnvironment } from "@/lib/api";
import type { Environment, TargetType } from "@/lib/types";
import { SkeletonCard } from "@/components/shared";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

export default function EnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [filter, setFilter] = useState<TargetType | "all">("all");
  const [showSheet, setShowSheet] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const { data: environments, isLoading } = useQuery({
    queryKey: ["environments", projectId],
    queryFn: () => getEnvironments(projectId),
  });

  const filteredEnvs = (environments ?? []).filter(
    (env) => filter === "all" || env.type === filter
  );

  const handleEdit = (env: Environment) => {
    setEditingEnv(env);
    setShowSheet(true);
  };

  const handleCreate = () => {
    setEditingEnv(null);
    setShowSheet(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Environments
        </h1>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Environment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "backend", "frontend", "android"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === type
                ? "bg-primary text-primary-foreground"
                : "bg-card text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Environments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredEnvs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">No environments found</p>
          <button
            onClick={handleCreate}
            className="text-primary hover:text-primary-hover"
          >
            Create your first environment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnvs.map((env) => (
            <EnvironmentCard
              key={env.id}
              environment={env}
              onEdit={() => handleEdit(env)}
            />
          ))}
        </div>
      )}

      {/* Sheet */}
      {showSheet && (
        <EnvironmentSheet
          projectId={projectId}
          environment={editingEnv}
          onClose={() => {
            setShowSheet(false);
            setEditingEnv(null);
          }}
        />
      )}
    </div>
  );
}

function EnvironmentCard({
  environment,
  onEdit,
}: {
  environment: Environment;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteEnvironment(environment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments"] });
      toast.success("Environment deleted");
    },
    onError: () => toast.error("Failed to delete environment"),
  });

  const handleDelete = () => {
    if (confirm("Delete this environment?")) {
      deleteMutation.mutate();
    }
  };

  const getTypeBadge = () => {
    const colors = {
      backend: "bg-secondary/20 text-secondary",
      frontend: "bg-info/20 text-info",
      android: "bg-warning/20 text-warning",
    };
    return colors[environment.type] || "bg-text-muted/20 text-text-muted";
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-text-primary">{environment.name}</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge()}`}>
          {environment.type}
        </span>
      </div>
      <div className="space-y-2 text-sm mb-4">
        {environment.services.backendUrl && (
          <p className="text-text-muted truncate">
            Backend: {environment.services.backendUrl}
          </p>
        )}
        {environment.services.frontendUrl && (
          <p className="text-text-muted truncate">
            Frontend: {environment.services.frontendUrl}
          </p>
        )}
        {environment.services.deviceId && (
          <p className="text-text-muted">
            Device: {environment.services.deviceId}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface/80 rounded text-sm text-text-secondary transition-colors"
        >
          <Pencil1Icon className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center justify-center px-3 py-1.5 bg-danger/10 hover:bg-danger/20 rounded text-sm text-danger transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function EnvironmentSheet({
  projectId,
  environment,
  onClose,
}: {
  projectId: string;
  environment: Environment | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(environment?.name || "");
  const [type, setType] = useState<TargetType>(environment?.type || "backend");
  const [backendUrl, setBackendUrl] = useState(environment?.services.backendUrl || "");
  const [frontendUrl, setFrontendUrl] = useState(environment?.services.frontendUrl || "");
  const [deviceId, setDeviceId] = useState(environment?.services.deviceId || "");

  const createMutation = useMutation({
    mutationFn: () =>
      createEnvironment(projectId, {
        name,
        type,
        services: {
          backendUrl: backendUrl || undefined,
          frontendUrl: frontendUrl || undefined,
          deviceId: deviceId || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment created");
      onClose();
    },
    onError: () => toast.error("Failed to create environment"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateEnvironment(environment!.id, {
        name,
        type,
        services: {
          backendUrl: backendUrl || undefined,
          frontendUrl: frontendUrl || undefined,
          deviceId: deviceId || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment updated");
      onClose();
    },
    onError: () => toast.error("Failed to update environment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (environment) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/50 absolute inset-0" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface border-l border-border h-full overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              {environment ? "Edit Environment" : "Add Environment"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-card rounded">
              <Cross2Icon className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Environment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TargetType)}
                className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
                <option value="android">Android</option>
              </select>
            </div>

            {(type === "backend" || type === "frontend") && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Backend Base URL
                </label>
                <input
                  type="url"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {type === "frontend" && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Frontend URL
                </label>
                <input
                  type="url"
                  value={frontendUrl}
                  onChange={(e) => setFrontendUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {type === "android" && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Device/Emulator ID *
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="emulator-5554"
                  className="w-full px-3 py-2 bg-card border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  required={type === "android"}
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={!name.trim() || isPending}
                className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : environment ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
