'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function LoadingScreen() {
    const [counter, setCounter] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [statusText, setStatusText] = useState('INICIANDO SISTEMA...');
    const containerRef = useRef<HTMLDivElement>(null);

    // Mapeo de mensajes por porcentaje
    const loadingMessages = [
        { pct: 0, text: "DESCARGANDO ACTUALIZACIÓN..." },
        { pct: 20, text: "INSTALANDO ACTUALIZACIÓN..." },
        { pct: 45, text: "CARGANDO SISTEMA..." },
        { pct: 70, text: "PREPARANDO SISTEMA..." },
        { pct: 90, text: "SISTEMA COMPLETADO." },
    ];

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            const timer = setInterval(() => {
                setCounter(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);

                        setTimeout(() => {
                            tl.to(containerRef.current, {
                                yPercent: -100,
                                duration: 1.5,
                                ease: "power4.inOut",
                                onComplete: () => {
                                    setIsVisible(false);
                                    window.dispatchEvent(new Event('loading_complete'));
                                }
                            });
                        }, 800);

                        return 100;
                    }

                    const nextVal = prev + 1;

                    // Actualizar el texto según el porcentaje
                    const currentMessage = [...loadingMessages].reverse().find(m => nextVal >= m.pct);
                    if (currentMessage) setStatusText(currentMessage.text);

                    return nextVal;
                });
            }, 60); // 60ms * 100 = ~6 segundos

            return () => clearInterval(timer);
        }, containerRef);

        return () => ctx.revert();
    }, [isMounted]);

    if (!isMounted || !isVisible) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-[#1a0f16] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Logo de Fondo */}
            <div className="relative">
                <div className="text-[15vw] font-black text-white/[0.03] uppercase tracking-tighter select-none leading-none">
                    SHAKEGANG
                </div>

                {/* Contador Central */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl md:text-[10vw] font-black text-primary-pink tracking-tighter italic drop-shadow-[0_0_20px_rgba(255,0,127,0.4)]">
                        {counter}%
                    </span>
                </div>
            </div>

            {/* Mensajes Dinámicos Inferiores */}
            <div className="absolute bottom-16 left-10 right-10 flex flex-col items-center text-primary-pink font-pixel text-[8px] uppercase tracking-[0.4em]">
                <div className="overflow-hidden h-5">
                    <p key={statusText} className="animate-fade-in-up">
                        {statusText}
                    </p>
                </div>
            </div>

            {/* Footer Información */}
            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end text-white/10 font-mono text-[9px] uppercase tracking-[0.2em]">
                <div>
                    <div>System.v2026</div>
                    <div>Core: v3.0.4_alpha</div>
                </div>
                <div className="text-right">
                    <div>© 2026 Shura Hiwa</div>
                    <div>Connection: Stable</div>
                </div>
            </div>

            {/* Barra de progreso inferior */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-primary-pink transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(255,0,127,0.8)]"
                style={{ width: `${counter}%` }}
            />
        </div>
    );
}
