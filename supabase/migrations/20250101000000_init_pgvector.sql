-- Enable pgvector for embedding search (run on fresh Supabase project)
create extension if not exists vector;

-- Example documents table with vector column
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Stub health check table (optional — remove if unused)
create table if not exists public._health (
  id int primary key default 1
);
insert into public._health (id) values (1) on conflict do nothing;

create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
