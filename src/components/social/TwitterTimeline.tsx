'use client';
import { useEffect, useRef, useState } from 'react';
import { FaTwitter } from 'react-icons/fa';

interface TwitterTimelineProps {
  username: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export default function TwitterTimeline({ 
  username = "ShuraHiwa", 
  theme = 'dark', 
  height = 500 
}: TwitterTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Forzar la carga del script manualmente
    const scriptId = 'twitter-wjs';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // 2. Función para renderizar el widget
    const renderWidget = () => {
      if ((window as any).twttr && (window as any).twttr.widgets) {
        // Limpiamos el contenedor antes de renderizar para evitar duplicados
        if (containerRef.current) {
          containerRef.current.innerHTML = ''; 
          (window as any).twttr.widgets.createTimeline(
            { sourceType: 'profile', screenName: username },
            containerRef.current,
            { theme, height, chrome: 'transparent nofooter' }
          ).then(() => {
            setIsLoading(false);
          });
        }
      }
    };

    // 3. Intentar renderizar cuando el script cargue
    script.addEventListener('load', renderWidget);

    // 4. Si el script ya estaba en la página, intentamos renderizar tras un breve delay
    if ((window as any).twttr) {
      const timer = setTimeout(renderWidget, 500);
      return () => clearTimeout(timer);
    }

    return () => script.removeEventListener('load', renderWidget);
  }, [username, theme, height]);

  return (
    <div className="w-full relative min-h-[300px] flex flex-col items-center">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm z-10 rounded-xl">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-[10px] font-bold tracking-widest text-gray-400">SINCRONIZANDO CON X...</span>
        </div>
      )}

      {/* Este es el contenedor donde el widget aparecerá mágicamente */}
      <div 
        ref={containerRef} 
        className="w-full transition-opacity duration-1000"
        style={{ opacity: isLoading ? 0 : 1 }}
      />

      {/* Fallback de seguridad si después de 8 segundos no hay nada */}
      {!isLoading && !containerRef.current?.innerHTML && (
        <div className="p-6 text-center border border-dashed border-white/10 rounded-xl">
          <FaTwitter className="mx-auto text-2xl text-gray-600 mb-2" />
          <p className="text-xs text-gray-500 mb-4">El feed está tardando en responder.</p>
          <a 
            href={`https://x.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-primary hover:underline"
          >
            VER PERFIL DIRECTO
          </a>
        </div>
      )}
    </div>
  );
}