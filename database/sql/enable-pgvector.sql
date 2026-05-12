create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists question_embeddings (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references question_master(question_id) on delete cascade,
  embedding_model varchar(120) not null,
  embedding vector(768) not null,
  content_hash varchar(64),
  semantic_hash varchar(64),
  question_preview text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, embedding_model)
);

create index if not exists question_embeddings_embedding_idx
  on question_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists question_embeddings_content_hash_idx
  on question_embeddings(content_hash);

create index if not exists question_embeddings_semantic_hash_idx
  on question_embeddings(semantic_hash);
