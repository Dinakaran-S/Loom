// Local dev convenience only — never run against prod. Creates a demo
// user and a couple of sample agent runs so the dashboard has something
// to show without a real end-to-end call.
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("./db");
const logger = require("../utils/logger");

const DEMO_EMAIL = "demo@loom.dev";
const DEMO_PASSWORD = "password123";

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userId = uuidv4();

  await pool.execute(
    `INSERT INTO users (id, email, password_hash, name, role)
     VALUES (?, ?, ?, ?, 'user')
     ON DUPLICATE KEY UPDATE id = id`,
    [userId, DEMO_EMAIL, passwordHash, "Demo User"]
  );

  const [[user]] = await pool.query("SELECT id FROM users WHERE email = ?", [DEMO_EMAIL]);

  const sampleRuns = [
    { agent: "database", status: "success", explanation: "Created users and sessions tables." },
    { agent: "backend", status: "success", explanation: "Implemented POST /api/auth/login." },
    { agent: "reviewer", status: "error", explanation: "camelCase/snake_case mismatch between frontend and backend." },
  ];

  for (const run of sampleRuns) {
    await pool.execute(
      `INSERT INTO agent_runs
        (id, user_id, agent_name, provider, model, task_description, status, output_explanation, tokens_used)
       VALUES (?, ?, ?, 'free', 'Groq · Llama 3.1', ?, ?, ?, 420)`,
      [uuidv4(), user.id, run.agent, `Demo task for ${run.agent}`, run.status, run.explanation]
    );
  }

  logger.info("seed_complete", { email: DEMO_EMAIL, password: DEMO_PASSWORD });
  process.exit(0);
}

seed().catch((err) => {
  logger.error("seed_failed", { error: err.message });
  process.exit(1);
});
