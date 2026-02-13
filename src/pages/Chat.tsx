'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ChatInterface from '../components/chat/ChatInterface';
import { useLanguage } from '../context/LanguageContext';

const Chat = () => {
    const { t } = useLanguage();
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
        });
        return () => ctx.revert();
    }, []);
    return (
        <div ref={containerRef} className="min-h-screen bg-pattern py-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1 rounded-full border border-[#ff00ff]/30 bg-[#ff00ff]/10 text-[#ff00ff] text-[10px] uppercase tracking-[0.3em] font-black mb-6 animate-pulse">
                        Neural Interface // Chat v2.0
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black neon-text-pink mb-6 uppercase italic tracking-tighter">
                        {t('chat.title')}
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium tracking-wide uppercase text-xs tracking-[0.2em]">
                        {t('chat.subtitle')}
                    </p>
                </div>

                {/* Chat Widget Container */}
                <div className="w-full max-w-lg mx-auto transform hover:scale-[1.01] transition-all duration-500 bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-3xl p-1 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="p-1 rounded-[22px] bg-gradient-to-br from-[#ff00ff]/20 to-[#00ffff]/20">
                        <ChatInterface />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
