export interface Workspace {
  id: string
  name: string
  industry_type: string | null
  created_at: string
}

export interface WorkspaceUser {
  id: string
  workspace_id: string
  role: string
  created_at: string
}

export type LeadStatus = 'new' | 'contacted' | 'responded' | 'appointment' | 'no_response' | 'closed'

export interface Lead {
  id: string
  workspace_id: string
  name: string
  phone: string
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
  created_at: string
  lead?: Lead
}

export type MessageDirection = 'inbound' | 'outbound'

export interface Message {
  id: string
  conversation_id: string
  direction: MessageDirection
  content: string
  status: string
  created_at: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

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

export type AutomationTrigger = 'lead_created' | 'no_response' | 'appointment_reminder'

export interface Automation {
  id: string
  workspace_id: string
  name: string
  trigger_type: AutomationTrigger
  delay_minutes: number
  message_template: string
  is_active: boolean
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
