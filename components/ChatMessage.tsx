import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full mb-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mx-2 ${isModel ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          {isModel ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
        </div>

        <div 
          className={`p-3 rounded-2xl shadow-md text-sm md:text-base leading-relaxed overflow-hidden 
          ${isModel 
            ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700' 
            : 'bg-emerald-600 text-white rounded-tr-none'
          } ${message.isError ? 'bg-red-900/50 border-red-500' : ''}`}
        >
          <div className="prose prose-invert prose-sm max-w-none">
             <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
