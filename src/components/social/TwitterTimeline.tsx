'use client';
import { useEffect, useState } from 'react';
import { FaTwitter } from 'react-icons/fa';

interface TwitterTimelineProps {
  username?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number | string;
}

export default function TwitterTimeline({ 
  username = "ShuraHiwa",
  theme = 'dark',
  height = 600,
  width = '100%'
}: TwitterTimelineProps) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // 1. Forzamos la limpieza y carga del script cada vez que el componente se monta
    const script = document.createElement('script');
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);

    // 2. Si en 6 segundos no hay nada dentro del widget, mostramos el botón de auxilio
    const timer = setTimeout(() => {
      const iframe = document.querySelector('.twitter-timeline-rendered');
      if (!iframe) setShowFallback(true);
    }, 6000);

    return () => {
      script.remove();
      clearTimeout(timer);
    };
  }, [username]);

  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center bg-[#050505] rounded-2xl border border-white/5 p-4 overflow-hidden">
      
      {/* INYECCIÓN DIRECTA DE JS/HTML */}
      <div 
        className="w-full flex justify-center"
        dangerouslySetInnerHTML={{
          __html: `
            <a class="twitter-timeline" 
               data-theme="dark" 
               data-height="600" 
               data-chrome="transparent nofooter noborders"
               href="https://twitter.com/${username}?ref_src=twsrc%5Etfw">
               Cargando posts de @${username}...
            </a>
          `
        }}
      />

      {/* Solo aparece si el JS de Twitter falla */}
      {showFallback && (
        <div className="text-center p-8 animate-in fade-in duration-700">
          <FaTwitter className="text-4xl text-[#1DA1F2] mx-auto mb-4" />
          <p className="text-sm text-gray-400 mb-6">X ha bloqueado la conexión directa.</p>
          <a 
            href={`https://x.com/${username}`}
            target="_blank"
            className="bg-[#1DA1F2] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#1a91da] transition-all"
          >
            ABRIR PERFIL EN X
          </a>
        </div>
      )}
    </div>
  );
}