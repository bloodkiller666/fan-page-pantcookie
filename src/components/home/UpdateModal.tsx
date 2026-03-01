'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiCpu, FiCalendar, FiImage, FiYoutube, FiInfo, FiMusic, FiSmartphone, FiVideo, FiMessageSquare } from 'react-icons/fi';
import { FaGamepad } from "react-icons/fa";
import { BiWorld } from "react-icons/bi";
import { MdSecurity } from "react-icons/md";
import { MdCatchingPokemon } from 'react-icons/md';

export default function UpdateModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const hasSeenUpdate = localStorage.getItem('update_3_4_3_seen');
        if (!hasSeenUpdate) {
            // Small delay to appear after page load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('update_3_4_3_seen', 'true');
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 border-black dark:border-white relative"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-pink to-purple-600 p-6 text-white text-center relative overflow-hidden border-b-4 border-black">
                            <div className="relative z-10">
                                <span className="inline-block px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-white/30 shadow-sm">
                                    Novedades
                                </span>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    Actualización 3.4.4
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center font-medium border-b border-dashed border-gray-300 dark:border-gray-700 pb-4">
                                ¡La Fan Page ha evolucionado! Aquí tienes un resumen de lo nuevo:
                            </p>

                            <div className="grid gap-3">
                                <FeatureItem
                                    icon={<MdCatchingPokemon className="text-red-500" size={24} />}
                                    title="Estilo Pokémon"
                                    desc="Nueva interfaz inspirada en la Pokédex y estética gamer retro."
                                />
                                <FeatureItem
                                    icon={<FiCalendar className="text-blue-500" size={24} />}
                                    title="Calendario Semanal"
                                    desc="Consulta los horarios de stream de ShuraHiwa directamente."
                                />
                                <FeatureItem
                                    icon={<FiYoutube className="text-red-600" size={24} />}
                                    title="Integración YouTube"
                                    desc="Los últimos 3 videos y shorts disponibles en la home."
                                />
                                <FeatureItem
                                    icon={<FiImage className="text-purple-500" size={24} />}
                                    title="Galería Mejorada"
                                    desc="Fotos y fanarts en alta calidad con un visor moderno."
                                />
                                <FeatureItem
                                    icon={<FiVideo className="text-orange-500" size={24} />}
                                    title="Videos Mejorado"
                                    desc="Videos con un reproductor moderno con ajuste de calidad y con pantalla completa."
                                />
                                <FeatureItem
                                    icon={<FiMusic className="text-blue-500" size={24} />}
                                    title="Música Mejorado"
                                    desc="Reproductor estilo Spotify con video de fondo, lyrics incorporados y cinco estilos de barras sonoras."
                                />
                                <FeatureItem
                                    icon={<FaGamepad className="text-purple-500" size={24} />}
                                    title="Integración de Juegos"
                                    desc="Tres juegos integrados: Puzzle, Preguntados y Shura Run"
                                />
                                <FeatureItem
                                    icon={<FiCpu className="text-green-500" size={24} />}
                                    title="Pantcookie IA"
                                    desc="Interactúa con la nueva inteligencia artificial de la comunidad."
                                />
                                <FeatureItem
                                    icon={<FiMessageSquare className="text-purple-500" size={24} />}
                                    title="Mensajes Mejorado"
                                    desc="Puedes escribir tu mensaje y subir tu arte, leerlo en una sección aparte con estilo Padlet."
                                />
                                <FeatureItem
                                    icon={<FiInfo className="text-yellow-500" size={24} />}
                                    title="Sobre De"
                                    desc="Conoce más sobre ShuraHiwa y la historia de los Pantcookies."
                                />
                                <FeatureItem
                                    icon={<BiWorld className="text-lightgreen -500" size={24} />}
                                    title="Idiomas"
                                    desc="Tiene cuatro idiomas: Español, Inglés, Francés y Japonés"
                                />
                                <FeatureItem
                                    icon={<FiSmartphone className="text-lightskyblue-500" size={24} />}
                                    title="Responsive"
                                    desc="Se adapta a cualquier dispositivo (Celular, Tablet y Laptop)"
                                />
                                <FeatureItem
                                    icon={<MdSecurity className="text-firebrick -500" size={24} />}
                                    title="Seguridad y Privacidad"
                                    desc="Términos y condiciones, política de privacidad y cookies"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t-4 border-black dark:border-gray-700 flex justify-center">
                            <button
                                onClick={handleClose}
                                className="w-full py-4 bg-primary-blue text-white font-black uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_black] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <FiCheck size={24} />
                                ¡Entendido!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
            <div className="mt-1 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-1">{desc}</p>
            </div>
        </div>
    );
}
