'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  showWelcome: boolean;
}

type Message = {
  text: string;
  sender: 'user' | 'ai';
};

export default function ChatBox({ isOpen, showWelcome }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && showWelcome) {
      setMessages([
        { text: 'Ciao! Sono PoolyAI, come posso aiutarti oggi? 😊', sender: 'ai' }
      ]);
    }
  }, [isOpen, showWelcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: messages })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'ai' }]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { text: 'Errore di connessione. Riprova.', sender: 'ai' }
      ]);
    } finally {
      setLoading(false);
    }
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
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="message ai">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>PoolyAI sta pensando…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi qui…"
          className="user-input"
          rows={1}
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !inputValue.trim()}
          className="send-btn"
        >
          {loading ? '⏳' : 'Invia'}
        </button>
      </div>
    </>
  );
}
