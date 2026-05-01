-- WhatsApp Templates for Meta Business API approval workflow

create table if not exists whatsapp_templates (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid references workspaces(id) on delete cascade,
  name               text not null,
  category           text not null check (category in ('MARKETING','UTILITY','AUTHENTICATION')),
  language           text not null default 'he',
  header_type        text check (header_type in ('NONE','TEXT','IMAGE')),
  header_text        text,
  body               text not null,
  footer             text,
  buttons            jsonb default '[]',
  variables          jsonb default '[]',
  sample_values      jsonb default '{}',
  meta_template_id   text,
  meta_status        text not null default 'draft'
                       check (meta_status in ('draft','pending','approved','rejected','paused','disabled')),
  rejection_reason   text,
  usage_count        integer not null default 0,
  last_submitted_at  timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists wt_workspace_idx   on whatsapp_templates(workspace_id);
create index if not exists wt_status_idx      on whatsapp_templates(meta_status);
create index if not exists wt_name_ws_idx     on whatsapp_templates(name, workspace_id);

alter table whatsapp_templates enable row level security;
create policy "wt_service_all" on whatsapp_templates for all using (true);

create or replace function update_whatsapp_template_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_wt_updated_at
  before update on whatsapp_templates
  for each row execute function update_whatsapp_template_updated_at();
