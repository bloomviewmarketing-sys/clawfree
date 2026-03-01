-- User-installed skills
create table user_skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  version text default '1.0.0',
  author text default 'unknown',
  triggers text[] default '{}',
  instructions text not null,
  tools text[] default '{}',
  source_url text,
  skill_md text,
  installed_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

create index idx_skills_user on user_skills(user_id);
create index idx_skills_triggers on user_skills using gin(triggers);

create trigger user_skills_updated_at before update on user_skills
  for each row execute function update_updated_at();
