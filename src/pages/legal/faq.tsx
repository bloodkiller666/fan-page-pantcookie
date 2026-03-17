'use client';
import Head from 'next/head';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

import { FaChevronDown } from 'react-icons/fa';

interface FaqItem {
  question: string;
  answer: string;
  borderColor: string;
  questionColor: string;
}

const faqStyles = [
  { borderColor: "border-[#ff00ff]", questionColor: "text-[#ff00ff]" },
  { borderColor: "border-[#00ffff]", questionColor: "text-[#3b4cca]" },
  { borderColor: "border-[#ff00ff]", questionColor: "text-[#ff00ff]" },
  { borderColor: "border-[#00ffff]", questionColor: "text-[#00ffff]" },
  { borderColor: "border-[#ff00ff]", questionColor: "text-[#ff00ff]" },
  { borderColor: "border-[#00ffff]", questionColor: "text-[#00ffff]" }
];

export default function Faq() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqTranslations = t('legal.faqList') || [];
  const faqs = Array.isArray(faqTranslations) ? faqTranslations.map((item: any, index: number) => ({
    ...item,
    ...(faqStyles[index] || faqStyles[0])
  })) : [];

  return (
    <div className="min-h-screen bg-pattern pt-24 pb-16">
      <Head>
        <title>Preguntas Frecuentes | Pantcookie</title>
        <meta name="description" content="FAQ de Pantcookie: quién es ShuraHiwa, qué es la comunidad, juegos, rankings y contacto." />
      </Head>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
            {t('footer.legal.faqTitle') || 'Preguntas Frecuentes'}
          </h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((item: any, index: number) => (
            <div
              key={index}
              className={`poke-card overflow-hidden transition-all duration-300 ${activeIndex === index ? 'ring-2 ring-opacity-50 ' + item.borderColor.replace('border-', 'ring-') : ''}`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full p-6 flex items-center justify-between text-left focus:outline-none group"
              >
                <h2 className={`text-xl font-black uppercase tracking-widest transition-colors duration-300 ${item.questionColor} group-hover:opacity-80`}>
                  {item.question}
                </h2>
                <div
                  className={`text-2xl ${item.questionColor} transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : 'rotate-0'}`}
                >
                  <FaChevronDown />
                </div>
              </button>

                {activeIndex === index && (
                  <div>
                    <div className="px-6 pb-6 pt-0 border-t border-gray-100/10">
                      <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed mt-4">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
