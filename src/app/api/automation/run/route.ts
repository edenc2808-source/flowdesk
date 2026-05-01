import { NextRequest, NextResponse } from 'next/server'
import { processPendingJobs } from '@/lib/automation'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const result = await processPendingJobs()

  return NextResponse.json({
    ok: true,
    ...result,
    duration_ms: Date.now() - start,
    ts: new Date().toISOString(),
  })
}
