'use client';
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MdChevronRight, MdClose, MdInfo, MdLogout, MdPauseCircle, MdPlayArrow, MdRefresh, MdReplay } from 'react-icons/md';

interface PauseMenuProps {
    isOpen: boolean;
    onResume: () => void;
    onRestart: () => void;
    onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ isOpen, onResume, onRestart, onExit }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 backdrop-blur-md bg-[#101e22]/80 animate-fade-in overflow-y-auto overflow-x-hidden pt-10 md:pt-4">
            <div className="relative w-full max-w-sm bg-[#101e22] border-2 border-[#0db9f2]/30 rounded-xl shadow-2xl shadow-[#0db9f2]/20 overflow-hidden animate-fade-in-up my-auto transition-all">
                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0db9f2]/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0db9f2]/20 blur-3xl rounded-full"></div>

                <div className="relative p-8 flex flex-col items-center">
                    {/* Icon Header */}
                    <div className="mb-6 bg-[#0db9f2]/10 p-4 rounded-full border border-[#0db9f2]/30">
                        <MdPauseCircle className="text-5xl text-[#0db9f2]" />
                    </div>

                    {/* Title Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-white text-6xl font-black leading-tight tracking-tighter uppercase italic">
                            {t('games.puzzle.pause') || 'PAUSA'}
                        </h1>
                        <div className="h-1 w-24 bg-[#0db9f2] mx-auto rounded-full mt-2"></div>
                        <p className="text-slate-400 mt-4 text-lg font-medium">{t('games.puzzle.pauseSubtitle')}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex flex-col gap-4">
                        {/* CONTINUAR (Azul) */}
                        <button
                            onClick={onResume}
                            className="group flex items-center justify-between w-full h-16 px-6 bg-[#0db9f2] hover:bg-[#0db9f2]/90 text-[#101e22] rounded-xl transition-all duration-200 shadow-lg shadow-[#0db9f2]/25 active:scale-95"
                        >
                            <span className="flex items-center gap-3">
                                <MdPlayArrow className="font-bold" />
                                <span className="text-xl font-black tracking-wide uppercase">{t('games.puzzle.continue') || 'Continuar'}</span>
                            </span>
                            <MdChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                            onClick={onRestart}
                            className="group flex items-center justify-between w-full h-16 px-6 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#101e22] rounded-xl transition-all duration-200 active:scale-95"
                        >
                            <span className="flex items-center gap-3">
                                <MdRefresh className="font-bold" />
                                <span className="text-xl font-black tracking-wide uppercase">{t('games.puzzle.restart') || 'Reiniciar'}</span>
                            </span>
                            <MdReplay className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                            onClick={onExit}
                            className="group flex items-center justify-between w-full h-16 px-6 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-xl transition-all duration-200 active:scale-95"
                        >
                            <span className="flex items-center gap-3">
                                <MdLogout className="font-bold" />
                                <span className="text-xl font-black tracking-wide uppercase">{t('games.puzzle.exit') || 'Salir'}</span>
                            </span>
                            <MdClose className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                    {/* Info Card */}
                    <div className="mt-8 w-full p-4 rounded-lg bg-[#0db9f2]/5 border border-[#0db9f2]/20 flex items-center gap-4">
                        <div className="bg-[#0db9f2]/20 p-2 rounded-lg">
                            <MdInfo className="text-[#0db9f2]" />
                        </div>
                        <div>
                            <p className="text-slate-100 text-sm font-bold">{t('games.puzzle.pauseHintTitle')}</p>
                            <p className="text-slate-400 text-xs">{t('games.puzzle.pauseHintDesc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PauseMenu;
