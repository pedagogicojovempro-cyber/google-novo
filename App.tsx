import React, { useState, useEffect, useRef } from 'react';
import { Message, CampaignStrategy } from './types';
import { sendMessageToGemini } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import CampaignDisplay from './components/CampaignDisplay';
import { Send, Zap, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting from the Traffic Manager
    const initialGreeting = async () => {
      setIsLoading(true);
      try {
        const response = await sendMessageToGemini("Olá, vamos começar a criar minha campanha.");
        setMessages([{ role: 'model', text: response.text }]);
      } catch (error) {
        console.error("Init error", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialGreeting();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, strategy]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(userText);
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      
      if (response.strategy) {
        setStrategy(response.strategy);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro ao processar sua resposta. Verifique sua conexão ou a chave de API.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 p-4 shadow-lg z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-500/20 shadow-lg">
              <Zap className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TrafficAds AI</h1>
              <p className="text-xs text-indigo-400 font-medium">Gestor de Tráfego Inteligente</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
             <MousePointer2 size={12} />
             <span>Powered by Gemini 2.5 Flash & 3.0 Pro Image</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
        
        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 scrollbar-hide space-y-6">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full mb-4">
               <div className="flex items-center gap-2 bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
          )}
          
          {/* Strategy Result Card (Appears at the bottom when ready) */}
          {strategy && (
            <div className="pb-4">
              <CampaignDisplay strategy={strategy} />
              <div className="text-center mt-8 p-4 text-slate-500 text-sm">
                <p>A campanha foi gerada! Você pode continuar a conversa acima para refinar ou pedir um Teste A/B.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-3xl mx-auto flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva seu produto, objetivo ou responda ao assistente..."
              disabled={isLoading}
              className="flex-grow bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-5 py-3 font-semibold transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            A IA pode cometer erros. Revise as informações importantes.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
