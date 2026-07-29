# Loom — Multi-Agent Coding Platform

A multi-agent system where 17 specialist agents (Planner, Research, Search,
Memory, RAG, Database, File, Vision, Coding, API Manager, Cloud & DevOps,
Finance, and Email) collaborate with the existing Backend, Frontend, Testing,
and Reviewer agents under an Orchestrator that plans and runs the work, and an
Integrator that checks their outputs actually fit together.

```
loom-project/
  frontend/   loom-ui.jsx — React dashboard (glass UI): login, agent
              dashboard, authentication, live API and WebSocket status
  backend/    Node/Express + MySQL API — auth, 17 callable specialists, the
              Orchestrator, the Integrator, WebSocket status, tests
```

## Quick start

## Deployment

The frontend is deployed on Vercel:

https://loom-project-eight.vercel.app

Vercel builds the Vite app from `frontend/` using the root `vercel.json`.
The Express and Socket.IO backend is not deployed by Vercel in this setup; host
it separately, then set this Vercel environment variable to its public API URL:

```text
VITE_API_URL=https://your-backend.example.com/api
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel as well. Do not
add server-only credentials such as `SUPABASE_SERVICE_ROLE_KEY`, database
passwords, or JWT secrets to Vercel frontend environment variables.

**Backend**
```bash
cd backend
npm install
cp .env.example .env    # DB creds, JWT secrets, ANTHROPIC_API_KEY, GROQ_API_KEY
npm run migrate
npm run seed              # optional demo data
npm run dev                # http://localhost:4000
npm test
```
Full endpoint list and architecture notes: `backend/README.md`.

**Frontend**
`frontend/loom-ui.jsx` is a self-contained React artifact (Tailwind +
lucide-react). Drop it into any React project, or open it directly as
a Claude artifact. It currently uses mock data — wiring it to the
backend means pointing its fetch calls at `http://localhost:4000/api`
and connecting to the WebSocket for live agent status.

## What's real vs. what's next

Built: auth, all 17 specialist agents callable individually, the Orchestrator
(spec → task graph → dependency-ordered run), the Integrator/conflict
check, free-vs-paid provider routing, WebSocket events, a passing test
suite.

Completed: the Vite frontend is wired to authentication, project planning and
live Socket.IO task updates; generated files are written to a sandboxed project
workspace; rejected integrations get bounded repair passes; Docker Compose is
provided for local deployment.

Run the frontend with `cd frontend && npm install && npm run dev`. Generated
code is placed in `backend/workspaces/<project-id>` by default; set
`PROJECTS_ROOT` to choose a different controlled output directory.
