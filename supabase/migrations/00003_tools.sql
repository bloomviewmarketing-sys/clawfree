-- Tool execution audit log
create table tool_executions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete set null,
  message_id uuid references messages(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  tool_name text not null,
  args jsonb default '{}',
  output text,
  error text,
  status text not null default 'success' check (status in ('success', 'error', 'denied', 'timeout')),
  duration_ms int,
  approved_by text,
  created_at timestamptz default now()
);

create index idx_tool_exec_session on tool_executions(session_id);
create index idx_tool_exec_user on tool_executions(user_id);
create index idx_tool_exec_tool on tool_executions(tool_name);
create index idx_tool_exec_status on tool_executions(status);
create index idx_tool_exec_created on tool_executions(created_at desc);
