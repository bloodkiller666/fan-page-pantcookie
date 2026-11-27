'use client';
import React from 'react';
import { MdCheck, MdClose, MdWarning } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import GameDialog from './GameDialog';

interface ScoreOverwriteModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    playerName: string;
    gameType: string;
    oldScore: number;
    newScore: number;
}

export default function ScoreOverwriteModal({ isOpen, onConfirm, onCancel, gameType, oldScore, newScore }: ScoreOverwriteModalProps) {
    const { t } = useLanguage();

    const formatScore = (val: number) => {
        if (gameType === 'puzzle') {
            const mins = Math.floor(val / 60);
            const secs = val % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return val.toString();
    };

    return (
        <GameDialog open={isOpen} onClose={onCancel} title={t('common.overwriteTitle')} icon={<MdWarning />} tone="yellow">
            <p className="text-lg font-medium leading-snug">{t('common.overwriteMessage')}</p>

            <div className="mt-5 flex items-center justify-between gap-3 border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                <span className="font-display text-sm font-bold uppercase text-[var(--muted)]">{t('common.score')}</span>
                <span className="score text-sm sm:text-base">
                    {formatScore(oldScore)} <span aria-hidden>&rarr;</span> <span className="text-[var(--pink)]">{formatScore(newScore)}</span>
                </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <button type="button" onClick={onCancel} className="btn btn--ghost">
                    <MdClose className="text-2xl" aria-hidden />
                    {t('games.puzzle.no')}
                </button>
                <button type="button" onClick={onConfirm} className="btn">
                    <MdCheck className="text-2xl" aria-hidden />
                    {t('common.continue')}
                </button>
            </div>
        </GameDialog>
    );
}
