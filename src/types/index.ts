export interface Workspace {
  id: string
  name: string
  industry_type: string | null
  whatsapp_number: string | null
  created_at: string
}

export interface WorkspaceUser {
  id: string
  workspace_id: string
  role: 'admin' | 'agent'
  name: string | null
  email: string | null
  created_at: string
}

export type ConvStatus =
  | 'new'
  | 'waiting_us'
  | 'waiting_customer'
  | 'follow_up'
  | 'appointment'
  | 'no_show'
  | 'closed'

// DB status field (legacy mapping)
export type LeadStatus = 'new' | 'contacted' | 'responded' | 'appointment' | 'no_response' | 'closed'

export interface Lead {
  id: string
  workspace_id: string
  name: string
  phone: string
  email?: string | null
  source: string
  status: LeadStatus
  tags: string[]
  notes: string | null
  automation_paused: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  workspace_id: string
  unread_count: number
  last_message: string | null
  last_message_at: string
  assigned_agent_id: string | null
  created_at: string
  lead?: Lead
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'template' | 'image' | 'note'

export interface Message {
  id: string
  conversation_id: string
  direction: MessageDirection
  type?: MessageType
  content: string
  status: string
  created_at: string
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'reminder_sent'
  | 'arrived'
  | 'no_show'
  | 'rescheduled'
  | 'cancelled'
  // legacy DB values
  | 'pending'

export interface Appointment {
  id: string
  lead_id: string
  workspace_id: string
  title: string | null
  date: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  lead?: Lead
}

export type AutomationTrigger =
  | 'lead_created'
  | 'no_response'
  | 'appointment_reminder'
  | 'appointment_created'
  | 'appointment_no_show'
  | 'post_treatment'
  | 'inactive_customer'

export interface Automation {
  id: string
  workspace_id: string
  name: string
  trigger_type: AutomationTrigger
  delay_minutes: number
  message_template: string
  is_active: boolean
  stats_sent?: number
  created_at: string
}

export interface AutomationJob {
  id: string
  lead_id: string
  automation_id: string
  scheduled_at: string
  status: 'pending' | 'sent' | 'cancelled'
  created_at: string
}

export interface Template {
  id: string
  workspace_id: string
  name: string
  category: string
  content: string
  variables: string[]
  approval_status: 'approved' | 'pending' | 'rejected' | 'draft'
  usage_count: number
  created_at: string
}

export type MetaTemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paused' | 'disabled'
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
  text: string
  url?: string
  phone_number?: string
}

export interface WhatsAppTemplate {
  id: string
  workspace_id: string | null
  name: string
  category: TemplateCategory
  language: string
  header_type: 'NONE' | 'TEXT' | 'IMAGE' | null
  header_text: string | null
  body: string
  footer: string | null
  buttons: TemplateButton[]
  variables: string[]
  sample_values: Record<string, string>
  meta_template_id: string | null
  meta_status: MetaTemplateStatus
  rejection_reason: string | null
  usage_count: number
  last_submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeDocument {
  id: string
  business_id: string
  title: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface AiSuggestion {
  id: string
  conversation_id: string
  trigger_message_id: string | null
  suggested_reply: string
  source_doc_ids: string[]
  source_doc_titles: string[]
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
}

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused'

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  template_id: string | null
  status: CampaignStatus
  audience_size: number
  sent_count: number
  delivered_count: number
  read_count: number
  reply_count: number
  scheduled_at: string | null
  created_at: string
}
