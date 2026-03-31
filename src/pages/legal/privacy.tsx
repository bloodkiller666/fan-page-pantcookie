'use client';
import { useEffect, useRef } from 'react';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';
import { MdFormatListBulleted, MdPolicy } from 'react-icons/md';
import gsap from 'gsap';

export default function Privacy() {
  const { t } = useLanguage();
  const scifiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scifiRef.current) return;

    // Usamos el scope del ref para mayor precisión
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 7 });

      tl.to(".scifi-panel", { 
        skewX: () => Math.random() * 10 - 5, // Valores dinámicos
        x: () => Math.random() * 6 - 3,
        opacity: 0.5,
        duration: 0.05, 
        ease: "power4.inOut"
      })
      .to(".scifi-panel", { skewX: 0, x: 0, opacity: 1, duration: 0.05 })
      // Efecto de parpadeo de color más agresivo
      .to(".scifi-panel", { 
        filter: "hue-rotate(180deg) brightness(2)", 
        duration: 0.1 
      })
      .to(".scifi-panel", { filter: "none", duration: 0.1 });
    }, scifiRef); // El segundo parámetro asegura que solo anime cosas dentro de este componente

    return () => ctx.revert();
  }, []);

  return (
    <div ref={scifiRef} className="bg-zinc-50 dark:bg-[#0a0510] min-h-screen text-zinc-900 dark:text-[#f8f7ff] font-sans selection:bg-[#ff007f] selection:text-white transition-colors duration-300">
      {/* Background Grids & Scifi Accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#ff007f 1px, transparent 1px), linear-gradient(90deg, #ff007f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-gradient-to-bl from-[#ff007f]/10 dark:from-[#ff007f]/20 to-transparent blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-gradient-to-tr from-[#635994]/10 dark:from-[#635994]/20 to-transparent blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header HUD */}
        <header className="mb-16 border-b border-zinc-200 dark:border-[#635994]/40 pb-8 flex flex-col gap-8 scifi-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div className="relative">
              {/* HUD Bracket UI */}
              <div className="absolute -left-4 top-0 w-2 h-2 border-t-2 border-l-2 border-[#ff007f]"></div>
              <div className="absolute -left-4 bottom-0 w-2 h-2 border-b-2 border-l-2 border-[#ff007f]"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <MdPolicy className="text-[#ff007f] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-[#ff007f] uppercase">Protocol Division</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2">
                {t('footer.legal.privacyTitle') || 'Política de Privacidad'}
              </h1>
              <p className="text-sm font-mono text-zinc-500 dark:text-cyan-500/60 uppercase tracking-widest">
                DOC_ID: SHK-PRV-99 // REV: 3.1
              </p>
            </div>

            <div className="flex bg-white dark:bg-black/40 border border-zinc-200 dark:border-cyan-900/50 p-3 rounded-lg backdrop-blur-sm self-start md:self-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
              <div className="text-center px-4 border-r border-zinc-200 dark:border-cyan-900/50">
                <div className="text-[9px] text-zinc-500 dark:text-cyan-500/60 font-mono mb-1">STATUS</div>
                <div className="text-xs font-bold text-green-600 dark:text-green-400">ACTIVE</div>
              </div>
              <div className="text-center px-4">
                <div className="text-[9px] text-zinc-500 dark:text-cyan-500/60 font-mono mb-1">ENCRYPTION</div>
                <div className="text-xs font-bold text-[#635994]">E2E</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Quick Nav / Index (Left Sidebar) */}
          <aside className="lg:col-span-3 lg:col-start-1 h-max top-24 sticky hidden lg:block">
            <div className="bg-white/50 dark:bg-[#150f1f]/80 border border-zinc-200 dark:border-[#635994]/30 rounded-xl p-6 backdrop-blur-md shadow-[0_0_20px_rgba(99,89,148,0.1)]">
              <h2 className="text-[11px] font-mono tracking-widest text-[#ff007f] uppercase mb-6 flex items-center gap-2">
                <MdFormatListBulleted className="text-[14px]" />
                Índice de Datos
              </h2>
              <ul className="space-y-4 font-mono text-xs text-zinc-600 dark:text-[#f8f7ff]/70">
                <li 
                  onClick={() => document.getElementById('data')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#ff007f] cursor-pointer transition-colors flex items-center gap-3"
                >
                  <span className="text-[9px] opacity-50">01</span> {t('legal.privacy.dataTitle')}
                </li>
                <li 
                  onClick={() => document.getElementById('purpose')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#ff007f] cursor-pointer transition-colors flex items-center gap-3"
                >
                  <span className="text-[9px] opacity-50">02</span> {t('legal.privacy.purposeTitle')}
                </li>
                <li 
                  onClick={() => document.getElementById('rights')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#635994] cursor-pointer transition-colors flex items-center gap-3"
                >
                  <span className="text-[9px] opacity-50">03</span> {t('legal.privacy.rightsTitle')}
                </li>
                <li 
                  onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#00e5ff] cursor-pointer transition-colors flex items-center gap-3"
                >
                  <span className="text-[9px] opacity-50">04</span> Seguridad
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Document Text */}
          <main className="lg:col-span-9 space-y-12">
            
            {/* Section 1: Data */}
            <section id="data" className="relative group scifi-panel">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <span className="text-[#ff007f] font-mono text-xl opacity-50">{'>'}</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#ff007f]/10 text-[#ff007f] text-xs py-1 px-2 font-mono rounded">01</span>
                {t('legal.privacy.dataTitle') || 'Datos que Procesamos'}
              </h2>
              <div className="bg-white/80 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-6 rounded-lg text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 shadow-sm">
                <p className="mb-4">{t('legal.privacy.dataDesc')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="border border-zinc-200 dark:border-cyan-900/30 p-4 rounded bg-zinc-50/50 dark:bg-[#07050a]">
                    <h4 className="font-mono text-[10px] text-[#ff007f] uppercase mb-2">Telemetría (Auto)</h4>
                    <p className="text-xs">{t('legal.privacy.dataPoint1') || 'No se recogen direcciones IP, ubicación o datos de tráfico.'}</p>
                    <p className="text-xs mt-2">{t('legal.privacy.dataPoint3') || 'Se usa solo local storage para configuración.'}</p>
                  </div>
                  <div className="border border-zinc-200 dark:border-cyan-900/30 p-4 rounded bg-zinc-50/50 dark:bg-[#07050a]">
                    <h4 className="font-mono text-[10px] text-[#ff00ff] uppercase mb-2">Input Usuario</h4>
                    <p className="text-xs">{t('legal.privacy.dataPoint2') || 'Nombre para rankings se guarda temporalmente (se borra en 30 días).'}</p>
                    <p className="text-xs mt-2">{t('legal.privacy.userContentDesc1') || 'Al enviar mensajes conectamos usando firebase anónimamente.'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Purpose */}
            <section id="purpose" className="relative group scifi-panel">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <span className="text-[#ff007f] font-mono text-xl opacity-50">{'>'}</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#ff007f]/10 text-[#ff007f] text-xs py-1 px-2 font-mono rounded">02</span>
                {t('legal.privacy.purposeTitle') || 'Directivas de Uso'}
              </h2>
              <div className="bg-white/80 dark:bg-black/20 border-l-2 border-[#ff007f] p-6 rounded-r-lg text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 shadow-sm">
                <p>{t('legal.privacy.purposeDesc')}</p>
                <ul className="list-disc pl-5 mt-4 space-y-2 opacity-80">
                   <li>{t('legal.privacy.purposePoint1') || 'Para personalizar la experiencia (Switch/Classic mode).'}</li>
                   <li>{t('legal.privacy.purposePoint2') || 'Para mostrar los rankings globales.'}</li>
                   <li>{t('legal.privacy.purposePoint3') || 'Para la funcionalidad de los chatbots.'}</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Rights (Highlighted) */}
            <section id="rights" className="relative group scifi-panel">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff007f]/5 to-transparent rounded-lg -z-10"></div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3 pt-4 px-4">
                <span className="bg-[#ff007f]/10 text-[#ff007f] text-xs py-1 px-2 font-mono rounded">03</span>
                {t('legal.privacy.rightsTitle') || 'Control del Usuario'}
              </h2>
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 mb-6 font-medium">
                  {t('legal.privacy.rightsDesc') || 'Tienes derecho total a controlar tu huella en el sistema.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff007f] border border-zinc-200 dark:border-[#ff007f]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff007f] hover:text-white transition-colors">{t('legal.privacy.rightsPoint1') || 'Solicitar Acceso'}</span>
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff007f] border border-zinc-200 dark:border-[#ff007f]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff007f] hover:text-white transition-colors">{t('legal.privacy.rightsPoint2') || 'Modificar'}</span>
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff007f] border border-zinc-200 dark:border-[#ff007f]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff007f] hover:text-white transition-colors">{t('legal.privacy.rightsPoint3') || 'Eliminación DB'}</span>
                </div>
              </div>
            </section>

            {/* Section 4: Security (Tech format) */}
            <section id="security" className="relative group scifi-panel">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#ff007f]/10 text-[#ff007f] text-xs py-1 px-2 font-mono rounded">04</span>
                Seguridad & IA
              </h2>
              <div className="font-mono text-xs bg-zinc-900 dark:bg-[#050b14] text-green-400 dark:text-[#ff007f] p-6 rounded-lg border border-zinc-800 dark:border-[#ff007f]/20 shadow-inner">
                <div className="flex justify-between border-b border-zinc-800 dark:border-cyan-900/50 pb-2 mb-4">
                  <span className="opacity-50">LOG: SEC_SYSTEM_INIT</span>
                  <span>[OK]</span>
                </div>
                <p className="mb-4 leading-relaxed font-sans text-sm text-zinc-300 dark:text-cyan-100/90">
                  {t('legal.privacy.aiDesc') || 'Toda interacción la procesa un LLM y no guarda datos personales para entrenar futuros modelos.'}
                </p>
                <p className="mb-2 text-[#ff007f]">&gt; Ejecutando protocolos de almacenamiento seguro...</p>
                <p className="opacity-70">&gt; Chatbot interacciones procesadas localmente / servers anónimos.</p>
                <div className="mt-4 flex gap-2">
                  <span className="inline-block w-2 h-4 bg-[#ff007f] animate-pulse"></span>
                </div>
              </div>
            </section>
            
            {/* Additional Info Section */}
            <section className="pt-8 border-t border-zinc-200 dark:border-cyan-900/30">
               <p className="text-sm text-zinc-500 dark:text-cyan-500/60 font-mono">
                  {t('legal.privacy.storageDesc') || 'Por ahora todo es client-side por lo que es seguro.'}
               </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
