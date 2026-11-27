import React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import GameDialog from './GameDialog';

interface Instruction {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface RulesModalProps {
    isOpen: boolean;
    onContinue: () => void;
    title: string;
    icon: React.ReactNode;
    instructions: Instruction[];
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onContinue, title, icon, instructions }) => {
    const { t } = useLanguage();

    return (
        <GameDialog open={isOpen} title={title} icon={icon} tone="pink">
            <ul className="space-y-5">
                {instructions.map((inst, index) => (
                    <li key={index} className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--yellow)] text-2xl text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)]" aria-hidden>
                            {inst.icon}
                        </span>
                        <div>
                            <h3 className="font-display text-lg font-bold uppercase leading-tight">{inst.title}</h3>
                            <p className="mt-1 text-base leading-snug text-[var(--muted)]">{inst.description}</p>
                        </div>
                    </li>
                ))}
            </ul>

            <button type="button" onClick={onContinue} className="btn mt-8 w-full">
                {t('games.puzzle.continue') || 'Continuar'}
                <MdPlayArrow className="text-2xl" aria-hidden />
            </button>
        </GameDialog>
    );
};

export default RulesModal;
