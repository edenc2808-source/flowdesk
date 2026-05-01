-- Per-business AI knowledge base

create table if not exists business_knowledge_documents (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references workspaces(id) on delete cascade,
  title       text not null,
  content     text,
  file_url    text,
  file_name   text,
  file_type   text,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists bkd_business_idx on business_knowledge_documents(business_id);
create index if not exists bkd_status_idx   on business_knowledge_documents(business_id, status);

alter table business_knowledge_documents enable row level security;
create policy "bkd_ws_rw" on business_knowledge_documents for all
  using (business_id = get_workspace_id());

-- AI-generated reply suggestions per inbound message
create table if not exists ai_suggestions (
  id                 uuid primary key default gen_random_uuid(),
  conversation_id    uuid not null references conversations(id) on delete cascade,
  trigger_message_id uuid references messages(id) on delete set null,
  suggested_reply    text not null,
  source_doc_ids     uuid[] default '{}',
  source_doc_titles  text[] default '{}',
  status             text not null default 'pending'
                       check (status in ('pending','approved','dismissed')),
  created_at         timestamptz default now()
);

create index if not exists ai_sugg_conv_idx on ai_suggestions(conversation_id, created_at desc);

alter table ai_suggestions enable row level security;
create policy "ai_sugg_ws" on ai_suggestions for all using (
  conversation_id in (select id from conversations where workspace_id = get_workspace_id())
);

-- Auto-update updated_at
create or replace function update_bkd_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_bkd_updated_at
  before update on business_knowledge_documents
  for each row execute function update_bkd_updated_at();
