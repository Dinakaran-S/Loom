const request = require("supertest");
const jwt = require("jsonwebtoken");
const { ProviderError } = require("../src/utils/errors");

jest.mock("../src/services/providers/providerFactory");
jest.mock("../src/models/agentRun.model");
jest.mock("../src/services/credential.service", () => ({ getGroqKey: jest.fn().mockResolvedValue("") }));

const { getProvider } = require("../src/services/providers/providerFactory");
const agentRunModel = require("../src/models/agentRun.model");
const app = require("../app");

function authHeader(userId = "user-1") {
  const token = jwt.sign({ id: userId, role: "user" }, "test-access-secret", { expiresIn: "10m" });
  return `Bearer ${token}`;
}

describe("Agent generation", () => {
  afterEach(() => jest.clearAllMocks());

  test("rejects requests with no auth token", async () => {
    const res = await request(app)
      .post("/api/agents/backend/generate")
      .send({ taskDescription: "Write a health check route" });

    expect(res.status).toBe(401);
  });

  test("rejects an unknown agent name with 400", async () => {
    const res = await request(app)
      .post("/api/agents/not-a-real-agent/generate")
      .set("Authorization", authHeader())
      .send({ taskDescription: "Write a health check route please" });

    expect(res.status).toBe(400);
  });

  test("rejects a too-short task description with 400", async () => {
    const res = await request(app)
      .post("/api/agents/backend/generate")
      .set("Authorization", authHeader())
      .send({ taskDescription: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("parses a well-formed model response and returns files", async () => {
    getProvider.mockReturnValue({
      generate: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          explanation: "Added a health check route.",
          files: [{ path: "src/routes/health.js", code: "// route code" }],
        }),
        tokensUsed: 250,
        model: "groq-test-model",
      }),
      name: "free",
      label: "Groq",
    });
    agentRunModel.create.mockResolvedValue({ id: "run-1" });

    const res = await request(app)
      .post("/api/agents/backend/generate")
      .set("Authorization", authHeader())
      .send({ taskDescription: "Write a GET /health route that returns 200", provider: "free" });

    expect(res.status).toBe(201);
    expect(res.body.data.files).toHaveLength(1);
    expect(res.body.data.files[0].path).toBe("src/routes/health.js");
    expect(agentRunModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", agentName: "backend" })
    );
  });

  test("falls back gracefully when the model returns invalid JSON", async () => {
    getProvider.mockReturnValue({
      generate: jest.fn().mockResolvedValue({
        text: "not valid json at all",
        tokensUsed: 100,
        model: "groq-test-model",
      }),
      name: "free",
      label: "Groq",
    });
    agentRunModel.create.mockResolvedValue({ id: "run-2" });

    const res = await request(app)
      .post("/api/agents/backend/generate")
      .set("Authorization", authHeader())
      .send({ taskDescription: "Write a GET /health route that returns 200" });

    expect(res.status).toBe(201);
    expect(res.body.data.files[0].path).toBe("output.txt");
  });

  test("persists a failed run and returns 502 when the provider errors", async () => {
    getProvider.mockReturnValue({
      generate: jest.fn().mockRejectedValue(new ProviderError("upstream timeout")),
      name: "free",
      label: "Groq",
    });
    agentRunModel.create.mockResolvedValue({ id: "run-3" });

    const res = await request(app)
      .post("/api/agents/backend/generate")
      .set("Authorization", authHeader())
      .send({ taskDescription: "Write a GET /health route that returns 200" });

    expect(res.status).toBe(502);
    expect(agentRunModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" })
    );
  });
});
