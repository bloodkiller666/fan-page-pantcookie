'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function UpdateModal({ parentLoading }: { parentLoading: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (parentLoading) return;

        const hasSeenUpdate = localStorage.getItem('update_3_7_6_seen');
        if (!hasSeenUpdate) {
            // Se muestra un poco después de que termine la carga principal
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [parentLoading]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('update_3_7_6_seen', 'true');
    };

    if (!mounted) return null;

    return createPortal(
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto pt-32">
                    <div
                        className="bg-white dark:bg-[#0f1115] w-full max-w-lg rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-black dark:border-white/10 relative animate-fade-in-up mb-20"
                    >
                        {/* Header Premium */}
                        <div className="bg-gradient-to-br from-[#ff007a] via-[#7000ff] to-[#00f3ff] p-8 text-white text-center relative overflow-hidden border-b-4 border-black">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            <div className="relative z-10">
                                <span className="inline-block px-4 py-1.5 bg-black/30 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-3 border border-white/20 shadow-xl">
                                    System v3.7.6
                                </span>
                                <h1 className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                                    Novedades
                                </h1>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all hover:rotate-90 text-white border border-white/10 z-50 cursor-pointer"
                                aria-label="Close"
                            >
                                <i className="hn hn-times text-2xl" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[55vh] overflow-y-auto custom-scrollbar bg-grid-light dark:bg-grid-white">
                            <div className="space-y-6">
                                <SectionItem
                                    icon={<i className="hn hn-retro-pc text-neon-pink" />}
                                    title="Inicio"
                                    desc="Mejoras en la carga y bienvenida al sitio."
                                />
                                <SectionItem
                                    icon={<i className="hn hn-music text-neon-cyan" />}
                                    title="Multimedia"
                                    desc="Buscador inteligente y letras automáticas."
                                />
                                <SectionItem
                                    icon={<i className="hn hn-gaming text-neon-volt" />}
                                    title="Juegos"
                                    desc="Registro obligatorio para mayor seguridad."
                                />
                                <SectionItem
                                    icon={<i className="hn hn-message text-purple-500" />}
                                    title="Mensajes"
                                    desc="Soporte total de emojis y muro optimizado."
                                />
                                <SectionItem
                                    icon={<i className="hn hn-retro-pc text-blue-500" />}
                                    title="General"
                                    desc="Mejoras de rendimiento y diseño móvil."
                                />
                                <SectionItem
                                    icon={<i className="hn hn-lock text-red-500" />}
                                    title="Legal"
                                    desc="Actualización de términos y privacidad."
                                />
                            </div>
                        </div>

                        {/* Footer Moderno */}
                        <div className="p-8 bg-gray-50 dark:bg-black/40 border-t-4 border-black dark:border-white/5 flex flex-col gap-4">
                            <button
                                onClick={handleClose}
                                className="w-full py-5 bg-[#7000ff] hover:bg-[#8215ff] text-white font-black uppercase tracking-[0.2em] rounded-2xl border-b-8 border-black shadow-2xl transition-all active:border-b-0 active:translate-y-2 group flex items-center justify-center gap-3"
                            >
                                <i className="hn hn-check text-3xl group-hover:scale-125 transition-transform" />
                                Acceder al Sistema
                            </button>
                            <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest opacity-50">
                                ShakeGang Community Network • 2026
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}

function SectionItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-center gap-5 p-4 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 border-2 border-transparent hover:border-black dark:hover:border-white/20 transition-all group">
            <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform text-2xl">
                {icon}
            </div>
            <div>
                <h4 className="font-black text-gray-900 dark:text-white text-base uppercase italic tracking-tight">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">{desc}</p>
            </div>
        </div>
    );
}
