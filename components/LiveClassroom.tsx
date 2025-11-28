import React, { useRef, useState, useEffect } from 'react';
import { connectLiveSession } from '../services/geminiService';
import { LiveServerMessage, Blob } from '@google/genai';

// Audio Encoding/Decoding Utilities
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const LiveClassroom: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Desconectado");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  const startSession = async () => {
    try {
      setStatus("Conectando...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      sessionPromiseRef.current = connectLiveSession(
        () => {
          setStatus("En Vivo");
          setIsActive(true);

          // AUDIO IN STREAMING
          if (inputAudioContextRef.current) {
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createBlob(inputData);
               sessionPromiseRef.current?.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
               });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          }

          // VIDEO FRAME STREAMING
          if (canvasRef.current && videoRef.current) {
             const ctx = canvasRef.current.getContext('2d');
             frameIntervalRef.current = window.setInterval(() => {
                if (videoRef.current && ctx) {
                   canvasRef.current!.width = videoRef.current.videoWidth;
                   canvasRef.current!.height = videoRef.current.videoHeight;
                   ctx.drawImage(videoRef.current, 0, 0);
                   const base64 = canvasRef.current!.toDataURL('image/jpeg', 0.5).split(',')[1];
                   sessionPromiseRef.current?.then(session => {
                      session.sendRealtimeInput({ 
                         media: { mimeType: 'image/jpeg', data: base64 } 
                      });
                   });
                }
             }, 1000); // 1 FPS for video understanding to save bandwidth/latency
          }
        },
        async (message: LiveServerMessage) => {
          // AUDIO OUT HANDLING
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          
          if (base64Audio && outputAudioContextRef.current) {
             const ctx = outputAudioContextRef.current;
             nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
             
             const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 ctx,
                 24000,
                 1
             );

             const source = ctx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(outputNode);
             
             source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
             });

             source.start(nextStartTimeRef.current);
             nextStartTimeRef.current += audioBuffer.duration;
             sourcesRef.current.add(source);
          }
          
          if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
          }
        },
        () => {
            setStatus("Desconectado");
            setIsActive(false);
        },
        (err) => {
            console.error(err);
            setStatus("Error");
        }
      );

    } catch (e) {
      console.error(e);
      setStatus("Error al iniciar sesión");
    }
  };

  const stopSession = () => {
     sessionPromiseRef.current?.then(session => session.close());
     setIsActive(false);
     setStatus("Desconectado");
     if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
     if (inputAudioContextRef.current) inputAudioContextRef.current.close();
     if (outputAudioContextRef.current) outputAudioContextRef.current.close();
     
     // Stop video tracks
     if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
     }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-white">Aula en Vivo</h2>
           <p className="text-slate-400">Práctica conversacional con Gemini 2.5 Live API</p>
        </div>
        <div className="flex items-center gap-4">
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
               status === "En Vivo" ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-slate-700 text-slate-400"
           }`}>
               {status}
           </span>
           {!isActive ? (
               <button onClick={startSession} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   Iniciar Sesión
               </button>
           ) : (
               <button onClick={stopSession} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                   Terminar Sesión
               </button>
           )}
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
         <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline />
         <canvas ref={canvasRef} className="hidden" />
         
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {!isActive && (
                 <div className="text-center p-8">
                     <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                         <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     </div>
                     <p className="text-slate-400">Inicia una sesión para practicar entrevistas de programación en vivo.</p>
                 </div>
             )}
         </div>

         {/* Waveform Animation Placeholder */}
         {isActive && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
                 {[...Array(5)].map((_, i) => (
                     <div key={i} className="w-1 bg-blue-500 animate-[bounce_1s_infinite] rounded-full h-8" style={{ animationDelay: `${i * 0.1}s` }}></div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};