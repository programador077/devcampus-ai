import React, { useState } from 'react';
import { generateImage, editImage, generateVideo, generateSpeech } from '../services/geminiService';
import { CreativeMode, ImageConfig, VeoConfig } from '../types';

export const MediaStudio: React.FC = () => {
  const [mode, setMode] = useState<CreativeMode>(CreativeMode.GEN_IMAGE);
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configs
  const [imgConfig, setImgConfig] = useState<ImageConfig>({ aspectRatio: '1:1', size: '1K' });
  const [veoConfig, setVeoConfig] = useState<VeoConfig>({ resolution: '720p', aspectRatio: '16:9' });
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  const modeLabels = {
    [CreativeMode.GEN_IMAGE]: "Generar Imagen",
    [CreativeMode.EDIT_IMAGE]: "Editar Imagen",
    [CreativeMode.GEN_VIDEO]: "Generar Video",
    [CreativeMode.ANIMATE_IMAGE]: "Animar Imagen",
    [CreativeMode.TTS]: "Texto a Voz"
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImage({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      if (mode === CreativeMode.GEN_IMAGE) {
        const res = await generateImage(prompt, imgConfig.aspectRatio, imgConfig.size);
        const imgPart = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imgPart?.inlineData?.data) {
          setResultUrl(`data:image/png;base64,${imgPart.inlineData.data}`);
        } else {
            throw new Error("No se generó imagen");
        }
      } 
      else if (mode === CreativeMode.EDIT_IMAGE) {
        if (!uploadedImage) throw new Error("Sube una imagen para editar");
        const res = await editImage(uploadedImage.base64, uploadedImage.mimeType, prompt);
        const imgPart = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imgPart?.inlineData?.data) {
          setResultUrl(`data:image/png;base64,${imgPart.inlineData.data}`);
        }
      }
      else if (mode === CreativeMode.GEN_VIDEO || mode === CreativeMode.ANIMATE_IMAGE) {
        let vidUrl;
        if (mode === CreativeMode.ANIMATE_IMAGE && uploadedImage) {
            vidUrl = await generateVideo(prompt, veoConfig, uploadedImage.base64, uploadedImage.mimeType);
        } else {
            vidUrl = await generateVideo(prompt, veoConfig);
        }
        setResultUrl(vidUrl);
      }
      else if (mode === CreativeMode.TTS) {
          const res = await generateSpeech(prompt);
          const audioBase64 = res.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioBase64) {
              // Create blob URL for audio playback
              const binary = atob(audioBase64);
              const array = new Uint8Array(binary.length);
              for(let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
              const blob = new Blob([array], {type: 'audio/mp3'}); // approximate mime
              setResultUrl(URL.createObjectURL(blob));
          }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "La generación falló. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-4">Estudio Multimedia</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(CreativeMode).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResultUrl(null); setError(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-8">
        {/* Controls */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="space-y-2">
            <label className="text-slate-400 text-sm font-medium">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === CreativeMode.TTS ? "Texto para hablar..." : "Describe lo que quieres crear..."}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />
          </div>

          {(mode === CreativeMode.EDIT_IMAGE || mode === CreativeMode.ANIMATE_IMAGE) && (
            <div className="space-y-2">
              <label className="text-slate-400 text-sm font-medium">Imagen Fuente</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-purple-400 hover:file:bg-slate-700"
              />
            </div>
          )}

          {mode === CreativeMode.GEN_IMAGE && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-slate-400 text-xs uppercase mb-1 block">Relación de Aspecto</label>
                  <select 
                    value={imgConfig.aspectRatio}
                    onChange={(e) => setImgConfig({...imgConfig, aspectRatio: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm"
                  >
                    {["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-slate-400 text-xs uppercase mb-1 block">Tamaño</label>
                  <select 
                    value={imgConfig.size}
                    onChange={(e) => setImgConfig({...imgConfig, size: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm"
                  >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                  </select>
               </div>
             </div>
          )}

          {(mode === CreativeMode.GEN_VIDEO || mode === CreativeMode.ANIMATE_IMAGE) && (
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-slate-400 text-xs uppercase mb-1 block">Resolución</label>
                    <select 
                        value={veoConfig.resolution}
                        onChange={(e) => setVeoConfig({...veoConfig, resolution: e.target.value as any})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm"
                    >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-slate-400 text-xs uppercase mb-1 block">Relación de Aspecto</label>
                    <select 
                        value={veoConfig.aspectRatio}
                        onChange={(e) => setVeoConfig({...veoConfig, aspectRatio: e.target.value as any})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm"
                    >
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                    </select>
                 </div>
             </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/30 flex justify-center items-center gap-2"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            Generar
          </button>
          
          {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">{error}</div>}
        </div>

        {/* Preview */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden min-h-[400px]">
            {!resultUrl && !isLoading && (
                <div className="text-center text-slate-600">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p>El resultado aparecerá aquí</p>
                </div>
            )}
            
            {isLoading && (
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-400 animate-pulse">Creando obra maestra...</p>
                    {(mode === CreativeMode.GEN_VIDEO || mode === CreativeMode.ANIMATE_IMAGE) && (
                        <p className="text-xs text-slate-500 mt-2">La generación de video puede tardar un momento</p>
                    )}
                </div>
            )}

            {resultUrl && !isLoading && (
                mode === CreativeMode.GEN_VIDEO || mode === CreativeMode.ANIMATE_IMAGE ? (
                    <video controls src={resultUrl} className="max-w-full max-h-full rounded-lg shadow-2xl" autoPlay loop />
                ) : mode === CreativeMode.TTS ? (
                    <div className="text-center p-8 bg-slate-900 rounded-xl">
                        <audio controls src={resultUrl} className="w-96" />
                        <p className="mt-4 text-green-400">Audio Generado</p>
                    </div>
                ) : (
                    <img src={resultUrl} alt="Generado" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                )
            )}
        </div>
      </div>
    </div>
  );
};