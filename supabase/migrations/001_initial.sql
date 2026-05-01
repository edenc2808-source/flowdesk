-- FlowDesk — Initial Schema

-- Workspaces
create table if not exists workspaces (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  industry_type    text,
  whatsapp_number  text,
  created_at       timestamptz default now()
);

-- Users (extends auth.users)
create table if not exists workspace_users (
  id           uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role         text not null default 'admin',
  created_at   timestamptz default now()
);

-- Leads
create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  phone        text not null,
  source       text default 'manual',
  status       text not null default 'new'
                 check (status in ('new','contacted','responded','appointment','no_response','closed')),
  tags         text[] default '{}',
  notes        text,
  automation_paused boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  unread_count int  not null default 0,
  last_message text,
  last_message_at timestamptz default now(),
  created_at   timestamptz default now()
);

-- Messages
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction       text not null check (direction in ('inbound','outbound')),
  content         text not null,
  status          text default 'sent' check (status in ('sent','delivered','failed')),
  created_at      timestamptz default now()
);

-- Appointments
create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title        text,
  date         timestamptz not null,
  status       text default 'pending' check (status in ('pending','confirmed','cancelled')),
  notes        text,
  created_at   timestamptz default now()
);

-- Automations
create table if not exists automations (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  name             text not null,
  trigger_type     text not null check (trigger_type in ('lead_created','no_response','appointment_reminder')),
  delay_minutes    int  not null default 0,
  message_template text not null,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- Follow-up queue (automation jobs)
create table if not exists automation_jobs (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  automation_id uuid not null references automations(id) on delete cascade,
  scheduled_at  timestamptz not null,
  status        text default 'pending' check (status in ('pending','sent','cancelled')),
  created_at    timestamptz default now()
);

-- Indexes
create index if not exists leads_workspace_idx     on leads(workspace_id);
create index if not exists leads_phone_idx         on leads(phone);
create index if not exists conv_lead_idx           on conversations(lead_id);
create index if not exists conv_workspace_idx      on conversations(workspace_id);
create index if not exists conv_last_msg_idx       on conversations(last_message_at desc);
create index if not exists msg_conv_idx            on messages(conversation_id);
create index if not exists jobs_scheduled_idx      on automation_jobs(scheduled_at, status);

-- RLS
alter table workspaces       enable row level security;
alter table workspace_users  enable row level security;
alter table leads            enable row level security;
alter table conversations    enable row level security;
alter table messages         enable row level security;
alter table appointments     enable row level security;
alter table automations      enable row level security;
alter table automation_jobs  enable row level security;

create policy "own_row"      on workspace_users for all using (id = auth.uid());

create or replace function get_workspace_id()
returns uuid language sql security definer stable as $$
  select workspace_id from workspace_users where id = auth.uid() limit 1;
$$;

create policy "own_ws"       on workspaces     for all using (id = get_workspace_id());
create policy "ws_leads"     on leads          for all using (workspace_id = get_workspace_id());
create policy "ws_convs"     on conversations  for all using (workspace_id = get_workspace_id());
create policy "ws_msgs"      on messages       for all using (
  conversation_id in (select id from conversations where workspace_id = get_workspace_id())
);
create policy "ws_appts"     on appointments   for all using (workspace_id = get_workspace_id());
create policy "ws_autos"     on automations    for all using (workspace_id = get_workspace_id());
create policy "ws_jobs"      on automation_jobs for all using (
  lead_id in (select id from leads where workspace_id = get_workspace_id())
);

-- Trigger: update conversations.last_message on new message
create or replace function update_conversation_last_message()
returns trigger language plpgsql as $$
begin
  update conversations
  set
    last_message    = new.content,
    last_message_at = new.created_at,
    unread_count    = case when new.direction = 'inbound'
                        then unread_count + 1
                        else unread_count
                     end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_last_message
  after insert on messages
  for each row execute function update_conversation_last_message();
