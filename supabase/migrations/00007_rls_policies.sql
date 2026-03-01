-- Enable RLS on all tables
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table memory_entries enable row level security;
alter table tool_executions enable row level security;
alter table cron_jobs enable row level security;
alter table cron_executions enable row level security;
alter table user_skills enable row level security;
alter table daily_metrics enable row level security;

-- Profiles: users can read/update their own profile
create policy profiles_select on profiles for select using (auth.uid() = id);
create policy profiles_update on profiles for update using (auth.uid() = id);
create policy profiles_insert on profiles for insert with check (auth.uid() = id);

-- Sessions: users see only their own sessions
create policy sessions_select on sessions for select using (auth.uid() = user_id);
create policy sessions_insert on sessions for insert with check (auth.uid() = user_id);
create policy sessions_update on sessions for update using (auth.uid() = user_id);
create policy sessions_delete on sessions for delete using (auth.uid() = user_id);

-- Messages: users see messages in their sessions
create policy messages_select on messages for select
  using (exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid()));
create policy messages_insert on messages for insert
  with check (exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid()));

-- Memory: users manage their own memory
create policy memory_select on memory_entries for select using (auth.uid() = user_id);
create policy memory_insert on memory_entries for insert with check (auth.uid() = user_id);
create policy memory_update on memory_entries for update using (auth.uid() = user_id);
create policy memory_delete on memory_entries for delete using (auth.uid() = user_id);

-- Tool executions: users see their own
create policy tools_select on tool_executions for select using (auth.uid() = user_id);
create policy tools_insert on tool_executions for insert with check (auth.uid() = user_id);

-- Cron jobs: users manage their own
create policy cron_select on cron_jobs for select using (auth.uid() = user_id);
create policy cron_insert on cron_jobs for insert with check (auth.uid() = user_id);
create policy cron_update on cron_jobs for update using (auth.uid() = user_id);
create policy cron_delete on cron_jobs for delete using (auth.uid() = user_id);

-- Cron executions: users see executions of their cron jobs
create policy cron_exec_select on cron_executions for select
  using (exists (select 1 from cron_jobs where cron_jobs.id = cron_executions.cron_job_id and cron_jobs.user_id = auth.uid()));
create policy cron_exec_insert on cron_executions for insert
  with check (exists (select 1 from cron_jobs where cron_jobs.id = cron_executions.cron_job_id and cron_jobs.user_id = auth.uid()));

-- Skills: users manage their own
create policy skills_select on user_skills for select using (auth.uid() = user_id);
create policy skills_insert on user_skills for insert with check (auth.uid() = user_id);
create policy skills_update on user_skills for update using (auth.uid() = user_id);
create policy skills_delete on user_skills for delete using (auth.uid() = user_id);

-- Metrics: users see their own
create policy metrics_select on daily_metrics for select using (auth.uid() = user_id);
create policy metrics_insert on daily_metrics for insert with check (auth.uid() = user_id);
create policy metrics_update on daily_metrics for update using (auth.uid() = user_id);
