// app/page.tsx
import ChatBox from '@/components/ChatBox';
import { useState } from 'react';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasWelcome, setHasWelcome] = useState(false);

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