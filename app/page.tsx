'use client';

import { useState, useRef, useEffect } from 'react';
import ChatBox from '@/components/ChatBox';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasWelcome, setHasWelcome] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-black relative">
      {/* Pulsante PoolyAI */}
      <button 
        className="chat-button" 
        onClick={() => {
          setIsChatOpen(!isChatOpen);
          if (!hasWelcome) setHasWelcome(true);
        }}
        aria-label="Apri chat PoolyAI"
      >
        PoolyAI
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div>🟠 PoolyAI</div>
        </div>
        <ChatBox 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          showWelcome={!hasWelcome}
        />
      </div>

      {/* Overlay close */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/50" 
          onClick={() => setIsChatOpen(false)}
        />
      )}
    </main>
  );
}