import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], clientId, sessionId } = await request.json();

    // Genera/mantiene session ID
    let currentSessionId = sessionId || uuidv4();
    
    // Carica memoria esistente
    let conversation = { messages: [] as any[] };
    if (currentSessionId) {
      const { data } = await supabase
        .from('conversations')
        .select('messages')
        .eq('session_id', currentSessionId)
        .eq('client_id', clientId)
        .single();
      
      if (data?.messages) {
        conversation.messages = data.messages;
      }
    }

    // Prepara messaggi per OpenAI (usa tua memoria!)
    const messagesForAI = [
      {
        role: "system",
        content: `Sei PoolyAI, assistente ufficiale Pooly's Mood (espositori vino/liquori legno+acciaio inox). 
        CATALOGO UFFICIALE:
        1. Art Wall (180x120x30cm, 24 bott)
        2. Vetrina Wall Bar
        3. Scaffal/Saffal (150x80x35cm, 30 bott)
        4. Cantinetta Cut Art
        5. Concept Capricci (120x60x40cm, 20 bott)
        6. Carrello Banchetti
        7. Arredi
        8. Allestimenti Pooly's Mood
        
        Stile: diretto, professionale, concreto. Chiedi: locale, spazio, prodotto, budget, obiettivo.
        Contatti: pooly.s_mood@outlook.com | +39 123 456 789
        MEMORIA conversazioni passate: ${JSON.stringify(conversation.messages.slice(-20))}`
      },
      ...conversation.messages.slice(-20), // Ultimi 20 msg
      { role: "user", content: message }
    ];

    // Chiama OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForAI,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = response.choices[0].message.content || "Mi dispiace, non ho capito.";

    // Salva in Supabase
    const newMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };
    const aiMessage = {
      role: "assistant",
      content: aiReply,
      timestamp: new Date().toISOString()
    };

    // Crea/aggiorna conversazione
    const { error } = await supabase
      .from('conversations')
      .upsert({
        client_id: clientId,
        session_id: currentSessionId,
        messages: [...conversation.messages, newMessage, aiMessage].slice(-100) // Max 100 msg
      }, { onConflict: 'session_id,client_id' });

    if (error) console.error('Supabase error:', error);

    return NextResponse.json({
      reply: aiReply,
      sessionId: currentSessionId
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { reply: "Ops! Problema tecnico. Riprova fra un secondo." },
      { status: 500 }
    );
  }
}