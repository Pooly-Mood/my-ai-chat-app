import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ⚠️ SERVICE ROLE solo lato server
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, history = [], clientId = 'anonymous' } = await req.json();

    /* -----------------------------
       1. Salva messaggio utente
    --------------------------------*/
    await saveMessage({
      sessionId: clientId,
      role: 'user',
      content: message
    });

    /* -----------------------------
       2. Embedding messaggio
    --------------------------------*/
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message
    });

    const embedding = embeddingResponse.data[0].embedding;

    /* -----------------------------
       3. Memoria semantica
    --------------------------------*/
    const semanticMemory = await semanticSearch({
      embedding,
      threshold: 0.78,
      count: 5
    });

    /* -----------------------------
       4. Ultima memoria cronologica
    --------------------------------*/
    const recentMemory = await loadSessionMemory(clientId, 10);

    /* -----------------------------
       5. Prompt finale
    --------------------------------*/
    const systemPrompt = `
Sei PoolyAI.
Stile: Arte Mood.
Tono: caldo, diretto, tecnico quando serve.
Materiali ammessi: solo legno naturale e acciaio inox.
Risposte concrete, niente fuffa.
`;

    const messages = [
      { role: 'system', content: systemPrompt },

      ...(semanticMemory?.length
        ? [{
            role: 'system',
            content: `MEMORIA RILEVANTE:\n${semanticMemory
              .map((m: any) => `- ${m.content}`)
              .join('\n')}`
          }]
        : []),

      ...recentMemory.map((m: any) => ({
        role: m.role,
        content: m.content
      })),

      { role: 'user', content: message }
    ];

    /* -----------------------------
       6. OpenAI chat
    --------------------------------*/
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0.6
    });

    const reply = completion.choices[0].message.content;

    /* -----------------------------
       7. Salva risposta AI
    --------------------------------*/
    await saveMessage({
      sessionId: clientId,
      role: 'ai',
      content: 'reply'
    });

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      { reply: 'Errore interno. Riprova.' },
      { status: 500 }
    );
  }
}

/* =====================================================
   SUPABASE MEMORY HELPERS
===================================================== */

async function saveMessage({
  sessionId,
  role,
  content,
  embedding = null
}: {
  sessionId: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  embedding?: number[] | null;
}) {
  const { error } = await supabase.from('memory').insert({
    session_id: sessionId,
    role,
    content,
    embedding
  });

  if (error) throw error;
}

async function loadSessionMemory(sessionId: string, limit = 10) {
  const { data, error } = await supabase
    .from('memory')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function semanticSearch({
  embedding,
  threshold,
  count
}: {
  embedding: number[];
  threshold: number;
  count: number;
}) {
  const { data, error } = await supabase.rpc('match_memory', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count
  });

  if (error) throw error;
  return data || [];
}