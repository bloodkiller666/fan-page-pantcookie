'use client';
import Head from 'next/head';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface FaqItem {
  question: string;
  answer: string;
  borderColor: string;
  questionColor: string;
}

const faqData: FaqItem[] = [
  {
    question: "¿Quién es ShuraHiwa?",
    answer: "VTuber y líder de la ShakeGang. Esta fan page celebra su contenido y a la comunidad.",
    borderColor: "border-[#ff00ff]",
    questionColor: "text-[#ff00ff]"
  },
  {
    question: "¿Qué es un Pantcookie?",
    answer: "Miembros de la comunidad. Participan en juegos, eventos y actividades creativas.",
    borderColor: "border-[#00ffff]",
    questionColor: "text-[#3b4cca]"
  },
  {
    question: "¿Cómo funcionan los juegos y rankings?",
    answer: "Son recreativos. Guardamos puntajes locales y, en algunos casos, rankings para motivar la participación.",
    borderColor: "border-[#ff00ff]",
    questionColor: "text-[#ff00ff]"
  },
  {
    question: "¿Cómo me uno?",
    answer: "Únete a los canales de la comunidad y participa en el chat y los eventos.",
    borderColor: "border-[#00ffff]",
    questionColor: "text-[#00ffff]"
  },
  {
    question: "¿Se recopilan datos personales?",
    answer: "Solo los necesarios para la experiencia. Consulta la Política de Privacidad para más detalles.",
    borderColor: "border-[#ff00ff]",
    questionColor: "text-[#ff00ff]"
  },
  {
    question: "¿Dónde contacto?",
    answer: "Usa los canales oficiales de la comunidad. Responderemos en la medida de lo posible.",
    borderColor: "border-[#00ffff]",
    questionColor: "text-[#00ffff]"
  }
];

export default function Faq() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
          {faqData.map((item, index) => (
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
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`text-2xl ${item.questionColor}`}
                >
                  <FaChevronDown />
                </motion.div>
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 border-t border-gray-100/10">
                      <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed mt-4">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
