
import React, { useState, useRef, useEffect } from 'react';
import { chatWithFinBot } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Günaydın! Harcamalarını inceledim. Bu hafta dışarıda yemek harcamaların biraz artmış görünüyor. Tasarruf için bir plan yapalım mı?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithFinBot(history, input);
    setIsTyping(false);
    
    const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: new Date() };
    setMessages(prev => [...prev, modelMsg]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-bg-dark animate-in fade-in duration-500 overflow-hidden">
      <header className="bg-white dark:bg-card-dark px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden border border-secondary/20">
              <img src="https://i.pravatar.cc/150?u=bot" className="w-full h-full object-cover" alt="FinBot" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-card-dark rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">FinBot</h1>
            <p className="text-[10px] text-secondary font-bold flex items-center gap-1 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Çevrimiçi & Analiz Ediyor
            </p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="flex justify-center mb-4">
          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800/50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-slate-100 dark:border-slate-800">Bugün, 09:41</span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-secondary/10 shrink-0 flex items-center justify-center text-secondary mt-auto mb-1 border border-secondary/20">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
            )}
            <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-secondary text-white rounded-br-none' 
                  : 'bg-white dark:bg-card-dark text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-800'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">Şimdi</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-secondary/10 shrink-0 flex items-center justify-center text-secondary mt-auto mb-1 border border-secondary/20">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
            </div>
            <div className="bg-white dark:bg-card-dark px-4 py-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-800">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 bg-white dark:bg-bg-dark border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {['Harcamaları analiz et', 'Tasarruf hedefi koy', 'Borç ödeme planı'].map(chip => (
            <button key={chip} onClick={() => setInput(chip)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-all active:scale-95">
              {chip}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <button className="p-2 text-slate-400 hover:text-secondary"><span className="material-symbols-outlined">add_circle</span></button>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="FinBot'a bir şey sor..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-slate-800 dark:text-slate-100"
          />
          <button onClick={handleSend} className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center shadow-lg shadow-secondary/20 transition-transform active:scale-90">
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatAssistant;
