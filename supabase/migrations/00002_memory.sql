-- Enable pgvector
create extension if not exists vector;

-- Memory entries with vector embeddings
create table memory_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null default 'fact' check (type in ('fact', 'preference', 'procedure', 'context', 'skill')),
  content text not null,
  tags text[] default '{}',
  embedding vector(384),
  pinned boolean default false,
  source text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_memory_user_id on memory_entries(user_id);
create index idx_memory_type on memory_entries(type);
create index idx_memory_tags on memory_entries using gin(tags);
create index idx_memory_pinned on memory_entries(pinned) where pinned = true;

-- HNSW index for vector similarity search
create index idx_memory_embedding on memory_entries
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create trigger memory_entries_updated_at before update on memory_entries
  for each row execute function update_updated_at();
