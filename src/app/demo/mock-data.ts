export const mockLeads = [
  { id: '1', name: 'Sarah Johnson',   phone: '+1 555 0101', status: 'responded',   source: 'website',  tags: ['hot-lead', 'enterprise'], notes: 'Interested in the Pro plan. Follow up Friday.', automation_paused: true  },
  { id: '2', name: 'Michael Chen',    phone: '+1 555 0102', status: 'new',          source: 'referral', tags: ['smb'],                    notes: '',                                            automation_paused: false },
  { id: '3', name: 'Emma Williams',   phone: '+1 555 0103', status: 'appointment',  source: 'social',   tags: ['vip'],                    notes: 'Meeting booked for Monday.',                  automation_paused: true  },
  { id: '4', name: 'David Martinez',  phone: '+1 555 0104', status: 'no_response',  source: 'email',    tags: [],                         notes: '',                                            automation_paused: false },
  { id: '5', name: 'Olivia Brown',    phone: '+1 555 0105', status: 'contacted',    source: 'website',  tags: ['trial'],                  notes: 'Asked about pricing.',                        automation_paused: false },
  { id: '6', name: 'James Wilson',    phone: '+1 555 0106', status: 'closed',       source: 'referral', tags: ['won'],                    notes: 'Signed contract 🎉',                          automation_paused: true  },
]

export const mockConversations = [
  {
    id: 'c1', lead_id: '1', unread_count: 2,
    last_message: 'Yes! What time works for you?',
    last_message_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    lead: mockLeads[0],
  },
  {
    id: 'c2', lead_id: '3', unread_count: 0,
    last_message: 'Great, see you Monday at 10am 👍',
    last_message_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    lead: mockLeads[2],
  },
  {
    id: 'c3', lead_id: '5', unread_count: 0,
    last_message: 'Hi Olivia! How can we help you today?',
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lead: mockLeads[4],
  },
  {
    id: 'c4', lead_id: '2', unread_count: 1,
    last_message: 'Hi Michael, welcome! We got your info.',
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    lead: mockLeads[1],
  },
  {
    id: 'c5', lead_id: '4', unread_count: 0,
    last_message: 'Still relevant? Let us know 🙂',
    last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lead: mockLeads[3],
  },
]

export const mockMessages: Record<string, { id: string; direction: 'inbound' | 'outbound'; content: string; created_at: string; status: string }[]> = {
  c1: [
    { id: 'm1', direction: 'outbound', content: 'Hi Sarah! Thanks for reaching out 👋 How can we help you today?', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm2', direction: 'inbound',  content: 'Hey! I saw your product online and I\'m really interested. Can we schedule a demo?', created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm3', direction: 'outbound', content: 'Absolutely! We\'d love to show you around. I have slots available this Thursday or Friday afternoon. Which works better for you?', created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm4', direction: 'inbound',  content: 'Friday works great! What time?', created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm5', direction: 'inbound',  content: 'Yes! What time works for you?', created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), status: 'delivered' },
  ],
  c2: [
    { id: 'm6', direction: 'outbound', content: 'Hi Emma! You\'re all set for Monday at 10am. Looking forward to meeting you! 🎉', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm7', direction: 'inbound',  content: 'Great, see you Monday at 10am 👍', created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), status: 'delivered' },
  ],
  c3: [
    { id: 'm8', direction: 'outbound', content: 'Hi Olivia! How can we help you today?', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
  ],
  c4: [
    { id: 'm9', direction: 'outbound', content: 'Hi Michael, welcome! We got your info from the referral. Happy to chat anytime 😊', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
  ],
  c5: [
    { id: 'm10', direction: 'outbound', content: 'Hi David! We noticed you filled out our form. Are you still interested?', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'm11', direction: 'outbound', content: 'Still relevant? Let us know 🙂', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
  ],
}

export const mockAppointments = [
  { id: 'a1', lead_id: '3', title: 'Product Demo', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'confirmed', notes: 'Zoom link sent', lead: mockLeads[2] },
  { id: 'a2', lead_id: '1', title: 'Follow-up Call', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending',   notes: '', lead: mockLeads[0] },
  { id: 'a3', lead_id: '6', title: 'Onboarding',    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'confirmed', notes: 'Completed', lead: mockLeads[5] },
]

export const mockAutomations = [
  { id: 'au1', name: 'Welcome Message',   trigger_type: 'lead_created',         delay_minutes: 0,    message_template: 'Hi {{name}}! Thanks for reaching out 👋 How can we help you today?', is_active: true },
  { id: 'au2', name: 'Follow-up #1',      trigger_type: 'no_response',          delay_minutes: 60,   message_template: 'Just checking in, {{name}} — did you get our last message?', is_active: true },
  { id: 'au3', name: 'Follow-up #2',      trigger_type: 'no_response',          delay_minutes: 1440, message_template: 'Still relevant, {{name}}? We\'d love to connect 🙂', is_active: true },
  { id: 'au4', name: 'Appointment Reminder', trigger_type: 'appointment_reminder', delay_minutes: 1440, message_template: 'Reminder: you have an appointment with us tomorrow. See you soon!', is_active: false },
]

export const mockStats = {
  total_leads: mockLeads.length,
  contacted:   mockLeads.filter(l => l.status === 'contacted').length,
  responded:   mockLeads.filter(l => l.status === 'responded').length,
  no_response: mockLeads.filter(l => l.status === 'no_response').length,
  appointments: mockAppointments.filter(a => a.status !== 'cancelled').length,
  closed:      mockLeads.filter(l => l.status === 'closed').length,
}
