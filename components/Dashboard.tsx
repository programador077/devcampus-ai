import React from 'react';
import { View } from '../App';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative overflow-hidden bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all hover:shadow-2xl text-left"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
    <div className={`w-12 h-12 rounded-lg ${color.replace('from-', 'bg-').split(' ')[0]} bg-opacity-20 flex items-center justify-center mb-4 text-white`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 mb-4">
          Bienvenido a DevCampus
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          Tu campus virtual de programación impulsado por IA. Aprende, crea y practica con los últimos modelos de Gemini.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <FeatureCard
          title="Tutor Inteligente"
          description="Chatea con Gemini 3 Pro. Incluye modo pensamiento para algoritmos complejos, búsqueda de documentación reciente y mapas para reuniones locales."
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          color="from-blue-500 to-cyan-500"
          onClick={() => onViewChange(View.CHAT)}
        />
        <FeatureCard
          title="Práctica de Programación en Vivo"
          description="Practica entrevistas con la API Live de Gemini. Interacción de voz en tiempo real con baja latencia."
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
          color="from-red-500 to-orange-500"
          onClick={() => onViewChange(View.LIVE)}
        />
        <FeatureCard
          title="Estudio Multimedia"
          description="Genera recursos para tus proyectos. Crea imágenes de alta resolución (Pro), videos (Veo) o edita fotos existentes."
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          color="from-purple-500 to-pink-500"
          onClick={() => onViewChange(View.STUDIO)}
        />
        <FeatureCard
          title="Analizador de Contenido"
          description="Sube diagramas de arquitectura, videos de demostración o audio de conferencias para un análisis multimodal instantáneo."
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="from-green-500 to-emerald-500"
          onClick={() => onViewChange(View.ANALYZER)}
        />
      </div>

      <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-2">Estado del Sistema</h3>
        <div className="flex gap-4 flex-wrap text-sm text-slate-400">
          <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Gemini 3 Pro (Activo)</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> API Live (Listo)</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Veo 3.1 (En espera)</span>
        </div>
      </div>
    </div>
  );
};