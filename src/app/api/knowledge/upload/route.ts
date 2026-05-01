import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

const BUCKET = 'knowledge-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const SUPPORTED_TYPES = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'invalid form data' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string | null)?.trim()

  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file too large (max 10MB)' }, { status: 400 })

  const db = createServiceClient()

  // Ensure storage bucket exists
  const { data: buckets } = await db.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, { public: false })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Extract text for TXT files; other types stored without extraction
  let extractedText: string | null = null
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    extractedText = buffer.toString('utf-8')
  }

  // Upload file to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${auth.workspaceId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { data: uploaded, error: storageErr } = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageErr) {
    console.error('[Knowledge Upload] Storage error:', storageErr.message)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(uploaded.path)

  // Create knowledge document record
  const { data: doc, error: dbErr } = await db
    .from('business_knowledge_documents')
    .insert({
      business_id: auth.workspaceId,
      title,
      content: extractedText,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type || `application/${ext}`,
      status: 'active',
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({
    ...doc,
    text_extracted: extractedText !== null,
    note: extractedText === null
      ? 'File saved. For PDF/DOCX, paste the text content manually to enable AI usage.'
      : undefined,
  }, { status: 201 })
}
