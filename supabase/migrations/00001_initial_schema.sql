-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  soul_md text,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  channel text not null default 'api' check (channel in ('web', 'cli', 'telegram', 'slack', 'discord', 'api')),
  status text not null default 'active' check (status in ('active', 'completed', 'error')),
  title text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sessions_user_id on sessions(user_id);
create index idx_sessions_status on sessions(status);
create index idx_sessions_created_at on sessions(created_at desc);

-- Messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  tokens_input int,
  tokens_output int,
  created_at timestamptz default now()
);

create index idx_messages_session_id on messages(session_id);
create index idx_messages_created_at on messages(created_at);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger sessions_updated_at before update on sessions
  for each row execute function update_updated_at();
