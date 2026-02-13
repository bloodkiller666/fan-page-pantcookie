'use client';
import { useEffect, useRef, useState } from 'react';
import { FaTwitter } from 'react-icons/fa';
import Script from 'next/script'; // Importante usar el componente de Next

interface TwitterTimelineProps {
  username: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export default function TwitterTimeline({ 
  username = "ShuraHiwa", // El usuario que pusiste en publish
  theme = 'dark', 
  height = 600 
}: TwitterTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Esta función fuerza a Twitter a buscar el enlace y convertirlo en widget
  const loadWidget = () => {
    if ((window as any).twttr && (window as any).twttr.widgets) {
      (window as any).twttr.widgets.load();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Si el script ya estaba cargado (por navegación interna), forzamos carga
    loadWidget();
  }, [username]);

  return (
    <div className="relative w-full flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <span className="text-xs font-bold animate-pulse text-primary">CARGANDO FEED...</span>
        </div>
      )}

      {/* El código exacto que te dio Twitter, pero adaptado a React */}
      <a 
        className="twitter-timeline" 
        data-height={height}
        data-theme={theme}
        data-chrome="noheader nofooter noborders transparent"
        href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
      >
        Tweets by @{username}
      </a>

      {/* Carga el script de forma optimizada */}
      <Script 
        src="https://platform.twitter.com/widgets.js" 
        strategy="lazyOnload"
        onLoad={loadWidget}
      />

      {/* Botón de Fallback en caso de que X bloquee la IP del usuario */}
      {!isLoading && (
        <div className="mt-4">
           <a 
            href={`https://twitter.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-500 hover:text-primary transition-colors flex items-center gap-2"
          >
            <FaTwitter /> ¿No ves los tweets? Ver en X.com
          </a>
        </div>
      )}
    </div>
  );
}