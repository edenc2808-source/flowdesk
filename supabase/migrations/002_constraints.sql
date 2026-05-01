-- Unique constraints for data integrity

-- One lead per phone per workspace (prevent duplicate leads)
ALTER TABLE leads
  ADD CONSTRAINT leads_workspace_phone_unique UNIQUE (workspace_id, phone);

-- One conversation per lead (prevent duplicate conversations)
ALTER TABLE conversations
  ADD CONSTRAINT conversations_lead_unique UNIQUE (lead_id);

-- Prevent duplicate pending automation job for same lead+automation
-- (allows re-runs after cancellation/sent, just not double-pending)
CREATE UNIQUE INDEX IF NOT EXISTS automation_jobs_lead_auto_pending_idx
  ON automation_jobs (lead_id, automation_id)
  WHERE status = 'pending';

-- Index for webhook phone lookup (hot path)
CREATE INDEX IF NOT EXISTS leads_phone_workspace_idx ON leads (phone, workspace_id);
