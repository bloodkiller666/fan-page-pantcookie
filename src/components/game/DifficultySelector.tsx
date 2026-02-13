import { useLanguage } from '../../context/LanguageContext';

const DifficultySelector = ({ difficulty, onSelectDifficulty, disabled }) => {
    const { t } = useLanguage();
    const difficulties = [
        { value: 'easy', label: t('games.difficultyOptions.easy'), grid: '4x4', pieces: 16, color: 'bg-green-500 hover:bg-green-600' },
        { value: 'medium', label: t('games.difficultyOptions.medium'), grid: '6x6', pieces: 36, color: 'bg-yellow-500 hover:bg-yellow-600' },
        { value: 'hard', label: t('games.difficultyOptions.hard'), grid: '8x8', pieces: 64, color: 'bg-red-500 hover:bg-red-600' },
    ];

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
                {t('games.difficultyOptions.select')}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
                {difficulties.map((diff) => (
                    <button
                        key={diff.value}
                        onClick={() => onSelectDifficulty(diff.value)}
                        disabled={disabled}
                        className={`px-6 py-4 rounded-xl transition-all duration-300 transform group relative overflow-hidden ${difficulty === diff.value
                            ? `${diff.color} scale-110 shadow-lg ring-4 ring-offset-2 ring-${diff.color.split('-')[1]}-300`
                            : `bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:scale-105 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
                            }`}
                    >
                        {/* Highlight Effect */}
                        {difficulty === diff.value && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}

                        <div className={`font-bold text-lg ${difficulty === diff.value ? 'text-white' : ''}`}>
                            {diff.label}
                        </div>
                        <div className={`text-sm opacity-80 ${difficulty === diff.value ? 'text-white' : ''}`}>
                            {diff.grid} ({diff.pieces} {t('Piezas') || 'Piezas'})
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DifficultySelector;
