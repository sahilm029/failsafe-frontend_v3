import type {
  ApiError,
  CreateProjectRequest,
  CreateEnvironmentRequest,
  CreateTestRequest,
  DashboardStats,
  Environment,
  FaultSchema,
  LogEntry,
  LogFilters,
  MetricPoint,
  MetricsParams,
  Project,
  Test,
  TestResult,
  SlackSettings,
  EmailSettings,
  AuthSession,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `API error: ${response.status}`
      ) as ApiError & Error;
      error.name = "ApiError";
      (error as unknown as ApiError).statusCode = response.status;
      (error as unknown as ApiError).details = errorData;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if ((error as Error).name === "ApiError") {
      throw error;
    }
    // Network error or other failure
    const apiError = new Error(
      "Network error or server unavailable"
    ) as ApiError & Error;
    apiError.name = "ApiError";
    (apiError as unknown as ApiError).statusCode = 0;
    throw apiError;
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  return fetchAPI<Project[]>("/projects");
}

export async function createProject(
  data: CreateProjectRequest
): Promise<Project> {
  return fetchAPI<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProject(id: string): Promise<Project> {
  return fetchAPI<Project>(`/projects/${id}`);
}

export async function deleteProject(id: string): Promise<void> {
  return fetchAPI<void>(`/projects/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// ENVIRONMENTS
// ============================================================================

export async function getEnvironments(projectId: string): Promise<Environment[]> {
  return fetchAPI<Environment[]>(`/projects/${projectId}/environments`);
}

export async function createEnvironment(
  projectId: string,
  data: CreateEnvironmentRequest
): Promise<Environment> {
  return fetchAPI<Environment>(`/projects/${projectId}/environments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEnvironment(
  id: string,
  data: Partial<CreateEnvironmentRequest>
): Promise<Environment> {
  return fetchAPI<Environment>(`/environments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEnvironment(id: string): Promise<void> {
  return fetchAPI<void>(`/environments/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// TESTS
// ============================================================================

export async function getTests(projectId: string): Promise<Test[]> {
  return fetchAPI<Test[]>(`/projects/${projectId}/tests`);
}

export async function createTest(
  projectId: string,
  data: CreateTestRequest
): Promise<Test> {
  return fetchAPI<Test>(`/projects/${projectId}/tests`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function runTest(id: string): Promise<void> {
  return fetchAPI<void>(`/tests/${id}/run`, {
    method: "POST",
  });
}

export async function stopTest(id: string): Promise<void> {
  return fetchAPI<void>(`/tests/${id}/stop`, {
    method: "POST",
  });
}

export async function restartTest(id: string): Promise<void> {
  return fetchAPI<void>(`/tests/${id}/restart`, {
    method: "POST",
  });
}

export async function deleteTest(id: string): Promise<void> {
  return fetchAPI<void>(`/tests/${id}`, {
    method: "DELETE",
  });
}

export async function getTestResult(id: string): Promise<TestResult> {
  return fetchAPI<TestResult>(`/tests/${id}/result`);
}

// ============================================================================
// LOGS & METRICS
// ============================================================================

export async function getTestLogs(
  id: string,
  filters?: LogFilters
): Promise<{ logs: LogEntry[]; total: number }> {
  const params = new URLSearchParams();

  if (filters?.service?.length) {
    params.append("service", filters.service.join(","));
  }
  if (filters?.level?.length) {
    params.append("level", filters.level.join(","));
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }
  if (filters?.from) {
    params.append("from", filters.from.toString());
  }
  if (filters?.to) {
    params.append("to", filters.to.toString());
  }
  if (filters?.page) {
    params.append("page", filters.page.toString());
  }

  const queryString = params.toString();
  return fetchAPI<{ logs: LogEntry[]; total: number }>(
    `/tests/${id}/logs${queryString ? `?${queryString}` : ""}`
  );
}

export async function getTestMetrics(
  id: string,
  params?: MetricsParams
): Promise<MetricPoint[]> {
  const searchParams = new URLSearchParams();

  if (params?.window) {
    searchParams.append("window", params.window);
  }
  if (params?.type) {
    searchParams.append("type", params.type);
  }
  if (params?.from) {
    searchParams.append("from", params.from.toString());
  }
  if (params?.to) {
    searchParams.append("to", params.to.toString());
  }

  const queryString = searchParams.toString();
  return fetchAPI<MetricPoint[]>(
    `/tests/${id}/metrics${queryString ? `?${queryString}` : ""}`
  );
}

export async function exportTestPDF(id: string): Promise<Blob> {
  const url = `${API_BASE_URL}/tests/${id}/export/pdf`;
  const response = await fetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to export PDF");
  }

  return response.blob();
}

// ============================================================================
// FAULT SCHEMA
// ============================================================================

export async function getFaultSchema(faultType: string): Promise<FaultSchema> {
  return fetchAPI<FaultSchema>(`/fault-schema/${faultType}`);
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>("/stats");
}

export async function rerunLastTest(): Promise<void> {
  return fetchAPI<void>("/tests/rerun/last", {
    method: "POST",
  });
}

// ============================================================================
// SETTINGS - INTEGRATIONS
// ============================================================================

export async function saveSlackSettings(data: SlackSettings): Promise<void> {
  return fetchAPI<void>("/settings/slack", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testSlackNotification(): Promise<void> {
  return fetchAPI<void>("/settings/slack/test", {
    method: "POST",
  });
}

export async function saveEmailSettings(data: EmailSettings): Promise<void> {
  return fetchAPI<void>("/settings/email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testEmailNotification(): Promise<void> {
  return fetchAPI<void>("/settings/email/test", {
    method: "POST",
  });
}

// ============================================================================
// SETTINGS - AUTH
// ============================================================================

export async function getSessions(): Promise<AuthSession[]> {
  return fetchAPI<AuthSession[]>("/auth/sessions");
}

export async function revokeSession(id: string): Promise<void> {
  return fetchAPI<void>(`/auth/sessions/${id}`, {
    method: "DELETE",
  });
}
