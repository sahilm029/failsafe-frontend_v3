"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTests, useCreateTest, useRunTest, useDeleteTest } from "@/hooks";
import { DataTable, StatusBadge, SkeletonTable } from "@/components/shared";
import type { Column } from "@/components/shared/DataTable";
import type { Test, TargetType, FaultType } from "@/lib/types";
import { FAULT_TYPES_BY_TARGET } from "@/lib/constants";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Templates
const TEMPLATES = [
  {
    id: "latency-spike",
    name: "API Latency Spike",
    target: "backend" as TargetType,
    fault: "latency" as FaultType,
    params: { value: "3000ms", duration: "60s" },
  },
  {
    id: "frontend-crash",
    name: "Frontend Crash Sim",
    target: "frontend" as TargetType,
    fault: "ui" as FaultType,
    params: { simulation: "crash", duration: "30s" },
  },
  {
    id: "android-anr",
    name: "Android ANR Trigger",
    target: "android" as TargetType,
    fault: "android" as FaultType,
    params: { type: "ANR", duration: "30s" },
  },
  {
    id: "cpu-stress",
    name: "CPU Stress Test",
    target: "backend" as TargetType,
    fault: "cpu" as FaultType,
    params: { intensity: "90%", duration: "120s" },
  },
  {
    id: "memory-exhaust",
    name: "Memory Exhaustion",
    target: "backend" as TargetType,
    fault: "memory" as FaultType,
    params: { intensity: "85%", duration: "90s" },
  },
];

export default function TestsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "existing">("create");

  const { data: tests, isLoading } = useTests(projectId);
  const runTest = useRunTest();
  const deleteTest = useDeleteTest(projectId);

  const handleRun = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runTest.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this test?")) {
      deleteTest.mutate(id);
    }
  };

  const columns: Column<Test>[] = [
    {
      key: "name",
      label: "Name",
      render: (test) => (
        <span className="font-medium text-text-primary">{test.name}</span>
      ),
    },
    {
      key: "target",
      label: "Target",
      render: (test) => {
        const colors = {
          backend: "bg-secondary/20 text-secondary",
          frontend: "bg-info/20 text-info",
          android: "bg-warning/20 text-warning",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${colors[test.target]}`}
          >
            {test.target}
          </span>
        );
      },
    },
    {
      key: "fault",
      label: "Fault",
      render: (test) => (
        <span className="text-text-secondary">{test.fault}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (test) => <StatusBadge status={test.status} showDot />,
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (test) => (
        <span className="text-text-secondary text-sm">
          {formatDistanceToNow(new Date(test.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (test) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleRun(test.id, e)}
            className="px-2.5 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Run
          </button>
          <button
            onClick={(e) => handleDelete(test.id, e)}
            className="p-1.5 rounded hover:bg-danger/10 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Tests</h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 bg-surface p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === "create"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Create Test
        </button>
        <button
          onClick={() => setActiveTab("existing")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === "existing"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Existing Tests
        </button>
      </div>

      {activeTab === "create" ? (
        <CreateTestPanel projectId={projectId} />
      ) : isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <DataTable
          columns={columns}
          data={tests ?? []}
          onRowClick={(test) => router.push(`/test/${test.id}/live`)}
          emptyMessage="No tests yet. Switch to Create Test tab to create one."
        />
      )}
    </div>
  );
}

function CreateTestPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const createTest = useCreateTest(projectId);

  // Form state
  const [name, setName] = useState("");
  const [target, setTarget] = useState<TargetType | null>(null);
  const [fault, setFault] = useState<FaultType | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Parameters based on fault type
  const [params, setParams] = useState<Record<string, string>>({});

  // Steps for advanced multi-fault
  const [steps, setSteps] = useState<
    Array<{ fault: FaultType; parameters: Record<string, string> }>
  >([]);

  // Available faults for selected target
  const availableFaults = target ? FAULT_TYPES_BY_TARGET[target] : [];

  // Handle target selection
  const handleTargetSelect = (t: TargetType) => {
    setTarget(t);
    setFault(null);
    setParams({});
    setSelectedTemplate(null);
  };

  // Handle fault selection
  const handleFaultSelect = (f: FaultType) => {
    setFault(f);
    setParams({});
  };

  // Apply template
  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(template.id);
    setTarget(template.target);
    setFault(template.fault);
    // Filter out undefined values from params
    const cleanParams: Record<string, string> = {};
    for (const [key, val] of Object.entries(template.params)) {
      if (val !== undefined) {
        cleanParams[key] = val;
      }
    }
    setParams(cleanParams);
    setName(template.name);
    toast.success(`Template "${template.name}" applied`);
  };

  // Get parameter fields based on fault type
  const getParameterFields = () => {
    if (!fault) return null;

    switch (fault) {
      case "latency":
        return (
          <>
            <div>
              <label className="block text-xs text-text-muted mb-1">Value</label>
              <input
                type="text"
                value={params.value || ""}
                onChange={(e) => setParams({ ...params, value: e.target.value })}
                placeholder="3000ms"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Duration
              </label>
              <input
                type="text"
                value={params.duration || ""}
                onChange={(e) =>
                  setParams({ ...params, duration: e.target.value })
                }
                placeholder="60s"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        );
      case "cpu":
      case "memory":
        return (
          <>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Intensity
              </label>
              <input
                type="text"
                value={params.intensity || ""}
                onChange={(e) =>
                  setParams({ ...params, intensity: e.target.value })
                }
                placeholder="85%"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Duration
              </label>
              <input
                type="text"
                value={params.duration || ""}
                onChange={(e) =>
                  setParams({ ...params, duration: e.target.value })
                }
                placeholder="120s"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        );
      case "network":
        return (
          <>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Packet Loss
              </label>
              <input
                type="text"
                value={params.packetLoss || ""}
                onChange={(e) =>
                  setParams({ ...params, packetLoss: e.target.value })
                }
                placeholder="30%"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Duration
              </label>
              <input
                type="text"
                value={params.duration || ""}
                onChange={(e) =>
                  setParams({ ...params, duration: e.target.value })
                }
                placeholder="60s"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        );
      case "ui":
        return (
          <>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Simulation Type
              </label>
              <select
                value={params.simulation || ""}
                onChange={(e) =>
                  setParams({ ...params, simulation: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select type...</option>
                <option value="crash">Crash</option>
                <option value="freeze">Freeze</option>
                <option value="blank">Blank Screen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Duration
              </label>
              <input
                type="text"
                value={params.duration || ""}
                onChange={(e) =>
                  setParams({ ...params, duration: e.target.value })
                }
                placeholder="30s"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        );
      case "android":
        return (
          <>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Fault Type
              </label>
              <select
                value={params.type || ""}
                onChange={(e) => setParams({ ...params, type: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select type...</option>
                <option value="ANR">ANR (App Not Responding)</option>
                <option value="crash">Force Crash</option>
                <option value="OOM">Out of Memory</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Duration
              </label>
              <input
                type="text"
                value={params.duration || ""}
                onChange={(e) =>
                  setParams({ ...params, duration: e.target.value })
                }
                placeholder="30s"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Add step to steps array
  const addStep = (stepFault: FaultType, stepParams: Record<string, string>) => {
    setSteps([...steps, { fault: stepFault, parameters: stepParams }]);
  };

  // Remove step
  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Build payload for JSON preview
  const payload = useMemo(() => {
    const obj: Record<string, unknown> = {
      name: name || "Untitled Test",
    };
    if (target) obj.target = target;
    if (fault) obj.fault = fault;
    if (Object.keys(params).length > 0) {
      obj.parameters = params;
    }
    if (steps.length > 0) {
      obj.steps = steps;
    }
    return obj;
  }, [name, target, fault, params, steps]);

  // Handle submit
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a test name");
      return;
    }
    if (!target) {
      toast.error("Please select a target system");
      return;
    }
    if (!fault) {
      toast.error("Please select a fault type");
      return;
    }

    createTest.mutate(
      {
        name: name.trim(),
        target,
        fault,
        parameters: params,
        steps: steps.length > 0 ? steps.map((s) => ({ ...s, delayMs: 0 })) : undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Test created successfully");
          router.push(`/test/${data.id}/live`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Quick Templates
        </h3>
        <div className="flex flex-wrap gap-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                selectedTemplate === template.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-text-primary hover:border-primary/50"
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Split Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL - Form (55%) */}
        <div className="flex-1 lg:w-[55%] bg-card rounded-lg border border-border p-4 sm:p-6 space-y-6">
          {/* Step 1: Target System */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Step 1 — Target System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["backend", "frontend", "android"] as TargetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTargetSelect(t)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    target === t
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      target === t ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Fault Type */}
          {target && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Step 2 — Fault Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableFaults.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFaultSelect(f)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      fault === f
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        fault === f ? "text-primary" : "text-text-primary"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Parameters */}
          {fault && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Step 3 — Parameters
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{getParameterFields()}</div>
            </div>
          )}

          {/* Step 4: Advanced (collapsible) */}
          {fault && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                {showAdvanced ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
                Step 4 — Advanced (Multi-step faults)
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-surface rounded-lg border border-border">
                  <p className="text-xs text-text-muted mb-3">
                    Add additional fault steps to create a sequence of faults.
                  </p>

                  {/* Existing steps */}
                  {steps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-card rounded border border-border"
                        >
                          <span className="text-xs text-text-primary">
                            {step.fault}
                          </span>
                          <button
                            onClick={() => removeStep(index)}
                            className="text-text-muted hover:text-danger"
                          >
                            <Cross2Icon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (fault && Object.keys(params).length > 0) {
                        addStep(fault, { ...params });
                        toast.success("Step added");
                      } else {
                        toast.error("Configure current fault parameters first");
                      }
                    }}
                    className="text-xs text-primary hover:text-primary-hover"
                  >
                    + Add current fault as step
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Name + Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Step 5 — Test Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter test name..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="rounded border-border bg-background"
              />
              <span className="text-sm text-text-secondary">
                Save as template
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={createTest.isPending || !name || !target || !fault}
            className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTest.isPending ? "Creating..." : "Create Test"}
          </button>
        </div>

        {/* RIGHT PANEL - JSON Preview (45%) */}
        <div className="lg:w-[45%] lg:sticky lg:top-6 h-fit">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs text-text-muted font-medium">
                Payload Preview
              </span>
            </div>
            <div className="p-4">
              <JSONPreview data={payload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// JSON Preview with syntax highlighting
function JSONPreview({ data }: { data: Record<string, unknown> }) {
  const formatValue = (value: unknown, indent: number = 0): React.ReactNode => {
    const indentStr = "  ".repeat(indent);

    if (value === null) {
      return <span style={{ color: "#F59E0B" }}>null</span>;
    }

    if (typeof value === "boolean") {
      return <span style={{ color: "#F59E0B" }}>{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span style={{ color: "#38BDF8" }}>{value}</span>;
    }

    if (typeof value === "string") {
      return <span style={{ color: "#22C55E" }}>&quot;{value}&quot;</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span>[]</span>;
      }
      return (
        <>
          {"[\n"}
          {value.map((item, i) => (
            <span key={i}>
              {indentStr}  {formatValue(item, indent + 1)}
              {i < value.length - 1 ? "," : ""}
              {"\n"}
            </span>
          ))}
          {indentStr}]
        </>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return <span>{"{}"}</span>;
      }
      return (
        <>
          {"{\n"}
          {entries.map(([key, val], i) => (
            <span key={key}>
              {indentStr}  <span style={{ color: "#9CA3AF" }}>&quot;{key}&quot;</span>
              {": "}
              {formatValue(val, indent + 1)}
              {i < entries.length - 1 ? "," : ""}
              {"\n"}
            </span>
          ))}
          {indentStr}
          {"}"}
        </>
      );
    }

    return String(value);
  };

  return (
    <pre
      className="text-sm font-mono overflow-x-auto text-text-primary"
      style={{ lineHeight: 1.6 }}
    >
      {formatValue(data)}
    </pre>
  );
}
