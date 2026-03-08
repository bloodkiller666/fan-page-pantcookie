'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

interface ScoreOverwriteModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    playerName: string;
    gameType: string;
    oldScore: number;
    newScore: number;
}

export default function ScoreOverwriteModal({
    isOpen,
    onConfirm,
    onCancel,
    playerName,
    gameType,
    oldScore,
    newScore
}: ScoreOverwriteModalProps) {
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-4 border-black dark:border-white relative p-6 text-center"
                    >
                        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-500">
                            <FiAlertTriangle className="text-yellow-600 dark:text-yellow-400" size={40} />
                        </div>

                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-gray-800 dark:text-white">
                            {t('common.overwriteTitle')}
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                            {t('common.overwriteMessage')}
                            <br />
                            <span className="text-sm opacity-70 mt-2 block">
                                ({t('common.score')}: {formatScore(oldScore)} → <span className="text-primary-blue font-bold">{formatScore(newScore)}</span>)
                            </span>
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onCancel}
                                className="py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-black uppercase tracking-widest rounded-xl border-2 border-black hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                            >
                                <FiX size={20} />
                                {t('games.puzzle.no')}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="py-3 px-6 bg-primary-blue text-white font-black uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <FiCheck size={20} />
                                {t('common.continue')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
