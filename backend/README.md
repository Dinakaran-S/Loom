# Loom Backend

Node/Express + MySQL backend for Loom, a multi-agent coding platform.
Thirteen diagram specialists (Planner, Research, Search, Memory, RAG,
Database, File, Vision, Coding, API Manager, Cloud & DevOps, Finance, and
Email), plus the original application specialists (Frontend, Backend,
Testing, Reviewer), an Orchestrator that plans and runs a task graph across
them, an Integrator that reviews the combined output for conflicts, and a
WebSocket layer for live status.

## Structure

```
app.js          Express app (exported for tests, no listen())
server.js       HTTP server + Socket.IO, actual entry point
src/
  config/       env loader, MySQL pool, agent system prompts,
                migration runner, seed script
  routes/       route definitions only
  controllers/  request/response handling, calls services
  services/     business logic
    providers/    free (Groq) / paid (Claude) — one shared interface
    agent.service.js         runs any single agent
    orchestrator.service.js  spec -> task graph -> runs it in dep order
    integrator.service.js    reviews combined output, flags conflicts
  models/       parameterized queries only
  middleware/   auth, validation, rate limiting, error handling
  validators/   Zod schemas per route
  migrations/   numbered .sql files, run manually
  websocket/    Socket.IO, JWT-gated, per-project rooms
tests/          Jest + Supertest, DB/providers mocked
```

## Setup

```bash
npm install
cp .env.example .env    # DB creds, JWT secrets, ANTHROPIC_API_KEY, GROQ_API_KEY
npm run migrate          # applies migrations/*.sql in order
npm run seed               # optional — demo user + sample runs (demo@loom.dev / password123)
npm run dev                 # nodemon, http://localhost:4000
npm test                     # runs the test suite (no DB/API keys needed — mocked)
```

## Endpoints

**Auth**
- `POST /api/auth/register` / `login` / `refresh` / `logout`

**Single agent** (`planner`, `research`, `search`, `memory`, `rag`, `database`,
`file`, `vision`, `coding`, `api-manager`, `cloud-devops`, `finance`, `email`,
`backend`, `frontend`, `testing`, `reviewer`)
- `POST /api/agents/:agentName/generate` — `{ taskDescription, contract?, provider: "free"|"paid" }`
- `GET /api/agents/runs` — paginated run history
- `GET /api/agents/runs/:id`

**Orchestrator**
- `POST /api/projects` — `{ name, spec }` → plans a task graph (always uses the paid provider — planning quality matters more than cost here)
- `POST /api/projects/:id/run` — `{ provider: "free"|"paid" }` → runs the graph in dependency order, broadcasting progress over the project's WebSocket room, then runs the Integrator
- `GET /api/projects/:id` — project + task statuses

**WebSocket** (Socket.IO, `auth: { token: accessToken }`)
- Client emits `join_project` with a project id
- Server emits `task_started` / `task_completed` / `task_failed` / `integration_complete`

## How a run actually works

1. `POST /api/projects` sends your spec to Claude with an Orchestrator
   prompt that returns a task graph (`{ tasks: [{ agent, description, dependsOn }] }`).
2. `POST /api/projects/:id/run` topologically sorts the graph into
   layers — independent tasks in the same layer run concurrently.
3. Each task's `contract` is built from the actual output files of its
   dependencies, not the original spec — so Frontend sees exactly what
   Backend produced, not what it was supposed to produce.
4. Once every task settles, the Integrator hands all generated files to
   the Reviewer agent, which flags mismatches (field names, missing
   endpoints, etc.) and the project is marked `done` or `failed`.

## Generated workspaces and repair loop

Each completed project writes generated files to a dedicated directory under
`PROJECTS_ROOT` (default `./workspaces`). Paths are validated so generated
output cannot escape its own project workspace. `GET /api/projects/:id/files`
lists the persisted files for the project owner.

If integration review finds conflicts, Loom runs up to `REVIEW_MAX_ATTEMPTS`
review/repair passes (default: 2) before marking the project done or failed.

## Containers

`docker compose up --build` starts MySQL and the API. Copy `.env.example` to
`.env` first and supply the JWT and provider secrets; run migrations once the
database is healthy.
