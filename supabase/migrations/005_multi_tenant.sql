-- Multi-tenant auth & team management

-- workspace_users: add display columns
alter table workspace_users
  add column if not exists name  text,
  add column if not exists email text;

-- conversations: add agent assignment
alter table conversations
  add column if not exists assigned_agent_id uuid references auth.users(id) on delete set null;

create index if not exists conv_agent_idx on conversations(assigned_agent_id);

-- automations: expand trigger_type to include all UI types
alter table automations drop constraint if exists automations_trigger_type_check;
alter table automations add constraint automations_trigger_type_check
  check (trigger_type in (
    'lead_created','no_response','appointment_reminder',
    'appointment_created','appointment_no_show','post_treatment','inactive_customer'
  ));

-- whatsapp_templates: replace open RLS with workspace-scoped policy
drop policy if exists "wt_service_all" on whatsapp_templates;
create policy "wt_ws_rw" on whatsapp_templates for all
  using (workspace_id = get_workspace_id());

-- data migration: assign any orphaned templates to the first workspace
update whatsapp_templates
  set workspace_id = (select id from workspaces order by created_at limit 1)
  where workspace_id is null;
