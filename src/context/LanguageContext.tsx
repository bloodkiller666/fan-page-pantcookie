'use client';
import { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState('es');

    const t = (path: string) => {
        const keys = path.split('.');
        let value: any = translations[language as keyof typeof translations];

        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                // Fallback to Spanish if key missing
                let fallback: any = translations['es'];
                for (const k of keys) {
                    if (fallback && fallback[k]) {
                        fallback = fallback[k];
                    } else {
                        return path; // Return key if not found
                    }
                }
                return fallback;
            }
        }
        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
