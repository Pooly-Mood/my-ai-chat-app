'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  showWelcome: boolean;
}

export default function ChatBox({ isOpen, onClose, showWelcome }: ChatBoxProps) {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen && showWelcome) {
      setMessages([{ text: "Ciao! Sono PoolyAI, come posso aiutarti oggi? 😊", sender: 'ai' as const }]);
    }
  }, [isOpen, showWelcome]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function sendMessage() {
    if (!inputValue.trim() || loading) return;

    const userMessage = { text: inputValue, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    const tempInput = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: tempInput,
          history: messages,
          clientId: getClientId()
        })
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'ai' as const }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Ops! Problema di connessione. Riprova fra un attimo.', sender: 'ai' as const }]);
    } finally {
      setLoading(false);
    }
  }

  function getClientId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("clientId") || "anonymous";
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="messages" id="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="message ai p-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span>PoolyAI sta pensando...</span>
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
          placeholder="Digita il tuo messaggio..."
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
