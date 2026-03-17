'use client';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="bg-zinc-50 dark:bg-[#07050a] min-h-screen text-zinc-900 dark:text-cyan-50 font-sans selection:bg-[#00e5ff] selection:text-black transition-colors duration-300">
      {/* Background Grids & Scifi Accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-gradient-to-bl from-[#ff00ff]/10 dark:from-[#ff00ff]/20 to-transparent blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-gradient-to-tr from-[#00e5ff]/10 dark:from-[#00e5ff]/20 to-transparent blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Header HUD */}
        <header className="mb-16 border-b border-zinc-200 dark:border-cyan-900/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="relative">
            {/* HUD Bracket UI */}
            <div className="absolute -left-4 top-0 w-2 h-2 border-t-2 border-l-2 border-[#00e5ff]"></div>
            <div className="absolute -left-4 bottom-0 w-2 h-2 border-b-2 border-l-2 border-[#00e5ff]"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#00e5ff] animate-pulse">policy</span>
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#00e5ff] uppercase">Protocol Division</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2">
              {t('footer.legal.privacyTitle') || 'Política de Privacidad'}
            </h1>
            <p className="text-sm font-mono text-zinc-500 dark:text-cyan-500/60 uppercase tracking-widest">
              DOC_ID: SHK-PRV-99 // REV: 3.1
            </p>
          </div>

          <div className="flex bg-white dark:bg-black/40 border border-zinc-200 dark:border-cyan-900/50 p-3 rounded-lg backdrop-blur-sm self-start">
            <div className="text-center px-4 border-r border-zinc-200 dark:border-cyan-900/50">
              <div className="text-[9px] text-zinc-500 dark:text-cyan-500/60 font-mono mb-1">STATUS</div>
              <div className="text-xs font-bold text-green-600 dark:text-green-400">ACTIVE</div>
            </div>
            <div className="text-center px-4">
              <div className="text-[9px] text-zinc-500 dark:text-cyan-500/60 font-mono mb-1">ENCRYPTION</div>
              <div className="text-xs font-bold text-[#ff00ff]">E2E</div>
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Quick Nav / Index (Left Sidebar) */}
          <aside className="lg:col-span-3 lg:col-start-1 h-max top-24 sticky hidden lg:block">
            <div className="bg-white/50 dark:bg-[#0a0f16]/80 border border-zinc-200 dark:border-cyan-900/30 rounded-xl p-6 backdrop-blur-md">
              <h2 className="text-[11px] font-mono tracking-widest text-[#00e5ff] uppercase mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                Índice de Datos
              </h2>
              <ul className="space-y-4 font-mono text-xs text-zinc-600 dark:text-cyan-100/70">
                <li className="hover:text-[#00e5ff] cursor-crosshair transition-colors flex items-center gap-3">
                  <span className="text-[9px] opacity-50">01</span> {t('legal.privacy.dataTitle') || 'Datos Recopilados'}
                </li>
                <li className="hover:text-[#00e5ff] cursor-crosshair transition-colors flex items-center gap-3">
                  <span className="text-[9px] opacity-50">02</span> {t('legal.privacy.purposeTitle') || 'Uso de Datos'}
                </li>
                <li className="hover:text-[#ff00ff] cursor-crosshair transition-colors flex items-center gap-3">
                  <span className="text-[9px] opacity-50">03</span> {t('legal.privacy.rightsTitle') || 'Derechos ARCO'}
                </li>
                <li className="hover:text-[#00e5ff] cursor-crosshair transition-colors flex items-center gap-3">
                  <span className="text-[9px] opacity-50">04</span> Seguridad
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Document Text */}
          <main className="lg:col-span-9 space-y-12">
            
            {/* Section 1: Data */}
            <section className="relative group">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <span className="text-[#00e5ff] font-mono text-xl opacity-50">{'>'}</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#00e5ff]/10 text-[#00e5ff] text-xs py-1 px-2 font-mono rounded">01</span>
                {t('legal.privacy.dataTitle') || 'Datos que Procesamos'}
              </h2>
              <div className="bg-white/80 dark:bg-black/20 border border-zinc-200 dark:border-white/5 p-6 rounded-lg text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 shadow-sm">
                <p className="mb-4">{t('legal.privacy.dataDesc')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="border border-zinc-200 dark:border-cyan-900/30 p-4 rounded bg-zinc-50/50 dark:bg-[#07050a]">
                    <h4 className="font-mono text-[10px] text-[#00e5ff] uppercase mb-2">Telemetría (Auto)</h4>
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
            <section className="relative group">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <span className="text-[#00e5ff] font-mono text-xl opacity-50">{'>'}</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#00e5ff]/10 text-[#00e5ff] text-xs py-1 px-2 font-mono rounded">02</span>
                {t('legal.privacy.purposeTitle') || 'Directivas de Uso'}
              </h2>
              <div className="bg-white/80 dark:bg-black/20 border-l-2 border-[#00e5ff] p-6 rounded-r-lg text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 shadow-sm">
                <p>{t('legal.privacy.purposeDesc')}</p>
                <ul className="list-disc pl-5 mt-4 space-y-2 opacity-80">
                   <li>{t('legal.privacy.purposePoint1') || 'Para personalizar la experiencia (Switch/Classic mode).'}</li>
                   <li>{t('legal.privacy.purposePoint2') || 'Para mostrar los rankings globales.'}</li>
                   <li>{t('legal.privacy.purposePoint3') || 'Para la funcionalidad de los chatbots.'}</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Rights (Highlighted) */}
            <section className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff00ff]/5 to-transparent rounded-lg -z-10"></div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3 pt-4 px-4">
                <span className="bg-[#ff00ff]/10 text-[#ff00ff] text-xs py-1 px-2 font-mono rounded">03</span>
                {t('legal.privacy.rightsTitle') || 'Control del Usuario'}
              </h2>
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-cyan-50/80 mb-6 font-medium">
                  {t('legal.privacy.rightsDesc') || 'Tienes derecho total a controlar tu huella en el sistema.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff00ff] border border-zinc-200 dark:border-[#ff00ff]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff00ff] hover:text-white transition-colors">{t('legal.privacy.rightsPoint1') || 'Solicitar Acceso'}</span>
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff00ff] border border-zinc-200 dark:border-[#ff00ff]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff00ff] hover:text-white transition-colors">{t('legal.privacy.rightsPoint2') || 'Modificar'}</span>
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-[#1a1025] text-zinc-700 dark:text-[#ff00ff] border border-zinc-200 dark:border-[#ff00ff]/30 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-default hover:bg-[#ff00ff] hover:text-white transition-colors">{t('legal.privacy.rightsPoint3') || 'Eliminación DB'}</span>
                </div>
              </div>
            </section>

            {/* Section 4: Security (Tech format) */}
            <section className="relative group">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="bg-[#00e5ff]/10 text-[#00e5ff] text-xs py-1 px-2 font-mono rounded">04</span>
                Seguridad & IA
              </h2>
              <div className="font-mono text-xs bg-zinc-900 dark:bg-[#050b14] text-green-400 dark:text-cyan-400 p-6 rounded-lg border border-zinc-800 dark:border-[#00e5ff]/20 shadow-inner">
                <div className="flex justify-between border-b border-zinc-800 dark:border-cyan-900/50 pb-2 mb-4">
                  <span className="opacity-50">LOG: SEC_SYSTEM_INIT</span>
                  <span>[OK]</span>
                </div>
                <p className="mb-4 leading-relaxed font-sans text-sm text-zinc-300 dark:text-cyan-100/90">
                  {t('legal.privacy.aiDesc') || 'Toda interacción la procesa un LLM y no guarda datos personales para entrenar futuros modelos.'}
                </p>
                <p className="mb-2 text-[#00e5ff]">&gt; Ejecutando protocolos de almacenamiento seguro...</p>
                <p className="opacity-70">&gt; Chatbot interacciones procesadas localmente / servers anónimos.</p>
                <div className="mt-4 flex gap-2">
                  <span className="inline-block w-2 h-4 bg-[#00e5ff] animate-pulse"></span>
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
