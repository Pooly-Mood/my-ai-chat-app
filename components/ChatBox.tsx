'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  showWelcome: boolean;
}

export default function ChatBox({ isOpen, onClose, showWelcome }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const response =await fetch (API_URL)

  // Recupera o genera sessionId persistente
  useEffect(() => {
    if (isOpen && !sessionId) {
      let stored = localStorage.getItem('poolyai_session_id');
      if (!stored) {
        stored = crypto.randomUUID();
        localStorage.setItem('poolyai_session_id', stored);
      }
      setSessionId(stored);
    }
  }, [isOpen, sessionId]);

  // Messaggio di benvenuto (solo la prima volta)
  useEffect(() => {
    if (isOpen && showWelcome && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Ciao! 👋 Sono PoolyAI, l'assistente ufficiale di Pooly's Mood.\n\nSiamo specializzati in espositori eleganti e su misura per vini e liquori.\nCome posso aiutarti oggi?",
        },
      ]);
    }
  }, [isOpen, showWelcome, messages.length]);

  // Auto-scroll verso il basso
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    if (!inputValue.trim() || loading || !sessionId) return;

    const userContent = inputValue.trim();
    const userMessage: Message = { role: 'user', content: userContent };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('API_URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          sessionId,
          clientId: getClientId(),
          history: messages, // fallback se Supabase non funziona
        }),
      });

      if (!response.ok) throw new Error('Errore server');

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '😔 Ops! Problema di connessione. Riprova tra qualche secondo.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function getClientId(): string {
    // Priorità: parametro URL → localStorage → anonymous
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('clientId');
    if (fromUrl) return fromUrl;

    let stored = localStorage.getItem('poolyai_client_id');
    if (!stored) {
      stored = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('poolyai_client_id', stored);
    }
    return stored;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role === 'user' ? 'me' : 'ai'} animate-fadeInUp`}
          >
            {msg.content.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))}
          </div>
        ))}

        {loading && (
          <div className="message ai animate-fadeInUp">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <span>PoolyAI sta scrivendo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          className="user-input"
          rows={1}
          disabled={loading}
          autoFocus
        />

        <button
          onClick={sendMessage}
          disabled={loading || !inputValue.trim()}
          className="send-btn"
          aria-label="Invia"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </>
  );
}