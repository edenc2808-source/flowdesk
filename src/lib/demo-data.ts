// Realistic Hebrew demo data for a beauty/laser clinic WhatsApp CRM
import type { Lead, Conversation, Message, Appointment, Automation, Template, Campaign } from '@/types'

const N = Date.now()
const m = (n: number) => new Date(N - n * 60000).toISOString()
const h = (n: number) => new Date(N - n * 3600000).toISOString()
const d = (n: number) => new Date(N - n * 86400000).toISOString()
const fu = (n: number) => new Date(N + n * 3600000).toISOString() // future

export const DEMO_CONTACTS: Lead[] = [
  { id: 'l1',  workspace_id: 'demo', name: 'יעל כהן',         phone: '+972501234567', source: 'אתר',            status: 'responded',   tags: ['הסרת שיער', 'חדשה'],    notes: 'מעוניינת בחבילה מלאה', automation_paused: true,  created_at: d(3),  updated_at: h(2) },
  { id: 'l2',  workspace_id: 'demo', name: 'מיכל לוי',        phone: '+972523456789', source: 'אינסטגרם',       status: 'appointment', tags: ['בוטוקס', 'vip'],        notes: 'לקוחה קבועה מזה 2 שנים', automation_paused: true, created_at: d(30), updated_at: h(5) },
  { id: 'l3',  workspace_id: 'demo', name: 'שרה מזרחי',       phone: '+972545678901', source: 'הפניה',          status: 'responded',   tags: ['ניקוי עמוק'],            notes: null,                    automation_paused: true,  created_at: d(7),  updated_at: h(1) },
  { id: 'l4',  workspace_id: 'demo', name: 'נועה שפירא',      phone: '+972537890123', source: 'גוגל',           status: 'new',         tags: ['פנים'],                  notes: null,                    automation_paused: false, created_at: h(3),  updated_at: h(3) },
  { id: 'l5',  workspace_id: 'demo', name: 'תמר ברקוביץ',     phone: '+972589012345', source: 'אינסטגרם',       status: 'no_response', tags: ['הסרת שיער'],             notes: 'לא הגיעה לפגישה ביום ג׳', automation_paused: false, created_at: d(14), updated_at: d(2) },
  { id: 'l6',  workspace_id: 'demo', name: 'דינה פרידמן',     phone: '+972501111222', source: 'אתר',            status: 'contacted',   tags: ['גבות', 'צבע'],           notes: null,                    automation_paused: false, created_at: d(1),  updated_at: h(6) },
  { id: 'l7',  workspace_id: 'demo', name: 'הדר גרינברג',     phone: '+972522222333', source: 'הפניה',          status: 'appointment', tags: ['מסאג׳', 'vip'],          notes: 'פגישה מחר ב-10:00',    automation_paused: true,  created_at: d(5),  updated_at: d(1) },
  { id: 'l8',  workspace_id: 'demo', name: 'ליאת אדלשטיין',   phone: '+972543333444', source: 'גוגל',           status: 'responded',   tags: ['ניקוי עמוק', 'פנים'],    notes: null,                    automation_paused: true,  created_at: d(4),  updated_at: h(8) },
  { id: 'l9',  workspace_id: 'demo', name: 'אביב רוזנברג',    phone: '+972504444555', source: 'אינסטגרם',       status: 'appointment', tags: ['בוטוקס'],                notes: 'אישרה ב-WhatsApp',      automation_paused: true,  created_at: d(10), updated_at: d(2) },
  { id: 'l10', workspace_id: 'demo', name: 'רחל פינקל',       phone: '+972525555666', source: 'אינסטגרם',       status: 'new',         tags: ['הסרת שיער'],             notes: null,                    automation_paused: false, created_at: m(30), updated_at: m(30) },
  { id: 'l11', workspace_id: 'demo', name: 'כרמלה ביטון',     phone: '+972546666777', source: 'הפניה',          status: 'closed',      tags: ['פנים', 'גבות', 'vip'],   notes: 'לקוחה נאמנה',          automation_paused: true,  created_at: d(60), updated_at: d(5) },
  { id: 'l12', workspace_id: 'demo', name: 'ורד חיון',        phone: '+972507777888', source: 'גוגל',           status: 'responded',   tags: ['ציפורניים'],             notes: null,                    automation_paused: false, created_at: d(2),  updated_at: h(4) },
  { id: 'l13', workspace_id: 'demo', name: 'מרים אסייג',      phone: '+972528888999', source: 'אתר',            status: 'no_response', tags: ['הסרת שיער'],             notes: 'לא ענתה ל-3 הודעות',  automation_paused: false, created_at: d(20), updated_at: d(7) },
  { id: 'l14', workspace_id: 'demo', name: 'עינת כץ',         phone: '+972549999000', source: 'גוגל',           status: 'contacted',   tags: ['בוטוקס', 'ניקוי'],       notes: null,                    automation_paused: false, created_at: d(1),  updated_at: h(2) },
  { id: 'l15', workspace_id: 'demo', name: 'טלי שמעון',       phone: '+972500001111', source: 'הפניה',          status: 'appointment', tags: ['מסאג׳'],                 notes: 'פגישה היום ב-15:00',   automation_paused: true,  created_at: d(8),  updated_at: h(1) },
]

export const DEMO_CONVERSATIONS: Conversation[] = [
  { id: 'cv1',  lead_id: 'l1',  workspace_id: 'demo', unread_count: 2, last_message: 'מחר ב-14:00 מעולה!', last_message_at: m(5),  created_at: d(3),  assigned_agent_id: null, lead: DEMO_CONTACTS[0] },
  { id: 'cv2',  lead_id: 'l2',  workspace_id: 'demo', unread_count: 0, last_message: 'תודה, מחכה לפגישה 😊', last_message_at: h(5), created_at: d(30), assigned_agent_id: null, lead: DEMO_CONTACTS[1] },
  { id: 'cv3',  lead_id: 'l3',  workspace_id: 'demo', unread_count: 1, last_message: 'כל כך נהניתי מהטיפול!', last_message_at: h(1), created_at: d(7),  assigned_agent_id: null, lead: DEMO_CONTACTS[2] },
  { id: 'cv4',  lead_id: 'l4',  workspace_id: 'demo', unread_count: 1, last_message: 'שלום, רוצה לשאול על מחירים', last_message_at: h(3), created_at: h(3), assigned_agent_id: null, lead: DEMO_CONTACTS[3] },
  { id: 'cv5',  lead_id: 'l5',  workspace_id: 'demo', unread_count: 0, last_message: 'מצטערת, שכחתי לבטל... אפשר לקבוע מחדש?', last_message_at: d(2), created_at: d(14), assigned_agent_id: null, lead: DEMO_CONTACTS[4] },
  { id: 'cv6',  lead_id: 'l6',  workspace_id: 'demo', unread_count: 0, last_message: 'מה המחיר לצביעת גבות?', last_message_at: h(6), created_at: d(1),  assigned_agent_id: null, lead: DEMO_CONTACTS[5] },
  { id: 'cv7',  lead_id: 'l7',  workspace_id: 'demo', unread_count: 0, last_message: 'אושרתי! מגיעה מחר ב-10', last_message_at: d(1), created_at: d(5),  assigned_agent_id: null, lead: DEMO_CONTACTS[6] },
  { id: 'cv8',  lead_id: 'l8',  workspace_id: 'demo', unread_count: 0, last_message: 'נשמע טוב, מתי יש מקום?', last_message_at: h(8), created_at: d(4),  assigned_agent_id: null, lead: DEMO_CONTACTS[7] },
  { id: 'cv9',  lead_id: 'l9',  workspace_id: 'demo', unread_count: 0, last_message: 'מאשרת את הפגישה לשישי', last_message_at: d(2),  created_at: d(10), assigned_agent_id: null, lead: DEMO_CONTACTS[8] },
  { id: 'cv10', lead_id: 'l10', workspace_id: 'demo', unread_count: 1, last_message: 'שלום! ראיתי אתכן באינסטגרם 😍', last_message_at: m(30), created_at: m(30), assigned_agent_id: null, lead: DEMO_CONTACTS[9] },
  { id: 'cv11', lead_id: 'l11', workspace_id: 'demo', unread_count: 0, last_message: 'תודה על הכל, תמיד מושלם 💙', last_message_at: d(5), created_at: d(60), assigned_agent_id: null, lead: DEMO_CONTACTS[10] },
  { id: 'cv12', lead_id: 'l12', workspace_id: 'demo', unread_count: 0, last_message: 'יש מקום ביום שלישי?', last_message_at: h(4),  created_at: d(2),  assigned_agent_id: null, lead: DEMO_CONTACTS[11] },
  { id: 'cv13', lead_id: 'l14', workspace_id: 'demo', unread_count: 0, last_message: 'אשמח לפרטים נוספים', last_message_at: h(2),  created_at: d(1),  assigned_agent_id: null, lead: DEMO_CONTACTS[13] },
  { id: 'cv14', lead_id: 'l15', workspace_id: 'demo', unread_count: 0, last_message: 'מגיעה ב-15:00 כמוסכם!', last_message_at: h(1),  created_at: d(8),  assigned_agent_id: null, lead: DEMO_CONTACTS[14] },
]

export const DEMO_MESSAGES: Record<string, Message[]> = {
  cv1: [
    { id: 'm1a', conversation_id: 'cv1', direction: 'inbound',  content: 'שלום! ראיתי את הפרסום שלכן על הסרת שיער. אפשר לקבל פרטים?', status: 'delivered', created_at: h(4) },
    { id: 'm1b', conversation_id: 'cv1', direction: 'outbound', content: 'שלום יעל! ברוכה הבאה ל-FlowDesk 😊 כמובן שנשמח לעזור. איזה אזור מעניין אותך?', status: 'delivered', created_at: h(3.8) },
    { id: 'm1c', conversation_id: 'cv1', direction: 'inbound',  content: 'רגליים ובית שחי. כמה עולה?', status: 'delivered', created_at: h(3.5) },
    { id: 'm1d', conversation_id: 'cv1', direction: 'outbound', content: 'חבילת רגליים מלאה + בית שחי מתחילה מ-1,200 ש"ח ל-6 טיפולים. מוזמנת לייעוץ חינמי 🌸\n\nיש לנו מקום מחר ב-14:00 או ביום ה׳ ב-11:00. מה מתאים?', status: 'delivered', created_at: h(3) },
    { id: 'm1e', conversation_id: 'cv1', direction: 'inbound',  content: 'מחר ב-14:00 מעולה!', status: 'delivered', created_at: m(5) },
  ],
  cv2: [
    { id: 'm2a', conversation_id: 'cv2', direction: 'inbound',  content: 'שלום, אני מעוניינת בטיפול בוטוקס. כמה זה עולה אצלכן?', status: 'delivered', created_at: d(2) },
    { id: 'm2b', conversation_id: 'cv2', direction: 'outbound', content: 'שלום מיכל! הבוטוקס אצלנו מתחיל מ-800 ש"ח. יש לנו ד"ר מנוסה עם תוצאות מדהימות 💉✨\n\nרוצה לתאם ייעוץ?', status: 'delivered', created_at: d(1) + '' },
    { id: 'm2c', conversation_id: 'cv2', direction: 'inbound',  content: 'כן! מתי יש מקום?', status: 'delivered', created_at: h(8) },
    { id: 'm2d', conversation_id: 'cv2', direction: 'outbound', content: 'מצוין! יש לנו מקום ביום שישי ב-10:00. זה מתאים?', status: 'delivered', created_at: h(7) },
    { id: 'm2e', conversation_id: 'cv2', direction: 'inbound',  content: 'תודה, מחכה לפגישה 😊', status: 'delivered', created_at: h(5) },
  ],
  cv3: [
    { id: 'm3a', conversation_id: 'cv3', direction: 'outbound', content: 'שלום שרה! שמחנו לראותך שוב 😊 איך הרגשת אחרי הטיפול?', status: 'delivered', created_at: h(3) },
    { id: 'm3b', conversation_id: 'cv3', direction: 'inbound',  content: 'כל כך נהניתי מהטיפול! העור שלי מרגיש מדהים 🌟', status: 'delivered', created_at: h(1) },
  ],
  cv4: [
    { id: 'm4a', conversation_id: 'cv4', direction: 'inbound',  content: 'שלום, רוצה לשאול על מחירים לטיפולי פנים', status: 'delivered', created_at: h(3) },
  ],
  cv5: [
    { id: 'm5a', conversation_id: 'cv5', direction: 'outbound', content: 'שלום תמר! שמנו לב שלא הגעת לפגישה. הכל בסדר? 🌸', status: 'delivered', created_at: d(2) },
    { id: 'm5b', conversation_id: 'cv5', direction: 'inbound',  content: 'מצטערת, שכחתי לבטל... אפשר לקבוע מחדש?', status: 'delivered', created_at: d(2) },
    { id: 'm5c', conversation_id: 'cv5', direction: 'outbound', content: 'כמובן! בשמחה 😊 מתי נוח לך?', status: 'delivered', created_at: d(1) },
  ],
  cv6: [
    { id: 'm6a', conversation_id: 'cv6', direction: 'inbound',  content: 'שלום! מה המחיר לצביעת גבות?', status: 'delivered', created_at: h(8) },
    { id: 'm6b', conversation_id: 'cv6', direction: 'outbound', content: 'שלום דינה! צביעת גבות אצלנו עולה 120 ש"ח. כוללת עיצוב + צביעה 🎨', status: 'delivered', created_at: h(7) },
    { id: 'm6c', conversation_id: 'cv6', direction: 'inbound',  content: 'מה המחיר לצביעת גבות?', status: 'delivered', created_at: h(6) },
  ],
  cv10: [
    { id: 'm10a', conversation_id: 'cv10', direction: 'inbound', content: 'שלום! ראיתי אתכן באינסטגרם 😍 הייתי רוצה לשמוע על הסרת שיער', status: 'delivered', created_at: m(30) },
  ],
  cv14: [
    { id: 'm14a', conversation_id: 'cv14', direction: 'outbound', content: 'שלום טלי! תזכורת לפגישת מסאג׳ שלך היום ב-15:00 💆‍♀️', status: 'delivered', created_at: h(3) },
    { id: 'm14b', conversation_id: 'cv14', direction: 'inbound',  content: 'מגיעה ב-15:00 כמוסכם!', status: 'delivered', created_at: h(1) },
  ],
}

export const DEMO_APPOINTMENTS: Appointment[] = [
  { id: 'a1', lead_id: 'l15', workspace_id: 'demo', title: 'מסאג׳ שוודי',      date: fu(2),   status: 'confirmed',   notes: 'בחרה בחבילת 60 דקות',  created_at: d(8),  lead: DEMO_CONTACTS[14] },
  { id: 'a2', lead_id: 'l1',  workspace_id: 'demo', title: 'ייעוץ הסרת שיער', date: fu(22),  status: 'scheduled',   notes: null,                    created_at: m(5),  lead: DEMO_CONTACTS[0] },
  { id: 'a3', lead_id: 'l7',  workspace_id: 'demo', title: 'מסאג׳ רקמות',     date: fu(18),  status: 'confirmed',   notes: 'VIP - חדר פרטי',       created_at: d(5),  lead: DEMO_CONTACTS[6] },
  { id: 'a4', lead_id: 'l2',  workspace_id: 'demo', title: 'בוטוקס קמטי מצח', date: fu(46),  status: 'confirmed',   notes: 'מגיעה עם חברה',        created_at: d(3),  lead: DEMO_CONTACTS[1] },
  { id: 'a5', lead_id: 'l9',  workspace_id: 'demo', title: 'בוטוקס שפתיים',   date: fu(70),  status: 'scheduled',   notes: null,                    created_at: d(2),  lead: DEMO_CONTACTS[8] },
  { id: 'a6', lead_id: 'l5',  workspace_id: 'demo', title: 'הסרת שיער רגליים',date: d(2),    status: 'no_show',     notes: 'לא ענתה לתזכורת',      created_at: d(14), lead: DEMO_CONTACTS[4] },
  { id: 'a7', lead_id: 'l11', workspace_id: 'demo', title: 'ניקוי עמוק + פנים',date: d(5),   status: 'arrived',     notes: 'הגיעה בזמן, מעולה',    created_at: d(10), lead: DEMO_CONTACTS[10] },
  { id: 'a8', lead_id: 'l8',  workspace_id: 'demo', title: 'ניקוי עמוק',       date: fu(96),  status: 'scheduled',   notes: null,                    created_at: h(4),  lead: DEMO_CONTACTS[7] },
]

export const DEMO_TEMPLATES: Template[] = [
  {
    id: 't1', workspace_id: 'demo', name: 'ברוכים הבאים', category: 'ברכה',
    content: 'שלום {{customer_name}}! ברוכה הבאה ל{{business_name}} 😊 שמחנו לשמוע ממך. כיצד נוכל לעזור?',
    variables: ['{{customer_name}}', '{{business_name}}'],
    approval_status: 'approved', usage_count: 47, created_at: d(60),
  },
  {
    id: 't2', workspace_id: 'demo', name: 'אישור פגישה', category: 'פגישות',
    content: 'שלום {{customer_name}}! הפגישה שלך נקבעה ל-{{appointment_date}} בשעה {{appointment_time}} 🗓️\nכתובת: {{business_name}}\nלשאלות, ענו להודעה זו.',
    variables: ['{{customer_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{business_name}}'],
    approval_status: 'approved', usage_count: 89, created_at: d(60),
  },
  {
    id: 't3', workspace_id: 'demo', name: 'תזכורת 24 שעות', category: 'תזכורות',
    content: 'תזכורת ידידותית 😊 יש לך פגישה מחר ב-{{appointment_time}} אצלנו ב{{business_name}}.\n\nלבטל? ענו ביטול. לאשר? ענו אישור 💙',
    variables: ['{{appointment_time}}', '{{business_name}}'],
    approval_status: 'approved', usage_count: 71, created_at: d(45),
  },
  {
    id: 't4', workspace_id: 'demo', name: 'תזכורת 3 שעות', category: 'תזכורות',
    content: 'היי {{customer_name}}! עוד 3 שעות לפגישה שלך ⏰ מחכות לך!',
    variables: ['{{customer_name}}'],
    approval_status: 'approved', usage_count: 58, created_at: d(45),
  },
  {
    id: 't5', workspace_id: 'demo', name: 'לא הגעת', category: 'מעקב',
    content: 'שלום {{customer_name}}, שמנו לב שלא הגעת לפגישה היום 🌸 הכל בסדר? נשמח לתאם מחדש בזמן שנוח לך.',
    variables: ['{{customer_name}}'],
    approval_status: 'approved', usage_count: 23, created_at: d(30),
  },
  {
    id: 't6', workspace_id: 'demo', name: 'מעקב אחרי טיפול', category: 'מעקב',
    content: 'שלום {{customer_name}}! איך הרגשת אחרי הטיפול? 💆‍♀️ נשמח לשמוע! כל שאלה — אנחנו כאן.',
    variables: ['{{customer_name}}'],
    approval_status: 'approved', usage_count: 34, created_at: d(30),
  },
  {
    id: 't7', workspace_id: 'demo', name: 'בקשת ביקורת', category: 'שיווק',
    content: 'שלום {{customer_name}}! 🌟 שמחנו לארח אותך. נשמח אם תשתפי חוות דעת קצרה — זה עוזר לנו לשפר!\n👉 {{review_link}}',
    variables: ['{{customer_name}}', '{{review_link}}'],
    approval_status: 'approved', usage_count: 19, created_at: d(20),
  },
  {
    id: 't8', workspace_id: 'demo', name: 'הפעלה מחדש', category: 'שיווק',
    content: 'שלום {{customer_name}}! כבר קצת זמן לא ראינו אותך 🌸 בא לנו לפנק אותך! 15% הנחה לחזרה החודש. מעוניינת? ענו כן 💙',
    variables: ['{{customer_name}}'],
    approval_status: 'draft', usage_count: 0, created_at: d(5),
  },
]

export const DEMO_AUTOMATIONS: Automation[] = [
  {
    id: 'au1', workspace_id: 'demo', name: 'תגובה אוטומטית לפנייה חדשה',
    trigger_type: 'lead_created', delay_minutes: 2,
    message_template: 'שלום {{name}}! ברוכה הבאה ל-{{workspace}} 😊 קיבלנו את הפנייה שלך ונחזור אליך בהקדם!',
    is_active: true, stats_sent: 128, created_at: d(60),
  },
  {
    id: 'au2', workspace_id: 'demo', name: 'אישור פגישה אוטומטי',
    trigger_type: 'appointment_created', delay_minutes: 0,
    message_template: 'שלום {{name}}! הפגישה שלך אושרה ✅ מחכות לך!',
    is_active: true, stats_sent: 67, created_at: d(45),
  },
  {
    id: 'au3', workspace_id: 'demo', name: 'תזכורת 24 שעות לפני פגישה',
    trigger_type: 'appointment_reminder', delay_minutes: 1440,
    message_template: 'תזכורת: יש לך פגישה מחר! לבטל ענה ביטול 🗓️',
    is_active: true, stats_sent: 89, created_at: d(45),
  },
  {
    id: 'au4', workspace_id: 'demo', name: 'מעקב אחרי אי-הגעה',
    trigger_type: 'appointment_no_show', delay_minutes: 120,
    message_template: 'שלום {{name}}, שמנו לב שלא הגעת היום. הכל בסדר? נשמח לתאם מחדש 🌸',
    is_active: true, stats_sent: 15, created_at: d(30),
  },
  {
    id: 'au5', workspace_id: 'demo', name: 'מעקב אחרי טיפול',
    trigger_type: 'post_treatment', delay_minutes: 1440,
    message_template: 'שלום {{name}}! איך הרגשת אחרי הטיפול? 💆‍♀️ נשמח לשמוע!',
    is_active: true, stats_sent: 43, created_at: d(20),
  },
  {
    id: 'au6', workspace_id: 'demo', name: 'הפעלה מחדש - לא פעיל 30 יום',
    trigger_type: 'inactive_customer', delay_minutes: 43200,
    message_template: 'כבר הרבה זמן לא ראינו אותך {{name}} 🌸 15% הנחה לחזרה החודש!',
    is_active: false, stats_sent: 8, created_at: d(10),
  },
]

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp1', workspace_id: 'demo', name: 'מבצע קיץ - הסרת שיער', template_id: 't1',
    status: 'completed', audience_size: 120, sent_count: 118, delivered_count: 115,
    read_count: 89, reply_count: 34, scheduled_at: d(14), created_at: d(15),
  },
  {
    id: 'camp2', workspace_id: 'demo', name: 'החזרת לקוחות ינואר', template_id: 't8',
    status: 'completed', audience_size: 85, sent_count: 84, delivered_count: 81,
    read_count: 52, reply_count: 18, scheduled_at: d(30), created_at: d(31),
  },
  {
    id: 'camp3', workspace_id: 'demo', name: 'בקשת ביקורות גוגל', template_id: 't7',
    status: 'draft', audience_size: 0, sent_count: 0, delivered_count: 0,
    read_count: 0, reply_count: 0, scheduled_at: null, created_at: d(2),
  },
]

export const DEMO_STATS = {
  total_conversations: DEMO_CONVERSATIONS.length,
  unread: DEMO_CONVERSATIONS.filter(c => c.unread_count > 0).length,
  new_today: 3,
  avg_response_time: '8 דקות',
  appointments_today: 2,
  appointments_week: 8,
  no_show_rate: 12,
  conversion_rate: 68,
  follow_ups_due: 4,
}
