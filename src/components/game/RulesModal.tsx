import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MdPlayArrow } from 'react-icons/md';

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

const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onContinue,
  title,
  icon,
  instructions
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="bg-slate-900/80 backdrop-blur-xl w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-primary/20 animate-fade-in-up">
        {/* Header Section */}
        <header className="p-8 border-b border-primary/20 flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 p-4 rounded-full border border-primary/30 flex items-center justify-center text-white text-5xl">
            {icon}
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 uppercase italic leading-none">{title}</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full shadow-[0_0_10px_rgba(13,185,242,0.5)]"></div>
          </div>
        </header>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          <p className="text-slate-500 text-center text-xs uppercase tracking-[0.2em] font-black">
            {t('Instrucciones de Juego') || 'Instrucciones de Juego'}
          </p>
          <div className="space-y-4">
            {instructions.map((inst, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 group hover:border-primary/40 transition-all duration-300 transform hover:translate-x-1"
              >
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-primary/20 shadow-inner text-white text-2xl">
                  {inst.icon}
                </div>
                <div>
                  <h4 className="text-slate-100 font-bold text-lg leading-tight mb-1">{inst.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{inst.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-8 pt-0 mt-auto">
          <button
            onClick={onContinue}
            className="w-full bg-[#ff007a] text-white font-black py-5 px-6 rounded-2xl uppercase tracking-[0.2em] text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,122,0.4)] hover:shadow-[0_0_35px_rgba(255,0,122,0.6)] flex items-center justify-center gap-3 group"
          >
            {t('games.puzzle.continue') || 'Continuar'}
            <MdPlayArrow className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Background Abstract Pattern */}
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(13,185,242,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,0,122,0.15)_0%,_transparent_50%)]"></div>
      </div>
    </div>
  );
};

export default RulesModal;
