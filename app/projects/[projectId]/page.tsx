"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectById, getTests } from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { AlertCircle } from "lucide-react";
import type { Test } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ["project", params.projectId],
    queryFn: () => getProjectById(params.projectId),
  });

  const { data: tests, isLoading: isTestsLoading, error: testsError } = useQuery({
    queryKey: ["tests", params.projectId],
    queryFn: async () => {
      
      return getTests(params.projectId);
      
    },
  });

  if (isProjectLoading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="p-6">
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-danger font-medium">Failed to load project</h3>
            <p className="text-danger/80 text-sm mt-1">{(projectError as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* A. Project Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{project?.name || "Project Name"}</h1>
            <p className="text-text-secondary mt-1">{project?.description || "Description unavailable"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge 
              status={project?.healthStatus === "healthy" ? "completed" : project?.healthStatus === "failing" ? "failed" : "running"} 
              showDot={false} 
            />
            <span className="text-sm text-text-muted">Failure rate: {project?.failureRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* B. Environment Cards */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Environments</h2>
        {!project?.environments || project.environments.length === 0 ? (
          <div className="text-sm text-text-muted">No environments configured.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.environments.map((env) => (
              <div key={env.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-text-primary">{env.name}</h3>
                  <span className="text-xs bg-surface text-text-secondary px-2 py-1 rounded capitalize">{env.type}</span>
                </div>
                <div className="space-y-2 text-sm max-w-full truncate">
                  {env.services?.backendUrl && (
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Backend:</span><span className="text-text-secondary truncate">{env.services.backendUrl}</span></div>
                  )}
                  {env.services?.frontendUrl && (
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Frontend:</span><span className="text-text-secondary truncate">{env.services.frontendUrl}</span></div>
                  )}
                  {env.services?.deviceId && (
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Device:</span><span className="text-text-secondary truncate">{env.services.deviceId}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C. Test History Table */}
      <div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Test History</h2>
          <button 
            onClick={() => router.push(`/projects/${params.projectId}/tests`)}
            className="bg-primary/20 text-primary border border-primary hover:bg-primary/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Create New Test
          </button>
        </div>

        {testsError ? (
          <div className="bg-warning/10 border border-warning p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-warning font-medium">Backend integration pending</h3>
              <p className="text-warning/80 text-sm mt-1">{(testsError as Error).message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <DataTable
              columns={[
                { key: "name", label: "Name", render: (t: Test) => <span className="font-medium">{t.name}</span> },
                { key: "target", label: "Target", className: "capitalize" },
                { key: "fault", label: "Fault", className: "capitalize" },
                { key: "status", label: "Status", render: (t: Test) => <StatusBadge status={t.status} /> },
                { key: "duration", label: "Duration", render: (t: Test) => t.duration ? `${t.duration}s` : "—" },
                { key: "startTime", label: "Started At", render: (t: Test) => t.startTime ? new Date(t.startTime).toLocaleString() : "—" }
              ]}
              data={tests || []}
              loading={isTestsLoading}
              onRowClick={(item) => router.push(`/test/${item.id}/live`)}
              emptyMessage="No tests found for this project."
            />
          </div>
        )}
      </div>
    </div>
  );
}
