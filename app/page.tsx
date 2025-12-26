// app/page.tsx
import ChatBox from '@/components/ChatBox';
import { useState } from 'react';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasWelcome, setHasWelcome] = useState(false);
  {
  // ... il tuo codice esistente

  return (
    <main className="min-h-screen ...">
      {/* AGGIUNGI QUESTO IN ALTO PER TEST */}
      <div className="p-10 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">PoolyAI è attivo!</h1>
        <p className="text-xl text-orange-300">Scorri in basso a destra per aprire la chat 🍷</p>
      </div>

      {/* Il resto del tuo codice (pulsante e chat) */}
      <button className="chat-button">PoolyAI</button>
      {/* ... */}
    </main>
  );
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/10 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      {/* Pulsante PoolyAI */}
      <button
        className="chat-button"
        onClick={() => {
          setIsChatOpen(true);
          if (!hasWelcome) setHasWelcome(true);
        }}
        aria-label="Apri PoolyAI"
      >
        PoolyAI
      </button>

      {/* Pannello Chat */}
      <div className={`chat-panel ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="text-white">🍷 PoolyAI</div>
        </div>
        <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} showWelcome={!hasWelcome} />
      </div>

      {/* Overlay per chiudere */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9998]"
          onClick={() => setIsChatOpen(false)}
        />
      )}
    </main>
  );
}