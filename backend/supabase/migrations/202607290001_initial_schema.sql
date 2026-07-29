-- Run this in Supabase Dashboard > SQL Editor before starting Loom.
-- The users table mirrors Supabase Auth identities. Passwords are managed by
-- Supabase Auth and are never copied into the application database.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do update set email = excluded.email, name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.create_user_profile();

create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  spec text not null,
  status text not null default 'planning' check (status in ('planning', 'running', 'done', 'failed')),
  integration_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  agent_name text not null,
  provider text not null check (provider in ('free', 'paid')),
  model text,
  task_description text not null,
  status text not null check (status in ('success', 'error')),
  output_code text,
  output_explanation text,
  tokens_used integer not null default 0,
  error_message text,
  task_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_name text not null,
  description text not null,
  depends_on jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'error')),
  run_id uuid references public.agent_runs(id) on delete set null,
  sequence_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_runs
  add constraint agent_runs_task_id_fkey foreign key (task_id) references public.tasks(id) on delete set null;

create table if not exists public.agent_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  agent_name text not null,
  provider text not null default 'free' check (provider in ('free', 'paid')),
  updated_at timestamptz not null default now(),
  primary key (user_id, agent_name)
);

create table if not exists public.provider_credentials (
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  encrypted_secret text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

-- The Express API owns project execution. Do not expose these tables directly
-- to anonymous clients; all project calls go through the authenticated API.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.agent_runs enable row level security;
alter table public.tasks enable row level security;
alter table public.agent_preferences enable row level security;
alter table public.provider_credentials enable row level security;
