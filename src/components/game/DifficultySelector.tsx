import React from 'react';
import { MdCheck, MdStar } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

interface DifficultySelectorProps {
    difficulty: string;
    onSelectDifficulty: (difficulty: string) => void;
    disabled: boolean;
}

const LEVELS = [
    { value: 'easy', size: 4, tone: 'cyan' },
    { value: 'medium', size: 6, tone: 'yellow', recommended: true },
    { value: 'hard', size: 8, tone: 'pink' },
] as const;

/** Each option previews the board it creates: a size x size grid of tiles. */
const DifficultySelector = ({ difficulty, onSelectDifficulty, disabled }: DifficultySelectorProps) => {
    const { t } = useLanguage();

    return (
        <div role="radiogroup" aria-label={t('common.difficulty')} className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {LEVELS.map(({ value, size, tone, ...rest }) => {
                const selected = difficulty === value;
                const recommended = 'recommended' in rest;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSelectDifficulty(value)}
                        disabled={disabled && !selected}
                        className={`text-left outline-offset-8 ${disabled && !selected ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                        <div className={`cart-shell ${disabled && !selected ? '' : 'is-interactive'}`}>
                            <div className={`cart ${selected ? `cart--${tone}` : ''}`}>
                                <div className="cart__face flex flex-col items-center gap-5 p-6">
                                    <div
                                        className="grid w-28 gap-[3px] border-[3px] border-[var(--line)] bg-[var(--line)] p-[3px]"
                                        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
                                        aria-hidden
                                    >
                                        {Array.from({ length: size * size }).map((_, i) => (
                                            <span
                                                key={i}
                                                className={`aspect-square ${(Math.floor(i / size) + (i % size)) % 2 ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-display text-2xl font-bold uppercase leading-none">{t(`games.difficultyOptions.${value}`)}</h3>
                                        <p className="score mt-3 text-xs">{size}x{size}</p>
                                    </div>
                                    {selected && (
                                        <span className="tag !bg-[var(--ink)] !text-[var(--yellow)]">
                                            <MdCheck aria-hidden />
                                            OK
                                        </span>
                                    )}
                                </div>
                                <div className="pins" aria-hidden />
                            </div>
                        </div>
                        {recommended && !selected && <span className="tag tag--pink -mt-2 ml-5 relative z-10 inline-flex -rotate-2"><MdStar aria-label="recommended" /></span>}
                    </button>
                );
            })}
        </div>
    );
};

export default DifficultySelector;
