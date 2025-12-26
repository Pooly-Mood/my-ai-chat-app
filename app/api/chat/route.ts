// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: providedSessionId, clientId = 'anonymous', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Messaggio mancante o non valido' }, { status: 400 });
    }

    const sessionId = providedSessionId || uuidv4();

    // Recupera conversazione esistente
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('messages')
      .eq('client_id', clientId)
      .eq('session_id', sessionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Errore Supabase fetch:', fetchError);
    }

    const previousMessages = existing?.messages || history || [];

    // Messaggi per OpenAI
    const messagesForAI = [
      {
        role: 'system' as const,
        content: `Sei PoolyAI, l'assistente ufficiale di Pooly's Mood – azienda italiana specializzata in espositori eleganti per vini e liquori.
CATALOGO PRINCIPALE:
1. Art Wall
2. Wall Bar
3. Scaffal
4. Cantinetta
5. Concept Capricci
6. Carrello
7. Arredi su misura
8. Allestimenti personalizzati

Contatti: pooly.s_mood@outlook.com | +39 123 456 789

Rispondi in italiano, in modo professionale, gentile e utile. .`
      },
      ...previousMessages,
      { role: 'user' as const, content: message }
    ].slice(-20); // Limita contesto

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForAI,
      temperature: 0.7,
    });

    const aiReply = response.choices[0]?.message?.content?.trim() || 'Mi dispiace, non ho capito.';

    // Aggiorna conversazione
    const updatedMessages = [
      ...previousMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: aiReply }
    ];

    await supabase
      .from('conversations')
      .upsert({
        client_id: clientId,
        session_id: sessionId,
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id,session_id' });

    return NextResponse.json({
      reply: aiReply,
      sessionId,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { reply: 'Ops! Servizio momentaneamente non disponibile. Riprova tra poco.' },
      { status: 500 }
    );
  }
}