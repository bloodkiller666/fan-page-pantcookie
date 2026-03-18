import { useLanguage } from '../../context/LanguageContext';

const DifficultySelector = ({ difficulty, onSelectDifficulty, disabled }) => {
    const { t } = useLanguage();
    const difficulties = [
        { 
            value: 'easy', 
            label: t('games.difficultyOptions.easy'), 
            grid: '4x4', 
            icon: 'potted_plant',
            color: 'from-primary to-cyan-400' 
        },
        { 
            value: 'medium', 
            label: t('games.difficultyOptions.medium'), 
            grid: '6x6', 
            icon: 'bolt',
            recommended: true,
            color: 'from-primary to-blue-500' 
        },
        { 
            value: 'hard', 
            label: t('games.difficultyOptions.hard'), 
            grid: '8x8', 
            icon: 'psychology',
            color: 'from-primary to-indigo-600' 
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {difficulties.map((diff) => (
                <button
                    key={diff.value}
                    onClick={() => onSelectDifficulty(diff.value)}
                    disabled={disabled}
                    className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-500 border-2 overflow-hidden 
                        ${difficulty === diff.value 
                            ? 'bg-primary/10 border-primary shadow-[0_0_25px_rgba(13,185,242,0.2)] scale-[1.02]' 
                            : 'bg-white/5 dark:bg-slate-900/40 border-primary/20 hover:border-primary/50 backdrop-blur-md'
                        } 
                        ${disabled && difficulty !== diff.value ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                    `}
                >
                    {/* Icon with Glow Effect */}
                    <div className={`mb-6 p-4 rounded-full transition-all duration-500 
                        ${difficulty === diff.value 
                            ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(13,185,242,0.4)]' 
                            : 'bg-primary/10 text-primary opacity-60 group-hover:opacity-100 group-hover:scale-110'
                        }`}
                    >
                        <span className="material-symbols-outlined text-5xl leading-none">
                            {diff.icon}
                        </span>
                    </div>

                    {/* Label and Grid */}
                    <div className="text-center relative z-10">
                        <h3 className={`text-2xl font-black uppercase italic tracking-tighter mb-1 transition-colors 
                            ${difficulty === diff.value ? 'text-primary' : 'text-slate-300'}
                        `}>
                            {diff.label}
                        </h3>
                        <p className={`font-bold tracking-[0.2em] text-sm 
                            ${difficulty === diff.value ? 'text-slate-200' : 'text-primary/60'}
                        `}>
                            {diff.grid}
                        </p>
                    </div>

                    {/* Recommended Tag */}
                    {diff.recommended && (
                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background-dark text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(13,185,242,0.4)] z-20">
                            {t('common.recommended') || 'Recomendado'}
                        </div>
                    )}

                    {/* Selection Backdrop */}
                    {difficulty === diff.value && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent animate-pulse"></div>
                    )}
                    
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </button>
            ))}
        </div>
    );
};

export default DifficultySelector;
