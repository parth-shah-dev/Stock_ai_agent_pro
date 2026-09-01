'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'Best IPO this month?',
  'Top defence stocks India?',
  'Explain F&O risk',
  'Nifty 50 outlook?',
  'Bitcoin price target?',
  'Best mutual funds 2025?',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm your **StockAI Pro** assistant. Ask me anything about stocks, IPOs, crypto, forex, or market analysis!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const json = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: json.reply ?? 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'assistant',
        content: 'Connection error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown renderer
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      line = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:11px">$1</code>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-2xl transition-all duration-300 glow-blue"
        style={{ boxShadow: '0 0 20px rgba(59,130,246,0.4), 0 4px 20px rgba(0,0,0,0.3)' }}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        {!open && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#070B14] pulse-dot" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[520px] glass-bright rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <Bot size={16} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">StockAI Assistant</h4>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-blue-500/30' : 'bg-slate-700'}`}>
                  {m.role === 'user' ? <User size={12} className="text-blue-300" /> : <Bot size={12} className="text-slate-400" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600/30 border border-blue-500/20 text-slate-100'
                    : 'bg-white/5 border border-white/8 text-slate-300'
                }`}>
                  {renderContent(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                  <Bot size={12} className="text-slate-400" />
                </div>
                <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                  <Loader2 size={14} className="text-blue-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="flex-shrink-0 text-xs text-slate-400 bg-white/5 hover:bg-white/10 border border-white/8 rounded-full px-2.5 py-1 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 pt-1 border-t border-white/8">
            <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Ask anything about markets…"
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center transition-all"
              >
                <Send size={12} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
