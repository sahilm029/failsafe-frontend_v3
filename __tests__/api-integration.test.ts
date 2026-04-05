import {
  getHealth,
  getScenarioPresets,
  startBackendExperiment,
  getExperimentStatus,
  stopExperiment,
  getExperimentMetrics,
} from "../lib/api";

// We run sequentially since starting/stopping might collide if done randomly.
// Using a globally unique generated test ID to prevent cross-contamination.

const testId = `integration-test-${Date.now()}`;

describe("API Integration Tests against localhost:8000", () => {
  beforeAll(() => {
    // Force BASE_URL for tests if needed, though they default to localhost:8000.
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
  });

  describe("Global Endpoints", () => {
    it("/health returns valid status", async () => {
      const result = await getHealth();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(typeof result.status).toBe("string");
    });

    it("/scenarios/presets returns an object", async () => {
      const presets = await getScenarioPresets();
      expect(presets).toHaveProperty("available_presets");
    });
  });

  describe("Backend Experiment Lifecycle", () => {
    const config = {
      targetType: "docker",
      faultType: "cpu",
      targets: ["my-backend-service"],
      duration: 300,
    };
    let activeId: string;

    it("POST /experiments/backend/start initializes experiment", async () => {
      const result = await startBackendExperiment(config);
      expect(result).toBeDefined();
      // Even if mock API returns something, we verify we get an object with id
      expect(result.id).toBeDefined();
      activeId = result.id;
    });

    it("GET /experiments/backend/status returns test structure", async () => {
      // Backend test runner uses the actual activeId returned
      const status = await getExperimentStatus("backend", activeId);
      expect(status).toBeDefined();
      // Status structure expects platform, status string, etc.
    });

    it("GET /experiments/backend/metrics returns metric object", async () => {
      const metrics = await getExperimentMetrics("backend", activeId);
      expect(typeof metrics).toBe("object");
      expect(Array.isArray(metrics)).toBe(false);
    });

    it("POST /experiments/backend/stop halts experiment", async () => {
      await expect(stopExperiment("backend", activeId)).resolves.not.toThrow();
    });
  });
});
