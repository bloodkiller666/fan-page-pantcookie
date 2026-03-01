'use client';
import { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState('es');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('pantcookie_lang');
        if (savedLang) {
            setLanguage(savedLang);
        }
        setMounted(true);
    }, []);

    const handleSetLanguage = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem('pantcookie_lang', lang);
    };

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
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {mounted ? children : <div className="min-h-screen bg-black" />}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
