-- Cron jobs
create table cron_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  schedule text not null,
  prompt text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'error')),
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_cron_user on cron_jobs(user_id);
create index idx_cron_status on cron_jobs(status);
create index idx_cron_next_run on cron_jobs(next_run_at) where status = 'active';

-- Cron execution history
create table cron_executions (
  id uuid primary key default uuid_generate_v4(),
  cron_job_id uuid not null references cron_jobs(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  output text,
  error text,
  duration_ms int,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_cron_exec_job on cron_executions(cron_job_id);
create index idx_cron_exec_started on cron_executions(started_at desc);

create trigger cron_jobs_updated_at before update on cron_jobs
  for each row execute function update_updated_at();
