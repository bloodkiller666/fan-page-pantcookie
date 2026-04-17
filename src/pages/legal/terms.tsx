'use client';
import { useEffect } from 'react';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';
import { MdAdminPanelSettings, MdCloudDone, MdCookie, MdCopyright, MdGavel, MdQrCode2, MdSecurity, MdTerminal, MdVerifiedUser } from 'react-icons/md';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Terms() {
  const { t } = useLanguage();

  useEffect(() => {
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".card-premium");

      cards.forEach((card, index) => {
        gsap.from(card, {
          duration: 1.3,
          clipPath: "inset(100% 0% 0% 0%)",
          rotationX: -15,
          transformOrigin: "50% 100%",
          opacity: 0,
          y: 60,
          ease: "power4.out",
          delay: index * 0.4,
          scrollTrigger: {
            trigger: card,
            scroller: "#legal-scroll-container",
            start: "top 95%",
            toggleActions: "play none none none",
            once: true,
          }
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-background-light dark:bg-[#0a0510] font-display text-zinc-900 dark:text-[#f8f7ff] min-h-screen relative overflow-x-hidden selection:bg-[#ff007f] selection:text-white transition-colors duration-300">
      <Head>
        <title>{t('footer.legal.termsTitle') || 'Términos y Condiciones'} | SHAKE-GANG</title>
        <meta name="description" content="Términos y condiciones de uso de SHAKE-GANG." />
        <link rel="icon" href="https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png" />
      </Head>
      {/* Ambient Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff007f]/10 blur-[150px] rounded-full animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#635994]/10 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      <main className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 md:p-8 pt-8 md:pt-12">
        <div className="max-w-7xl w-full h-full flex gap-6 items-stretch">
          {/* Side Navigation / Progress Indicator */}
          <aside className="hidden lg:flex flex-col justify-between w-24 py-8 bg-black/5 dark:bg-[#150f1f]/90 backdrop-blur-xl border border-zinc-200 dark:border-[#ff007f]/30 rounded-lg items-center relative overflow-hidden">
            <div className="flex flex-col items-center gap-8">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff007f] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                <MdSecurity className="text-[#ff007f]" />
              </div>
              <div className="w-[2px] h-20 bg-gradient-to-b from-[#ff007f] to-transparent"></div>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[2px] h-20 bg-gradient-to-t from-[#635994] to-transparent"></div>
              <div className="w-12 h-12 rounded-lg bg-[#635994]/10 flex items-center justify-center border border-[#635994]/30">
                <MdGavel className="text-[#635994]" />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-white/60 dark:bg-[#0f0a14]/90 backdrop-blur-xl rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl">
            {/* Browser-like Header */}
            <header className="bg-zinc-100 dark:bg-gradient-to-r dark:from-[#1a1525] dark:to-[#0f0a14] p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                </div>
                <div className="h-4 w-px bg-zinc-300 dark:bg-white/10 mx-2"></div>
                <div className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-slate-500 uppercase flex items-center gap-2">
                  <MdTerminal className="text-[14px]" />
                  SYS_LINK // LEGAL_PROTOCOL_042
                </div>
              </div>
              <div className="hidden sm:block text-[10px] font-mono text-[#00e5ff] animate-pulse">
                &gt; ENCRYPTION_ACTIVE: AES-256
              </div>
            </header>

            {/* Title Section */}
            <div className="px-8 pt-10 pb-6">
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#ff007f] dark:via-[#635994] dark:to-[#ff007f] dark:bg-[length:200%_auto] dark:animate-gradient-x leading-none">
                {t('footer.legal.termsTitle') || 'Términos y Condiciones'}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="bg-[#ff007f]/10 dark:bg-[#ff007f]/20 text-[#ff007f] text-[10px] px-2 py-0.5 font-mono border border-[#ff007f]/30 uppercase">v2.4.0 ALPHA</span>
                <p className="text-zinc-500 dark:text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                  Última actualización: 24.OCT.2023 // LOC: 40.7128° N
                </p>
              </div>
            </div>

            {/* Scrollable Cards */}
            <div id="legal-scroll-container" className="flex-1 overflow-y-auto px-8 pb-12 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#635994] [&::-webkit-scrollbar-thumb]:shadow-[0_0_10px_#635994] [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Section 01 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#ff007f]/20 hover:border-[#ff007f]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#ff007f] text-[9px] font-bold tracking-tighter text-white uppercase shadow-[0_0_10px_rgba(255,0,127,0.3)]">01 // Access</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#ff007f] transition-colors flex items-center gap-2">
                      {t('legal.terms.acceptanceTitle')}
                    </h3>
                    <MdVerifiedUser className="text-[#ff007f]/30 group-hover:text-[#ff007f] transition-colors" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed font-medium">
                    {t('legal.terms.acceptanceDesc')}
                  </p>
                </div>

                {/* Section 02 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#635994]/20 hover:border-[#635994]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#635994] text-[9px] font-bold tracking-tighter text-white uppercase shadow-[0_0_10px_rgba(99,89,148,0.3)]">02 // Behavior</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#635994] transition-colors">{t('legal.terms.usageTitle')}</h3>
                    <MdTerminal className="text-[#635994]/30 group-hover:text-[#635994]" />
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-[#f8f7ff]/70">
                    <p>{t('legal.terms.usageDesc1')}</p>
                    <ul className="space-y-2 font-mono text-[13px]">
                      <li className="flex gap-3">
                        <span className="text-[#ff007f]">01.</span>
                        <span>{t('legal.terms.usagePoint1')}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#ff007f]">02.</span>
                        <span>{t('legal.terms.usagePoint2')}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 03 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#ff007f]/20 hover:border-[#ff007f]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#ff007f] text-[9px] font-bold tracking-tighter text-white uppercase">03 // IP Assets</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#ff007f] transition-colors">{t('legal.terms.intellectualTitle')}</h3>
                    <MdCopyright className="text-[#ff007f]/30 group-hover:text-[#ff007f]" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed">
                    {t('legal.terms.intellectualDesc')}
                  </p>
                </div>

                {/* Section 04 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#635994]/20 hover:border-[#635994]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#635994] text-[9px] font-bold tracking-tighter text-white uppercase">04 // Data</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#635994] transition-colors">{t('legal.terms.userContentTitle')}</h3>
                    <MdCloudDone className="text-[#635994]/30 group-hover:text-[#635994]" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed font-mono italic bg-zinc-200/50 dark:bg-[#635994]/5 p-3 border-l-2 border-zinc-300 dark:border-[#635994]/40">
                    &gt; {t('legal.terms.userContentDesc')}
                  </p>
                </div>

                {/* Section 05 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#ff007f]/20 hover:border-[#ff007f]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#ff007f] text-[9px] font-bold tracking-tighter text-white uppercase">05 // Cookies</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#ff007f] transition-colors">{t('legal.terms.cookiesTitle')}</h3>
                    <MdCookie className="text-[#ff007f]/30 group-hover:text-[#ff007f]" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed">
                    {t('legal.terms.cookiesDesc')}
                  </p>
                </div>

                {/* Section 06 */}
                <div className="group relative p-6 bg-zinc-50 dark:bg-[#150f1f]/40 border border-zinc-200 dark:border-[#635994]/20 hover:border-[#635994]/40 transition-all duration-300 rounded-lg card-premium">
                  <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#635994] text-[9px] font-bold tracking-tighter text-white uppercase">06 // Control</div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[#635994] transition-colors">{t('legal.terms.moderationTitle')}</h3>
                    <MdAdminPanelSettings className="text-[#635994]/30 group-hover:text-[#635994]" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed">
                    {t('legal.terms.moderationDesc')}
                  </p>

                  {/* Additional Content Block if needed */}
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[#635994] transition-colors mt-4">{t('legal.terms.recreationalTitle')}</h3>
                  <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70 leading-relaxed mt-2">
                    {t('legal.terms.recreationalDesc')}
                  </p>
                </div>
              </div>

              {/* Updates Section */}
              <div className="mt-6 p-6 bg-zinc-50 dark:bg-[#150f1f]/20 border border-zinc-200 dark:border-[#ff007f]/20 rounded-lg border-l-4 border-l-[#ff007f] card-premium">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('legal.terms.changesTitle')}</h3>
                <p className="text-sm text-zinc-600 dark:text-[#f8f7ff]/70">{t('legal.terms.changesDesc')}</p>
              </div>

            </div>

            {/* Footer Bar */}
            <footer className="p-3 bg-zinc-100 dark:bg-[#0a0510]/80 border-t border-zinc-200 dark:border-[#635994]/20 flex flex-wrap items-center justify-between px-8 text-[9px] font-mono text-zinc-500 dark:text-slate-500 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-pulse shadow-[0_0_5px_#ff007f]"></div>
                  STATUS: COMPLIANT
                </div>
                <div className="hidden sm:block">COORD: 34.0522° N, 118.2437° W</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-zinc-300 dark:text-white/10">|</span>
                <div className="flex items-center gap-1 text-[#facc15] ml-2">
                  <MdQrCode2 className="text-[10px]" />
                  AUTH_V
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
