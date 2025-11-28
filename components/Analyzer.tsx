import React, { useState } from 'react';
import { analyzeContent, transcribeAudio } from '../services/geminiService';

export const Analyzer: React.FC = () => {
  const [file, setFile] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('Analiza este contenido en detalle.');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFile({
          base64,
          mimeType: f.type,
          preview: URL.createObjectURL(f)
        });
        setAnalysis('');
      };
      reader.readAsDataURL(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setAnalysis('');

    try {
      let res;
      if (file.mimeType.startsWith('audio/')) {
        // Transcribe specifically
        res = await transcribeAudio(file.base64, file.mimeType);
      } else {
        // Image or Video Analysis (Gemini 3 Pro)
        res = await analyzeContent(
            'gemini-3-pro-preview', 
            prompt,
            [{ inlineData: { data: file.base64, mimeType: file.mimeType } }]
        );
      }

      setAnalysis(res.response.text);
    } catch (e: any) {
      console.error(e);
      setAnalysis("Error analizando el contenido. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Analizador de Contenido</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center border-dashed border-2 hover:border-blue-500/50 transition-colors">
             <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
             />
             <label htmlFor="file-upload" className="cursor-pointer block">
                {file ? (
                    <div className="space-y-4">
                        {file.mimeType.startsWith('image') && <img src={file.preview} className="max-h-64 mx-auto rounded-lg" />}
                        {file.mimeType.startsWith('video') && <video src={file.preview} className="max-h-64 mx-auto rounded-lg" controls />}
                        {file.mimeType.startsWith('audio') && <audio src={file.preview} controls className="mx-auto" />}
                        <p className="text-green-400 font-medium">Archivo listo para análisis</p>
                    </div>
                ) : (
                    <>
                        <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-slate-400">Subir Imagen, Video o Audio</p>
                    </>
                )}
             </label>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-sm">Instrucción</label>
            <input 
               type="text" 
               value={prompt} 
               onChange={(e) => setPrompt(e.target.value)}
               className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            />
          </div>

          <button
             onClick={handleAnalyze}
             disabled={!file || isLoading}
             className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
             {isLoading ? "Analizando..." : "Analizar Contenido"}
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[300px]">
           <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">Resultados (Gemini 3 Pro)</h3>
           {isLoading ? (
               <div className="space-y-3 animate-pulse">
                   <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                   <div className="h-2 bg-slate-700 rounded w-full"></div>
                   <div className="h-2 bg-slate-700 rounded w-5/6"></div>
               </div>
           ) : (
               <div className="prose prose-invert prose-sm max-w-none">
                   {analysis ? <p>{analysis}</p> : <p className="text-slate-600 italic">Sin análisis aún.</p>}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};