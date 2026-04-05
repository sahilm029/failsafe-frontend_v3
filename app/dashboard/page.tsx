"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCard } from "@/components/shared/LoadingSkeleton";
import { AlertCircle, Activity, Box, Filter, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const handleCreateProject = () => {
    // TODO: Backend gap — missing endpoint POST /projects
    console.warn("Backend gap: POST /projects not yet implemented");
    alert("Project creation requires backend support (awaiting integration).");
  };

  const filteredProjects = projects?.filter(p => {
    const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesStatus = statusFilter ? p.healthStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalProjects = projects?.length || 0;
  const failingCount = projects?.filter(p => p.healthStatus === "failing").length || 0;
  const runningCount = projects?.filter(p => p.healthStatus === "degraded").length || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1 text-sm sm:text-base">System overview and project health status.</p>
        </div>
        <button 
          onClick={handleCreateProject}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors font-medium text-sm cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3 w-full">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-danger font-medium">Failed to load system state</h3>
            <p className="text-danger/80 text-sm mt-1">{(error as Error)?.message || "Unknown error"}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Global Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Box className="w-5 h-5 text-primary" />
                </div>
                <span className="text-text-secondary font-medium tracking-wide text-sm uppercase">Total Projects</span>
              </div>
              <p className="text-3xl font-bold text-text-primary ml-10">{totalProjects}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-warning/10 rounded-md">
                  <Activity className="w-5 h-5 text-warning" />
                </div>
                <span className="text-text-secondary font-medium tracking-wide text-sm uppercase">Degraded Projects</span>
              </div>
              <p className="text-3xl font-bold text-text-primary ml-10">{runningCount}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-danger/10 rounded-md">
                  <AlertCircle className="w-5 h-5 text-danger" />
                </div>
                <span className="text-text-secondary font-medium tracking-wide text-sm uppercase">Failing Projects</span>
              </div>
              <p className="text-3xl font-bold text-text-primary ml-10">{failingCount}</p>
            </div>
          </div>

          {/* 3. Project List Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-text-primary">All Projects</h2>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 bg-surface text-text-primary border border-border rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm placeholder:text-text-muted"
                />
              </div>
              <div className="relative w-36 sm:w-40 shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value.toLowerCase())}
                  className="w-full pl-9 pr-4 py-2 bg-surface text-text-primary border border-border rounded-md text-sm appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer shadow-sm hover:bg-surface-hover"
                >
                  <option value="">All Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="degraded">Degraded</option>
                  <option value="failing">Failing</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Project Cards */}
          {filteredProjects && filteredProjects.length === 0 ? (
             <div className="bg-surface/50 border border-dashed border-border rounded-lg p-12 text-center">
               <p className="text-text-secondary mb-2">No projects found matching the current filters.</p>
               {totalProjects === 0 && (
                 <button onClick={handleCreateProject} className="text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline text-sm">
                   Create your first project
                 </button>
               )}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
              {filteredProjects?.map((project: Project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow text-left flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-sm text-text-muted mt-1 w-full truncate">{project.description}</p>
                    </div>
                    <StatusBadge 
                      status={project.healthStatus === "healthy" ? "completed" : project.healthStatus === "failing" ? "failed" : "running"} 
                      showDot={true} 
                    />
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-end border-t border-border pt-4">
                      <div className="text-xs text-text-muted">
                        <span className="block mb-0.5">Failure Rate</span>
                        <span className="text-sm font-medium text-text-primary">{project.failureRate}%</span>
                      </div>
                      
                      <div className="text-xs text-text-muted">
                        <span className="block mb-0.5">Active Envs</span>
                        <span className="text-sm font-medium text-text-primary">{project.environments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    View Details <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
