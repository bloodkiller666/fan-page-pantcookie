'use client';
import { useEffect, useRef, useState } from 'react';
import { FaTwitter } from 'react-icons/fa';

interface TwitterTimelineProps {
  username: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number | string;
}

export default function TwitterTimeline({ 
  username, 
  theme = 'light', 
  height = 600,
  width = '100%' 
}: TwitterTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reiniciar estados al cambiar props
    setIsLoading(true);
    setHasError(false);

    // 1. Cargar el script de widgets.js si no existe
    const scriptId = 'twitter-wjs';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    }

    // 2. Función para escanear y transformar el anchor tag en widget
    const tryLoadWidget = () => {
        // @ts-ignore
        if (window.twttr && window.twttr.widgets) {
            // @ts-ignore
            window.twttr.widgets.load(containerRef.current);
        }
    };

    // Intentar cargar inmediatamente y periódicamente
    tryLoadWidget();
    const intervalId = setInterval(tryLoadWidget, 1000);

    // 3. Detectar cuando el iframe se ha creado (éxito)
    const checkIframe = setInterval(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
            setIsLoading(false);
            clearInterval(checkIframe);
            clearInterval(intervalId); // Dejar de intentar cargar
        }
    }, 500);

    // 4. Timeout de seguridad (5 segundos)
    const timeoutId = setTimeout(() => {
        clearInterval(checkIframe);
        clearInterval(intervalId);
        setIsLoading(false);
        // Si no hay iframe después de 5s, mostramos fallback
        if (!containerRef.current?.querySelector('iframe')) {
            setHasError(true);
        }
    }, 5000);

    return () => {
        clearInterval(checkIframe);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
  }, [username, theme, height, width]);

  return (
    <div className="w-full flex flex-col items-center justify-center twitter-feed-container relative min-h-[300px] bg-black/50 rounded-xl overflow-hidden">
      
      {/* Estado de Carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 animate-pulse z-10 bg-black/80">
            <span className="text-sm font-bold uppercase tracking-widest">Conectando con X...</span>
        </div>
      )}
      
      {/* Contenedor del Widget (Anchor Tag oficial de Twitter Publish) */}
      <div ref={containerRef} className={`w-full flex justify-center transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          <a 
            className="twitter-timeline" 
            data-theme={theme}
            data-height={height}
            data-width={width}
            data-chrome="noheader nofooter noborders transparent"
            data-lang="es"
            href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
          >
            {/* Texto invisible mientras carga */}
            <span className="opacity-0">Tweets by {username}</span>
          </a>
      </div>

      {/* Fallback / Error UI (Se muestra si falla la carga o hay error 429) */}
      {(!isLoading && (hasError || !containerRef.current?.querySelector('iframe'))) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-black">
              <FaTwitter className="text-4xl text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4 font-bold text-sm uppercase tracking-wider">
                  No se pudo cargar el feed
                  <br/>
                  <span className="text-xs text-gray-600 normal-case">(Posible límite de API o bloqueo de anuncios)</span>
              </p>
              <a 
                  href={`https://twitter.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-2 px-6 rounded-full transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
              >
                  <FaTwitter /> Ver perfil en X
              </a>
          </div>
      )}
    </div>
  );
}
