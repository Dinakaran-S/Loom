const request = require("supertest");
const bcrypt = require("bcrypt");

jest.mock("../src/models/user.model");
const userModel = require("../src/models/user.model");
const app = require("../app");

describe("Auth flow", () => {
  afterEach(() => jest.clearAllMocks());

  test("POST /api/auth/register creates a user and returns tokens", async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      id: "user-1", email: "new@loom.dev", name: "New User", role: "user",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "new@loom.dev",
      password: "password123",
      name: "New User",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("new@loom.dev");
  });

  test("POST /api/auth/register rejects a duplicate email with 409", async () => {
    userModel.findByEmail.mockResolvedValue({ id: "existing" });

    const res = await request(app).post("/api/auth/register").send({
      email: "taken@loom.dev",
      password: "password123",
      name: "Someone",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  test("POST /api/auth/register rejects a short password with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "new@loom.dev",
      password: "short",
      name: "New User",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("POST /api/auth/login succeeds with correct credentials", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    userModel.findByEmail.mockResolvedValue({
      id: "user-1", email: "demo@loom.dev", name: "Demo", role: "user", password_hash: passwordHash,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "demo@loom.dev",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test("POST /api/auth/login rejects a wrong password with 401", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    userModel.findByEmail.mockResolvedValue({
      id: "user-1", email: "demo@loom.dev", name: "Demo", role: "user", password_hash: passwordHash,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "demo@loom.dev",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("POST /api/auth/login gives the same error for an unknown email (no user enumeration)", async () => {
    userModel.findByEmail.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@loom.dev",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });
});
