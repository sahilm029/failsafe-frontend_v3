// BACKEND CONTRACT
// GET    /health                          → string "OK"
// POST   /upload/apk                      → { package: string, activity: string }
// POST   /experiments/backend/start       → { id: string }
// GET    /experiments/backend/status      → { status: string, ... }
// POST   /experiments/backend/stop        → void
// GET    /experiments/backend/metrics     → MetricPoint[]
// POST   /experiments/android/start       → { id: string }
// GET    /experiments/android/status      → { status: string, ... }
// POST   /experiments/android/stop        → void
// GET    /experiments/android/metrics     → MetricPoint[]
// POST   /experiments/frontend/start      → { id: string }
// GET    /experiments/frontend/status     → { status: string, ... }
// POST   /experiments/frontend/stop       → void
// GET    /experiments/frontend/metrics    → MetricPoint[]
// POST   /experiments/frontend/fault-command → void
// GET    /scenarios/presets               → Presets[]
// POST   /frontend/metrics                → void

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import type { Project, Test, MetricPoint, CreateTestRequest } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
      const errText = await response.text();
      console.error(`API response text:`, errText);
      throw new Error(`API error: ${response.status} ${errText}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function getHealth(): Promise<{ status: string }> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const text: any = await fetchAPI<string>("/health");
  return { status: typeof text === "string" ? text : "OK" };
}

export async function getScenarioPresets(): Promise<any[]> {
  return fetchAPI<any[]>("/scenarios/presets");
}

export async function startBackendExperiment(config: any): Promise<{ id: string }> {
  return fetchAPI<{ id: string }>("/experiments/backend/start", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function getExperimentStatus(platform: string, id: string): Promise<Test> {
  return fetchAPI<Test>(`/experiments/${platform}/status?id=${id}`);
}

export async function stopExperiment(platform: string, id: string): Promise<void> {
  return fetchAPI<void>(`/experiments/${platform}/stop?id=${id}`, {
    method: "POST",
  });
}

export async function getExperimentMetrics(platform: string, id: string): Promise<MetricPoint[]> {
  return fetchAPI<MetricPoint[]>(`/experiments/${platform}/metrics?id=${id}`);
}

// ==========================================
// GAP MODULES (Disabled or Mocked)
// ==========================================

// Mock Data to keep the UI functional until backend implements CRUD
const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "E-Commerce System",
    description: "Main monolith and microservices",
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000,
    status: "healthy",
  },
  {
    id: "proj-2",
    name: "Payment Gateway",
    description: "Stripe integration services",
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000,
    status: "degraded",
  },
];

export async function getProjects(): Promise<Project[]> { return MOCK_PROJECTS; }
export async function getProject(id: string): Promise<Project> { 
  const p = MOCK_PROJECTS.find(x => x.id === id);
  if (!p) throw new Error("Project not found");
  return p;
}
export async function getProjectById(id: string): Promise<Project> { 
  const p = MOCK_PROJECTS.find(x => x.id === id);
  if (!p) throw new Error("Project not found");
  return p;
}
export async function createProject(data: any): Promise<Project> { 
  const proj: Project = {
    id: `proj-${Date.now()}`,
    name: data.name || "New Project",
    description: data.description || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "healthy",
  };
  MOCK_PROJECTS.push(proj);
  return proj;
}
export async function deleteProject(id: string): Promise<void> { throw new Error("Backend endpoint not yet available"); }

const MOCK_TESTS: Test[] = [
  {
    id: "test-1234",
    projectId: "proj-1",
    name: "API Memory Leak Check",
    description: "Check memory consumption under load",
    status: "idle",
    targetId: "backend",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export async function getTests(projectId: string): Promise<Test[]> { return MOCK_TESTS.filter(t => t.projectId === projectId); }
export async function getTestById(id: string): Promise<Test> { 
  const p = MOCK_TESTS.find(x => x.id === id);
  if (!p) throw new Error(`Test ${id} not found`);
  
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`backendId_${id}`);
    if (stored) {
      p.backendId = stored;
    }
  }
  return p;
}
export async function createTest(projectId: string, data: CreateTestRequest): Promise<Test> { 
  const newTest: Test = {
    id: `test-${Date.now()}`,
    projectId,
    name: data.name,
    description: data.description || "",
    status: "idle",
    targetId: data.targetId || "backend",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  MOCK_TESTS.push(newTest);
  return newTest;
}

export async function runTest(id: string): Promise<void> { 
  const test = await getTestById(id);
  const platform = test.targetId.includes("android") ? "android" : (test.targetId.includes("frontend") ? "frontend" : "backend");

  const durationStr = String(test.parameters?.duration || "30");
  const valueStr = String(test.parameters?.value || "60");
  const parsedDur = parseInt(durationStr.replace(/\D/g, "")) || 30;
  const parsedVal = parseInt(valueStr.replace(/\D/g, "")) || 60;
  
  // If value was "3000", map to ~60 for backend intensity scaling
  const mappedIntensity = parsedVal > 100 ? Math.round(parsedVal / 50) : parsedVal;

  const startReq = {
    FaultType: test.fault || "latency",
    Targets: platform === "frontend" ? ["http://localhost:3000"] : (platform === "android" ? ["emulator-5554"] : ["failsafe-backend"]),
    TargetType: platform === "frontend" ? "frontend" : (platform === "android" ? "android" : "docker"),
      ObservedEndpoints: platform === "frontend" ? [] : (platform === "android" ? [] : ["http://127.0.0.1:8000/health"]),
    Duration: parsedDur,
    Adaptive: false,
    MaxIntensity: mappedIntensity,
  };

  const res = await fetchAPI<{ id: string }>(`/experiments/${platform}/start`, {
    method: "POST",
    body: JSON.stringify(startReq),
  });

  test.backendId = res.id;
  if (typeof window !== "undefined") {
    localStorage.setItem(`backendId_${id}`, res.id);
  }
  test.status = "running";
}

export async function stopTest(id: string): Promise<void> { 
  const test = await getTestById(id);
  const platform = test.targetId.includes("android") ? "android" : (test.targetId.includes("frontend") ? "frontend" : "backend");
  const backendId = test.backendId || id;

  await fetchAPI<void>(`/experiments/${platform}/stop?id=${backendId}`, {
    method: "POST",
  });

  test.status = "stopped";
}

export async function restartTest(id: string): Promise<void> { 
  await stopTest(id);
  await runTest(id);
}
export async function deleteTest(id: string): Promise<void> { throw new Error("Backend endpoint not yet available"); }

export async function getEnvironments(projectId: string): Promise<any[]> { return []; }
export async function createEnvironment(projectId: string, data?: any): Promise<any> { throw new Error("Backend endpoint not yet available"); }
export async function updateEnvironment(id: string, data?: any): Promise<any> { throw new Error("Backend endpoint not yet available"); }
export async function deleteEnvironment(id: string): Promise<void> { throw new Error("Backend endpoint not yet available"); }
