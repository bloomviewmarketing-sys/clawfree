-- Daily aggregate metrics
create table daily_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  sessions_count int default 0,
  messages_count int default 0,
  tool_calls_count int default 0,
  tokens_input bigint default 0,
  tokens_output bigint default 0,
  errors_count int default 0,
  avg_response_ms int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create index idx_metrics_user_date on daily_metrics(user_id, date desc);

-- Function to increment daily metrics
create or replace function increment_daily_metric(
  p_user_id uuid,
  p_field text,
  p_value int default 1
) returns void as $$
begin
  insert into daily_metrics (user_id, date, sessions_count, messages_count, tool_calls_count, errors_count)
  values (p_user_id, current_date, 0, 0, 0, 0)
  on conflict (user_id, date) do nothing;

  execute format(
    'update daily_metrics set %I = %I + $1 where user_id = $2 and date = current_date',
    p_field, p_field
  ) using p_value, p_user_id;
end;
$$ language plpgsql;
