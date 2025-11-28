import React, { useState, useRef, useEffect } from 'react';
import { streamChat } from '../services/geminiService';
import { Message, ModelType } from '../types';
import { GenerateContentResponse } from '@google/genai';

export const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "¡Hola estudiante! Soy tu Tutor IA. Puedo ayudarte con problemas de programación complejos, encontrar eventos tecnológicos (Búsqueda) o localizar lugares de estudio (Mapas). ¿En qué puedo ayudarte?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'search' | 'maps' | 'thinking'>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  // Mapeo de nombres para mostrar en la UI
  const modeLabels = {
    standard: 'Estándar',
    search: 'Búsqueda',
    maps: 'Mapas',
    thinking: 'Pensamiento'
  };

  useEffect(() => {
    if (mode === 'maps' && !location) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [mode, location]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isThinking: mode === 'thinking'
    }]);

    try {
      // Determine model and tools
      let model = ModelType.FLASH; // Default
      let tool: 'none' | 'search' | 'maps' = 'none';
      let thinkingBudget = 0;

      if (mode === 'thinking') {
        model = ModelType.PRO;
        thinkingBudget = 32768;
      } else if (mode === 'search') {
        model = ModelType.FLASH; // Flash for search
        tool = 'search';
      } else if (mode === 'maps') {
        model = ModelType.FLASH; // Flash for maps
        tool = 'maps';
      } else {
        // Standard fast chat
        model = ModelType.LITE;
      }

      const stream = await streamChat(
        model,
        messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        userMsg.text,
        tool,
        thinkingBudget,
        location
      );

      let fullText = '';
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullText += text;
        
        // Handle Grounding Metadata
        const grounding = c.candidates?.[0]?.groundingMetadata;

        setMessages(prev => prev.map(m => {
          if (m.id === modelMsgId) {
            return { 
              ...m, 
              text: fullText, 
              groundingMetadata: grounding || m.groundingMetadata 
            };
          }
          return m;
        }));
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Lo siento, encontré un error al procesar tu solicitud.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h2 className="text-lg font-semibold text-white">Chat Tutor</h2>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          {(['standard', 'search', 'maps', 'thinking'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                mode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Display Search/Map Sources */}
              {msg.groundingMetadata?.groundingChunks && (
                <div className="mt-3 pt-3 border-t border-slate-600/50 text-xs">
                  <p className="font-semibold text-slate-400 mb-1">Fuentes:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                      if (chunk.web?.uri) {
                        return (
                          <a key={idx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded text-blue-400 hover:text-blue-300">
                            <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                          </a>
                        );
                      }
                      if (chunk.maps?.uri) {
                         return (
                          <a key={idx} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded text-green-400 hover:text-green-300">
                            <span className="truncate max-w-[150px]">{chunk.maps.title}</span>
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 rounded-2xl rounded-bl-none p-4 flex gap-2 items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'thinking' ? "Haz una pregunta compleja..." : "Escribe tu mensaje..."}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          {mode === 'thinking' && "Modo pensamiento activado (Gemini 3 Pro). Las respuestas pueden tardar más."}
          {mode === 'search' && "Búsqueda activa (Search Grounding)."}
          {mode === 'maps' && "Mapas activos (Maps Grounding)."}
        </p>
      </form>
    </div>
  );
};