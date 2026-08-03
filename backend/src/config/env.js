require("dotenv").config();

const required = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "POSTGRES_URL",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== "test") {
  // Fail fast — a backend that boots with silently missing secrets is worse than one that won't boot.
  console.error(`[env] Missing required environment variables: ${missing.join(", ")}`);
  console.error("[env] Copy .env.example to .env and fill it in.");
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),

  db: {
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || "10", 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "20m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  },

  providers: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    groqApiKey: process.env.GROQ_API_KEY || "",
    // Llama 3.1 70B was retired by Groq. Keep legacy .env files working by
    // transparently moving them to Groq's current recommended replacement.
    groqModel: process.env.GROQ_MODEL === "llama-3.1-70b-versatile"
      ? "openai/gpt-oss-120b"
      : (process.env.GROQ_MODEL || "openai/gpt-oss-120b"),
  },

  supabase: {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  },

  projectsRoot: process.env.PROJECTS_ROOT || "./workspaces",
  reviewMaxAttempts: parseInt(process.env.REVIEW_MAX_ATTEMPTS || "2", 10),
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || "",
};
