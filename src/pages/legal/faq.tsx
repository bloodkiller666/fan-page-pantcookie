'use client';
import Head from 'next/head';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HiChevronDown } from 'react-icons/hi';
import { FiSearch } from 'react-icons/fi';

export default function Faq() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const faqCategories = t('legal.faqCategories') || {};
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setActiveIndex(activeIndex === key ? null : key);
  };

  const categories = Object.keys(faqCategories);

  return (
    <div className="min-h-screen text-shake-on-surface font-shake selection:bg-shake-primary/30 relative overflow-x-hidden pb-16">
      <Head>
        <title>{t('footer.legal.faqTitle') || 'Preguntas Frecuentes'} | SHAKE-GANG</title>
        <meta name="description" content="Centro de soporte y preguntas frecuentes de SHAKE-GANG." />
      </Head>

      {/* Background Decoration */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40"></div>

      <main className="relative z-0 flex-grow container mx-auto px-6 max-w-4xl">
        {/* Header Section */}
        <header className="text-center mb-16 space-y-6">
          <div className="inline-block px-4 py-1 rounded-full bg-shake-secondary/10 border border-shake-secondary/20 text-shake-secondary text-[10px] font-black tracking-[0.3em] uppercase mb-4">
            {t('legal.supportCenter') || 'Centro de Soporte'}
          </div>
          <h1 className="font-shakeHeadline text-5xl md:text-8xl font-black italic tracking-tighter text-shake-primary neon-glow-primary-strong mb-2 uppercase">
            {t('footer.legal.faqTitle') || 'PREGUNTAS FRECUENTES'}
          </h1>
          <p className="text-shake-on-surface-variant/80 text-lg md:text-xl max-w-2xl mx-auto font-shake leading-relaxed">
            {t('legal.faqSubtitle') || 'Todo lo que necesitas saber para dominar el ecosistema de SHAKE-GANG. Si no encuentras lo que buscas, nuestro equipo está a un clic de distancia.'}
          </p>
        </header>

        {/* Search Bar */}
        <section className="mb-20">
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-20">
              <FiSearch className="text-shake-primary text-2xl filter drop-shadow-[0_0_8px_rgba(255,46,126,0.8)]" />
            </div>
            <input
              className="w-full bg-white/10 dark:bg-[#1A1A2E]/60 border border-black/5 dark:border-white/5 backdrop-blur-xl rounded-2xl py-6 pl-16 pr-8 text-shake-on-surface placeholder:text-shake-on-surface-variant/30 focus:ring-2 focus:ring-shake-primary/20 transition-all font-shake shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              placeholder={t('legal.searchPlaceholder') || "Busca una respuesta..."}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-shake-primary/20 transition-colors"></div>
          </div>
        </section>

        {/* FAQ Categories Loop */}
        <div className="space-y-20">
          {categories.map((catId) => {
            const category = faqCategories[catId];
            const isTechnical = catId === 'technical';
            const accentColor = isTechnical ? 'text-cyan-400' : 'text-shake-primary';
            const bgColor = isTechnical ? 'bg-cyan-500/5' : 'bg-shake-primary/5';
            const borderColor = isTechnical ? 'border-cyan-500/20' : 'border-shake-primary/20';
            const glowClass = isTechnical ? 'neon-glow-secondary' : 'neon-glow-primary';

            return (
              <section key={catId} className="space-y-6">
                <h2 className={`font-shakeHeadline text-sm font-black tracking-[0.4em] uppercase text-center mb-10 ${accentColor} ${glowClass}`}>
                  {category.title}
                </h2>

                <div className="grid gap-4">
                  {category.items
                    .filter((item: any) =>
                      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item: any, index: number) => {
                      const itemKey = `${catId}-${index}`;
                      const isOpen = activeIndex === (itemKey as any);

                      return (
                        <div
                          key={index}
                          className={`group ${bgColor} border ${borderColor} rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/5 backdrop-blur-sm ${isOpen ? 'ring-1 ring-white/10 shadow-2xl' : ''}`}
                        >
                          <button
                            onClick={() => toggleAccordion(catId, index)}
                            className="w-full text-left p-6 md:p-8 flex justify-between items-center gap-6"
                          >
                            <span className={`font-shakeHeadline text-xl md:text-2xl font-bold ${accentColor} transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,46,126,0.3)]`}>
                              {item.question}
                            </span>
                            <HiChevronDown className={`${accentColor} transition-transform duration-500 text-3xl ${isOpen ? 'rotate-180 scale-125' : 'group-hover:scale-110'}`} />
                          </button>

                          <div
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                          >
                            <div className="px-6 md:px-8 pb-8 text-shake-on-surface-variant/90 font-shake text-base md:text-lg leading-relaxed border-t border-white/5 pt-6 mt-2 mx-4">
                              <p>{item.answer}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
