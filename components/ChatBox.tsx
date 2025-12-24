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
    // 🔍 DEBUG: Log raw body
    const rawBody = await request.text();
    console.log('📥 RAW BODY:', rawBody);
    
    const body = JSON.parse(rawBody);
    console.log('📦 PARSED BODY:', body);
    
    const { message, history = [], clientId = 'anonymous', sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: 'No message' }, { status: 400 });
    }

    // Session ID
    const currentSessionId = sessionId || uuidv4();
    
    // Supabase memory (semplificato per test)
    let conversationMessages: any[] = [];
    
    // OpenAI con catalogo Pooly
    const messagesForAI = [
      {
        role: "system",
        content: `Sei PoolyAI ufficiale Pooly's Mood (espositori vino/liquori). 
        CATALOGO: 1.Art Wall 2.Wall Bar 3.Scaffal 4.Cantinetta 5.Concept Capricci 6.Carrello 7.Arredi 8.Allestimenti
        Contatti: pooly.s_mood@outlook.com | +39 123 456 789`
      },
      ...conversationMessages.slice(-10),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForAI,
    });

    const aiReply = response.choices[0].message?.content || 'Errore AI';

    // Salva Supabase (opzionale per ora)
    await supabase.from('conversations').upsert({
      client_id: clientId,
      session_id: currentSessionId,
      messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }]
    }).match(console.error);

    console.log('✅ Reply inviata:', aiReply.substring(0, 50));

    return NextResponse.json({
      reply: aiReply,
      sessionId: currentSessionId
    });

  } catch (error: any) {
    console.error('💥 API ERROR:', error);
    return NextResponse.json(
      { reply: 'Ops! Server momentaneamente indisponibile.', error: error.message },
      { status: 500 }
    );
  }
}