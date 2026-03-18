import React from 'react';
import { FiUser } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

interface PlayerInputProps {
    playerName: string;
    onNameChange: (name: string) => void;
    onStartGame: () => void;
    hideButton?: boolean;
}

const PlayerInput = ({ playerName, onNameChange, onStartGame, hideButton = false }) => {
    const { t } = useLanguage();
    const handleSubmit = (e) => {
        e.preventDefault();
        onStartGame();
    };

    return (
        <div className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-primary/20 shadow-2xl animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-[0.3em] text-primary/70 ml-1" htmlFor="username">
                        {t('common.playerName') || 'Ingresa tu nombre de jugador'}
                    </label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors text-2xl">
                            badge
                        </span>
                        <input
                            id="username"
                            type="text"
                            value={playerName}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder={t('common.placeholderNickname') || 'Escribe tu nickname...'}
                            className="w-full bg-background-dark/30 border-2 border-primary/20 rounded-2xl py-5 pl-14 pr-6 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 font-bold text-lg"
                            required
                        />
                    </div>
                </div>

                {!hideButton && (
                    <button
                        type="submit"
                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-primary via-[#00f2ff] to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-700 text-background-dark font-black text-xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(13,185,242,0.3)] hover:shadow-[0_0_50px_rgba(13,185,242,0.5)] active:scale-[0.98] transform"
                    >
                        {t('games.puzzle.startGame') || 'Comenzar Juego'}
                    </button>
                )}
            </form>
        </div>
    );
};

export default PlayerInput;
