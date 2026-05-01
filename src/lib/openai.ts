import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('[OpenAI] OPENAI_API_KEY must be set')
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export interface KnowledgeDoc {
  id: string
  title: string
  content: string | null
}

export async function generateAiReply(
  customerMessage: string,
  docs: KnowledgeDoc[],
  businessName: string
): Promise<{ reply: string; ok: boolean; usedDocIds: string[]; error?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, reply: '', usedDocIds: [], error: 'no_api_key' }
  }

  const activeDocs = docs.filter(d => d.content?.trim())
  if (activeDocs.length === 0) {
    return { ok: false, reply: '', usedDocIds: [], error: 'no_knowledge' }
  }

  const knowledgeBlock = activeDocs
    .map(d => `=== ${d.title} ===\n${d.content}`)
    .join('\n\n')

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer service assistant for "${businessName}".

IMPORTANT RULES:
1. Answer ONLY based on the business knowledge provided below.
2. If the question cannot be answered from the knowledge, respond EXACTLY with: "אצטרך לבדוק עם הצוות ואחזור אליך בהקדם 🙏"
3. Keep replies concise and friendly.
4. Match the language of the customer's message (Hebrew/English).
5. Never invent information not found in the knowledge base.

BUSINESS KNOWLEDGE:
${knowledgeBlock}`,
        },
        { role: 'user', content: customerMessage },
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ''
    return { ok: true, reply, usedDocIds: activeDocs.map(d => d.id) }
  } catch (err: unknown) {
    const e = err as { message?: string }
    console.error('[OpenAI] generateAiReply error:', e?.message)
    return { ok: false, reply: '', usedDocIds: [], error: e?.message ?? 'unknown' }
  }
}
