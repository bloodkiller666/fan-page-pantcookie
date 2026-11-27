'use client';
import React from 'react';
import { MdLogout, MdPauseCircle, MdPlayArrow, MdRefresh } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import GameDialog from './GameDialog';

interface PauseMenuProps {
    isOpen: boolean;
    onResume: () => void;
    onRestart: () => void;
    onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ isOpen, onResume, onRestart, onExit }) => {
    const { t } = useLanguage();

    return (
        <GameDialog open={isOpen} onClose={onResume} title={t('games.puzzle.pause') || 'PAUSA'} icon={<MdPauseCircle />} tone="cyan">
            <p className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t('games.puzzle.pauseSubtitle')}</p>

            <div className="flex flex-col gap-4">
                <button type="button" onClick={onResume} className="btn btn--cyan w-full justify-between">
                    <span className="flex items-center gap-3"><MdPlayArrow className="text-2xl" aria-hidden />{t('games.puzzle.continue') || 'Continuar'}</span>
                </button>
                <button type="button" onClick={onRestart} className="btn btn--yellow w-full justify-between">
                    <span className="flex items-center gap-3"><MdRefresh className="text-2xl" aria-hidden />{t('games.puzzle.restart') || 'Reiniciar'}</span>
                </button>
                <button type="button" onClick={onExit} className="btn btn--ghost w-full justify-between">
                    <span className="flex items-center gap-3"><MdLogout className="text-2xl" aria-hidden />{t('games.puzzle.exit') || 'Salir'}</span>
                </button>
            </div>

            <div className="mt-6 border-t-[3px] border-[var(--line)] pt-4">
                <p className="font-display text-base font-bold uppercase">{t('games.puzzle.pauseHintTitle')}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{t('games.puzzle.pauseHintDesc')}</p>
            </div>
        </GameDialog>
    );
};

export default PauseMenu;
