import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import type { WhatsAppTemplate } from '@/types'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('whatsapp_templates')
    .select('*')
    .eq('workspace_id', auth.workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Partial<WhatsAppTemplate>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { name, category, language, header_type, header_text, body: msgBody, footer, buttons, variables, sample_values } = body

  if (!name?.trim()) return NextResponse.json({ error: 'שם התבנית הוא שדה חובה' }, { status: 400 })
  if (!/^[a-z0-9_]+$/.test(name)) return NextResponse.json({ error: 'שם חייב להכיל רק אותיות קטנות, מספרים וקווים תחתיים' }, { status: 400 })
  if (!msgBody?.trim()) return NextResponse.json({ error: 'גוף ההודעה הוא שדה חובה' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'קטגוריה היא שדה חובה' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('whatsapp_templates')
    .insert({
      workspace_id: auth.workspaceId,
      name: name.trim(),
      category: category || 'UTILITY',
      language: language || 'he',
      header_type: header_type || 'NONE',
      header_text: header_text?.trim() || null,
      body: msgBody.trim(),
      footer: footer?.trim() || null,
      buttons: buttons || [],
      variables: variables || [],
      sample_values: sample_values || {},
      meta_status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
