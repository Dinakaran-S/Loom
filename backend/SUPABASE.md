# Supabase setup

Loom now uses Supabase Auth in the browser and passes the resulting access
token to the Express API. The API verifies it using `SUPABASE_URL` and
`SUPABASE_ANON_KEY`.

## 1. Create the database schema

In Supabase Dashboard, open **SQL Editor**, paste and run
`supabase/migrations/202607290001_initial_schema.sql`.

## 2. Configure email authentication

In **Authentication > Providers**, enable Email. During local development you
may disable Confirm email; otherwise new users must confirm their email before
they can sign in.

## 3. Set local environment files

Copy `frontend/.env.example` to `frontend/.env` and fill in the project URL
and anon key. The project URL is `https://<project-ref>.supabase.co`, not the
`/rest/v1` endpoint.

Copy `backend/.env.example` to `backend/.env` and fill in the same values.
Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only: it is required for the
next persistence migration and must never be exposed as a Vite variable or
committed to Git.

## 4. Start Loom

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

The supplied PostgreSQL migration creates the Supabase Auth profile trigger
and all Loom project tables. The Express persistence layer is still MySQL in
this revision; it is intentionally not pointed at the public REST endpoint
until a server-only service role key is configured.
