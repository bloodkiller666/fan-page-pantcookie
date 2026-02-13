import React from 'react';
import { FiUser } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

interface PlayerInputProps {
    playerName: string;
    onNameChange: (name: string) => void;
    onStartGame: () => void;
    hideButton?: boolean;
}

const PlayerInput = ({ playerName, onNameChange, onStartGame, hideButton = false }: PlayerInputProps) => {
    const { t } = useLanguage();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStartGame();
    };

    return (
        <div className="max-w-md mx-auto my-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="playerName" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {t('common.enterName')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="playerName"
                            value={playerName}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder={t('common.namePlaceholder')}
                            maxLength={20}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-transparent transition"
                            required
                        />
                    </div>
                </div>

                {!hideButton && (
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary-pink to-primary-blue text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
                    >
                        {t('common.startGame')}
                    </button>
                )}
            </form>
        </div>
    );
};

export default PlayerInput;
