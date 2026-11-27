import React from 'react';
import { MdBadge } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

interface PlayerInputProps {
    playerName: string;
    onNameChange: (name: string) => void;
    onStartGame: () => void;
    hideButton?: boolean;
}

const PlayerInput = ({ playerName, onNameChange, onStartGame, hideButton = false }: PlayerInputProps) => {
    const { t } = useLanguage();
    const [honeypot, setHoneypot] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Silently reject bots that fill the hidden field
        if (honeypot) return;
        onStartGame();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input
                type="text"
                name="contactPhone"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
            />

            <div>
                <label className="mb-2 block font-display text-sm font-bold uppercase tracking-[0.12em]" htmlFor="username">
                    {t('common.playerName') || 'Nombre del jugador'}
                </label>
                <div className="relative">
                    <MdBadge className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--muted)]" aria-hidden />
                    <input
                        id="username"
                        type="text"
                        value={playerName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder={t('common.placeholderNickname') || 'Escribe tu nickname...'}
                        maxLength={24}
                        autoComplete="nickname"
                        className="w-full border-[3px] border-[var(--line)] bg-[var(--surface-2)] py-4 pl-14 pr-4 font-display text-xl font-bold text-[var(--text)] shadow-[inset_4px_4px_0_rgba(0,0,0,0.12)] placeholder:font-medium placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                        required
                    />
                </div>
            </div>

            {!hideButton && (
                <button type="submit" className="btn w-full !text-lg">
                    {t('games.puzzle.startGame') || 'Comenzar Juego'}
                </button>
            )}
        </form>
    );
};

export default PlayerInput;
