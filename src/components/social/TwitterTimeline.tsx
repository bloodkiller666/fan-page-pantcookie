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
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';
    setIsLoading(true);
    setHasError(false);

    // Timeout de seguridad: Si en 5 segundos no ha cargado, mostrar opción de error/fallback
    const timeoutId = setTimeout(() => {
        setIsLoading(false);
        // No marcamos error automáticamente, pero dejamos de mostrar "Cargando"
        // para que el usuario vea el botón de fallback si el widget no apareció.
    }, 5000);

    const initWidget = () => {
      if ((window as any).twttr && (window as any).twttr.widgets) {
        (window as any).twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: username
          },
          containerRef.current,
          {
            theme: theme,
            height: height,
            width: width,
            chrome: 'noheader nofooter noborders transparent',
            lang: 'es'
          }
        ).then((el: any) => {
           clearTimeout(timeoutId);
           setIsLoading(false);
           if (!el) {
               console.warn('Twitter widget returned null element');
               setHasError(true);
           }
        }).catch((err: any) => {
            clearTimeout(timeoutId);
            console.error('Twitter widget error:', err);
            setIsLoading(false);
            setHasError(true);
        });
      }
    };

    const scriptId = 'twitter-wjs';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
          clearTimeout(timeoutId);
          setIsLoading(false);
          setHasError(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initWidget, 100);
    }

    return () => clearTimeout(timeoutId);
  }, [username, theme, height, width]);

  return (
    <div className="w-full flex flex-col items-center justify-center twitter-feed-container relative min-h-[300px] bg-black/50 rounded-xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 animate-pulse z-10 bg-black/80">
            <span className="text-sm font-bold uppercase tracking-widest">Conectando con X...</span>
        </div>
      )}
      
      <div ref={containerRef} className={`w-full flex justify-center transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />

      {/* Fallback siempre visible si hay error o si el contenedor está vacío tras carga */}
      {(!isLoading && (hasError || !containerRef.current?.firstChild)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
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
